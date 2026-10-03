const http = require('http');

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (body) headers['Content-Length'] = Buffer.byteLength(dataString);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        host: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers,
      },
      (res) => {
        let resBody = '';
        res.on('data', (c) => (resBody += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function runMasterVerification() {
  console.log('================================================================');
  console.log('  🌟 SPENDWISE FULL MASTER WORKFLOW VERIFICATION SUITE 🌟');
  console.log('================================================================\n');

  // 1. Health check
  const health = await apiCall('GET', '/health');
  console.log(`[1] API Health check: status=${health.status}, driver=${health.data?.database_driver}`);

  // 2. Demo User Login
  console.log('\n--- TESTING DEMO USER LOGIN ---');
  const demoLogin = await apiCall('POST', '/auth/login', { username: 'demo_user', password: 'Demo@123' });
  console.log(`[2] Demo Login Result: status=${demoLogin.status}, user=${demoLogin.data?.user?.username}`);
  const demoToken = demoLogin.data?.token;

  // 3. Register New User (test_user_001)
  console.log('\n--- TESTING REGISTRATION FLOW ---');
  const testUsername = `test_user_001_${Date.now()}`;
  const regRes = await apiCall('POST', '/auth/register', {
    name: 'Test User',
    username: testUsername,
    monthly_income: 50000,
    password: 'Test@123',
    confirmPassword: 'Test@123',
  });
  console.log(`[3] Registration Result: status=${regRes.status}, success=${regRes.data?.success}, user=${regRes.data?.user?.username}`);
  const userToken = regRes.data?.token;

  // 4. Login with newly registered user
  console.log('\n--- TESTING LOGIN WITH REGISTERED CREDENTIALS ---');
  const userLogin = await apiCall('POST', '/auth/login', { username: testUsername, password: 'Test@123' });
  console.log(`[4] User Login Result: status=${userLogin.status}, username=${userLogin.data?.user?.username}`);

  // 5. Add Income ₹50,000
  console.log('\n--- TESTING FINANCIAL FLOW (INCOME & EXPENSES) ---');
  const today = new Date().toISOString().split('T')[0];
  const incRes = await apiCall('POST', '/income', {
    source: 'Salary',
    amount: 50000,
    income_date: today,
    notes: 'Primary monthly salary',
  }, userToken);
  console.log(`[5] Add Income ₹50,000: status=${incRes.status}, id=${incRes.data?.income?.id}`);

  // Get categories to get Food, Transport, Bills category IDs
  const catRes = await apiCall('GET', '/categories', null, userToken);
  const categories = catRes.data?.categories || [];
  const foodCat = categories.find((c) => c.name.toLowerCase() === 'food') || categories[0];
  const transCat = categories.find((c) => c.name.toLowerCase() === 'transport') || categories[1];
  const billsCat = categories.find((c) => c.name.toLowerCase() === 'bills') || categories[2];

  // 6. Add Expense 1: ₹2,000 Food
  const exp1 = await apiCall('POST', '/expenses', {
    category_id: foodCat.id,
    description: 'Groceries and Supermarket',
    amount: 2000,
    payment_method: 'UPI',
    expense_date: today,
    notes: 'Weekly groceries',
  }, userToken);
  console.log(`[6] Add Expense ₹2,000 (Food): status=${exp1.status}`);

  // 7. Add Expense 2: ₹1,500 Transport
  const exp2 = await apiCall('POST', '/expenses', {
    category_id: transCat.id,
    description: 'Fuel and Commute',
    amount: 1500,
    payment_method: 'UPI',
    expense_date: today,
    notes: 'Petrol refill',
  }, userToken);
  console.log(`[7] Add Expense ₹1,500 (Transport): status=${exp2.status}`);

  // 8. Add Expense 3: ₹3,000 Bills
  const exp3 = await apiCall('POST', '/expenses', {
    category_id: billsCat.id,
    description: 'Electricity & Internet Bills',
    amount: 3000,
    payment_method: 'UPI',
    expense_date: today,
    notes: 'Monthly utility bill',
  }, userToken);
  console.log(`[8] Add Expense ₹3,000 (Bills): status=${exp3.status}`);

  // 9. Verify Dashboard Financial Calculations
  console.log('\n--- VERIFYING DASHBOARD & CALCULATIONS ---');
  const dashRes = await apiCall('GET', '/analytics/dashboard', null, userToken);
  const summary = dashRes.data?.summary;
  console.log(`[9] Dashboard Summary:
      Total Income:   ₹${summary?.total_income} (Expected: ₹50000)
      Total Expenses: ₹${summary?.total_expenses} (Expected: ₹6500)
      Net Balance:    ₹${summary?.balance} (Expected: ₹43500)
      Net Savings:    ₹${summary?.savings} (Expected: ₹43500)
      Surplus/Deficit: ${summary?.surplus_or_deficit}`);

  const mathValid = (summary?.total_income === 50000 && summary?.total_expenses === 6500 && summary?.balance === 43500);
  console.log(`Calculation Verification: ${mathValid ? '✅ PERFECT MATCH' : '❌ MISMATCH'}`);

  // 10. Create Budget for Food
  console.log('\n--- TESTING BUDGETS ---');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budRes = await apiCall('POST', '/budgets', {
    category_id: foodCat.id,
    month: currentMonth,
    year: currentYear,
    amount: 5000,
  }, userToken);
  console.log(`[10] Create Budget (Food: ₹5,000): status=${budRes.status}`);

  const budList = await apiCall('GET', `/budgets?month=${currentMonth}&year=${currentYear}`, null, userToken);
  const foodBud = budList.data?.budgets?.find((b) => b.category_id === foodCat.id);
  console.log(`[10b] Budget Check: Allocated=₹${foodBud?.amount}, Spent=₹${foodBud?.spent}, Progress=${foodBud?.percentage}%, Status=${foodBud?.status}`);

  // 11. Create Savings Goal
  console.log('\n--- TESTING SAVINGS GOALS ---');
  const goalRes = await apiCall('POST', '/savings-goals', {
    name: 'Emergency Fund',
    target_amount: 100000,
    current_amount: 15000,
    target_date: `${currentYear}-12-31`,
  }, userToken);
  console.log(`[11] Create Savings Goal: status=${goalRes.status}, id=${goalRes.data?.goal?.id}`);

  // 12. Test Reports Generation
  console.log('\n--- TESTING REPORTS GENERATION ---');
  const reportRes = await apiCall('GET', `/reports/monthly?month=${currentMonth}&year=${currentYear}`, null, userToken);
  console.log(`[12] Monthly Report Generated: status=${reportRes.status}, Report Type="${reportRes.data?.report_type}"`);
  console.log(`     Total Categories in Breakdown: ${reportRes.data?.category_breakdown?.length}`);

  // 13. Test Data Isolation
  console.log('\n--- TESTING STRICT MULTI-TENANT USER DATA ISOLATION ---');
  const demoExpRes = await apiCall('GET', '/expenses', null, demoToken);
  const demoExpenses = demoExpRes.data?.expenses || [];
  const testUserExpenses = (await apiCall('GET', '/expenses', null, userToken)).data?.expenses || [];

  const leakInDemo = demoExpenses.some((e) => e.description === 'Groceries and Supermarket');
  const leakInUser = testUserExpenses.some((e) => e.description === 'Broadband Internet & Electricity');

  console.log(`[13] Demo user cannot see Test user expense: ${!leakInDemo ? '✅ SECURE (ISOLATED)' : '❌ LEAK'}`);
  console.log(`[13b] Test user cannot see Demo user expense: ${!leakInUser ? '✅ SECURE (ISOLATED)' : '❌ LEAK'}`);

  console.log('\n================================================================');
  console.log('  🎉 ALL MASTER FLOW AUDIT & TEST SUITE CHECKS COMPLETED! 🎉');
  console.log('================================================================');
}

runMasterVerification().catch(console.error);
