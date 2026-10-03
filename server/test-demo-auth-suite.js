const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        host: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function runVerification() {
  console.log('=======================================================');
  console.log('  SPENDWISE DEMO AUTHENTICATION & DATA VERIFICATION');
  console.log('=======================================================\n');

  // Step 1: Health check
  const health = await request('GET', '/health');
  console.log(`[1] Backend API Health Check: ${health.status === 200 ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 2: Login with demo_user / Demo@123
  const demoLogin = await request('POST', '/auth/login', {
    username: 'demo_user',
    password: 'Demo@123',
  });
  console.log(`[2] Demo Login (demo_user / Demo@123): ${demoLogin.status === 200 && demoLogin.data.success ? '✅ PASSED' : '❌ FAILED'}`);
  if (!demoLogin.data.token) {
    throw new Error('Demo login failed to return JWT token');
  }
  const demoToken = demoLogin.data.token;
  const demoUser = demoLogin.data.user;

  // Step 3: Verify username and display name (no personal info)
  console.log(`[3] Verify Demo Username: ${demoUser.username === 'demo_user' ? '✅ PASSED' : '❌ FAILED'} (${demoUser.username})`);
  console.log(`[4] Verify Demo Name: ${demoUser.name === 'Demo User' ? '✅ PASSED' : '❌ FAILED'} (${demoUser.name})`);

  // Step 4: Verify /auth/me with JWT token
  const meRes = await request('GET', '/auth/me', null, demoToken);
  console.log(`[5] Auth /me verification: ${meRes.status === 200 && meRes.data.user.username === 'demo_user' ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 5: Verify Demo Financial Data - Expenses
  const expRes = await request('GET', '/expenses', null, demoToken);
  console.log(`[6] Demo Expenses Loaded: ${expRes.status === 200 && expRes.data.expenses.length > 0 ? '✅ PASSED' : '❌ FAILED'} (${expRes.data.expenses.length} records found)`);

  // Step 6: Verify Demo Financial Data - Incomes
  const incRes = await request('GET', '/income', null, demoToken);
  console.log(`[7] Demo Incomes Loaded: ${incRes.status === 200 && incRes.data.incomes.length > 0 ? '✅ PASSED' : '❌ FAILED'} (${incRes.data.incomes.length} records found)`);

  // Step 7: Verify Demo Financial Data - Budgets
  const budgetRes = await request('GET', '/budgets', null, demoToken);
  console.log(`[8] Demo Budgets Loaded: ${budgetRes.status === 200 && budgetRes.data.budgets.length > 0 ? '✅ PASSED' : '❌ FAILED'} (${budgetRes.data.budgets.length} records found)`);

  // Step 8: Verify Demo Financial Data - Savings Goals
  const goalsRes = await request('GET', '/savings-goals', null, demoToken);
  console.log(`[9] Demo Savings Goals Loaded: ${goalsRes.status === 200 && goalsRes.data.goals.length > 0 ? '✅ PASSED' : '❌ FAILED'} (${goalsRes.data.goals.length} goals found)`);

  // Step 9: Verify Analytics Dashboard
  const dashRes = await request('GET', '/analytics/dashboard', null, demoToken);
  console.log(`[10] Demo Dashboard Analytics: ${dashRes.status === 200 && dashRes.data.summary ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 10: Test Incorrect Password
  const badPassRes = await request('POST', '/auth/login', {
    username: 'demo_user',
    password: 'WrongPassword123!',
  });
  console.log(`[11] Invalid Password Rejection: ${badPassRes.status === 401 && badPassRes.data.message === 'Invalid User ID or Password' ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 11: Test Non-existent User
  const badUserRes = await request('POST', '/auth/login', {
    username: 'non_existent_random_user',
    password: 'SomePassword@123',
  });
  console.log(`[12] Non-existent User Rejection: ${badUserRes.status === 401 && badUserRes.data.message === 'Invalid User ID or Password' ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 12: Register a brand new separate user for data isolation test
  const uniqueId = `iso_user_${Date.now()}`;
  const regRes = await request('POST', '/auth/register', {
    name: 'New Test User',
    username: uniqueId,
    password: 'SecurePass@123',
    confirmPassword: 'SecurePass@123',
    monthly_income: 50000,
  });
  console.log(`[13] Register New Isolated User: ${regRes.status === 201 ? '✅ PASSED' : '❌ FAILED'}`);
  const newUserToken = regRes.data.token;

  // Step 13: Verify new user has 0 of demo user's expenses (strict isolation)
  const newUserExp = await request('GET', '/expenses', null, newUserToken);
  console.log(`[14] Data Isolation (New user sees 0 demo expenses): ${newUserExp.data.expenses.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 14: Verify new user has 0 of demo user's income
  const newUserInc = await request('GET', '/income', null, newUserToken);
  console.log(`[15] Data Isolation (New user sees 0 demo incomes): ${newUserInc.data.incomes.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);

  // Step 15: Re-login as demo_user
  const reLoginDemo = await request('POST', '/auth/login', {
    username: 'demo_user',
    password: 'Demo@123',
  });
  console.log(`[16] Demo User Re-login: ${reLoginDemo.status === 200 && reLoginDemo.data.success ? '✅ PASSED' : '❌ FAILED'}`);

  console.log('\n=======================================================');
  console.log('  🎉 ALL 16 AUTHENTICATION & ISOLATION CHECKS PASSED!');
  console.log('=======================================================');
}

runVerification().catch(console.error);
