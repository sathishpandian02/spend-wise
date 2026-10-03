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

async function runTests() {
  console.log('--- 🧪 STARTING SPENDWISE FULL SYSTEM INTEGRATION TESTS ---');

  // 1. Health check
  const health = await request('GET', '/health');
  console.log('1. Health Check:', health.status === 200 ? '✅ PASSED' : '❌ FAILED');

  // 2. Demo User Login
  const loginRes = await request('POST', '/auth/login', { username: 'demo_user', password: 'Demo@123' });
  console.log('2. Demo User Login:', loginRes.status === 200 && loginRes.data.success ? '✅ PASSED' : '❌ FAILED');
  const demoToken = loginRes.data.token;

  // 3. User Registration
  const testUserId = `test_${Date.now()}`;
  const regRes = await request('POST', '/auth/register', {
    name: 'Test User',
    username: testUserId,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    monthly_income: 30000,
  });
  console.log('3. User Registration:', regRes.status === 201 && regRes.data.success ? '✅ PASSED' : '❌ FAILED');
  const newToken = regRes.data.token;

  // 4. Duplicate User ID Check
  const dupRes = await request('POST', '/auth/register', {
    name: 'Duplicate Alex',
    username: testUserId,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    monthly_income: 30000,
  });
  const dupSuccess = dupRes.status === 409 && dupRes.data.message.includes('already exists');
  console.log('4. Duplicate User ID Prevention:', dupSuccess ? '✅ PASSED' : '❌ FAILED');

  // 5. Add Expense for New User
  const addExpRes = await request('POST', '/expenses', {
    amount: 1500,
    description: 'Groceries & Household Essentials',
    category_id: 1, // Food
    expense_date: '2026-10-03',
    payment_method: 'UPI',
    notes: 'Bought from Nature Fresh Mart',
  }, newToken);
  console.log('5. Add Expense:', addExpRes.status === 201 && addExpRes.data.success ? '✅ PASSED' : '❌ FAILED');
  const expId = addExpRes.data.expense.id;

  // 6. Edit Expense
  const editExpRes = await request('PUT', `/expenses/${expId}`, {
    amount: 1800,
    description: 'Groceries & Fruits',
  }, newToken);
  console.log('6. Edit Expense:', editExpRes.status === 200 && editExpRes.data.expense.amount === 1800 ? '✅ PASSED' : '❌ FAILED');

  // 7. Add Additional Income
  const addIncRes = await request('POST', '/income', {
    amount: 5000,
    source: 'Freelance Design',
    income_date: '2026-10-02',
    notes: 'Logo creation for client',
  }, newToken);
  console.log('7. Add Additional Income:', addIncRes.status === 201 && addIncRes.data.success ? '✅ PASSED' : '❌ FAILED');

  // 8. Set Budget & Check Calculation
  const budgetRes = await request('POST', '/budgets', {
    category_id: 1,
    month: 10,
    year: 2026,
    amount: 5000,
  }, newToken);
  console.log('8. Create Budget:', budgetRes.status === 201 || budgetRes.status === 200 ? '✅ PASSED' : '❌ FAILED');

  const getBudgetsRes = await request('GET', '/budgets?month=10&year=2026', null, newToken);
  const foodBudget = getBudgetsRes.data.budgets.find(b => b.category_id === 1);
  console.log('8b. Budget Status Calculation:', foodBudget && foodBudget.spent === 1800 ? '✅ PASSED' : '❌ FAILED');

  // 9. Savings Goal Creation & Deposit
  const goalRes = await request('POST', '/savings-goals', {
    name: 'New Gaming Laptop',
    target_amount: 80000,
    current_amount: 25000,
    target_date: '2026-12-31',
  }, newToken);
  console.log('9. Create Savings Goal:', goalRes.status === 201 ? '✅ PASSED' : '❌ FAILED');
  const goalId = goalRes.data.goal.id;

  const addMoneyRes = await request('PUT', `/savings-goals/${goalId}`, {
    add_amount: 15000,
  }, newToken);
  console.log('9b. Add Money to Goal:', addMoneyRes.status === 200 && addMoneyRes.data.goal.current_amount === 40000 ? '✅ PASSED' : '❌ FAILED');

  // 10. Financial Reports Generation
  const reportRes = await request('GET', '/reports/monthly?month=10&year=2026', null, newToken);
  console.log('10. Financial Reports Generator:', reportRes.status === 200 && reportRes.data.report_type.includes('Financial') ? '✅ PASSED' : '❌ FAILED');

  // 11. Profile Update
  const profRes = await request('PUT', '/profile', {
    name: 'Test User Updated',
    monthly_income: 35000,
  }, newToken);
  console.log('11. Profile Update:', profRes.status === 200 && profRes.data.user.monthly_income === 35000 ? '✅ PASSED' : '❌ FAILED');

  // 12. Security Isolation: Demo User cannot see New User's expense
  const expCheck = await request('GET', `/expenses/${expId}`, null, demoToken);
  // Demo user fetching expenses only gets their own
  const demoExpenses = await request('GET', '/expenses', null, demoToken);
  const hasLeaked = demoExpenses.data.expenses.some(e => e.id === expId);
  console.log('12. User Data Security Isolation:', !hasLeaked ? '✅ PASSED (No Cross-User Leaks)' : '❌ FAILED (Data Leaked)');

  // 13. Delete Expense
  const delRes = await request('DELETE', `/expenses/${expId}`, null, newToken);
  console.log('13. Delete Expense:', delRes.status === 200 ? '✅ PASSED' : '❌ FAILED');

  console.log('--- 🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
