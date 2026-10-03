const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

let dbType = 'unknown'; // 'mysql' or 'sqlite'
let pool = null;
let sqliteDb = null;

// Initialize Database connection
async function initDatabase() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'spendwise_db';

  console.log(`[Database] Attempting connection to MySQL server at ${dbHost}:${dbPort}...`);

  try {
    // Attempt MySQL connection with a short timeout
    const testConnection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      connectTimeout: 2000,
    });

    // Create database if not exists
    await testConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await testConnection.end();

    // Create connection pool
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true
    });

    dbType = 'mysql';
    console.log(`[Database] Connected successfully to MySQL database "${dbName}" at ${dbHost}:${dbPort}`);
    await setupMySQLSchema();
    await ensureDemoAccountAndData();
  } catch (err) {
    console.warn(`[Database] MySQL server connection failed (${err.message}).`);
    console.log(`[Database] Activating embedded relational SQLite storage (spendwise.db) with identical schema & seed data so SpendWise is 100% functional out-of-the-box!`);
    
    await setupSQLite();
    await ensureDemoAccountAndData();
  }
}

// Setup MySQL tables
async function setupMySQLSchema() {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      const statements = sqlContent
        .replace(/--.*$/gm, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

      for (const statement of statements) {
        await pool.query(statement);
      }
      console.log('[Database] MySQL tables verified/initialized.');
    }

    // Ensure categories
    await seedCategories();
  } catch (err) {
    console.error('[Database] Error executing MySQL schema setup:', err);
  }
}

// Setup SQLite database & tables
function setupSQLite() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '../spendwise.db');
    sqliteDb = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('[Database] Failed to open SQLite database:', err);
        return reject(err);
      }

      dbType = 'sqlite';
      console.log(`[Database] Relational SQLite database opened at: ${dbPath}`);

      // Enable foreign keys
      sqliteDb.run('PRAGMA foreign_keys = ON;');

      // Create tables
      const schema = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          monthly_income NUMERIC NOT NULL DEFAULT 0.00,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          type TEXT DEFAULT 'expense',
          icon TEXT DEFAULT 'tag',
          color TEXT DEFAULT '#6366f1'
        );

        CREATE TABLE IF NOT EXISTS income (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          source TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          income_date DATE NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          description TEXT NOT NULL,
          amount NUMERIC NOT NULL,
          payment_method TEXT NOT NULL,
          expense_date DATE NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category_id INTEGER,
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          amount NUMERIC NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          UNIQUE(user_id, category_id, month, year)
        );

        CREATE TABLE IF NOT EXISTS savings_goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          target_amount NUMERIC NOT NULL,
          current_amount NUMERIC NOT NULL DEFAULT 0.00,
          target_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          currency TEXT DEFAULT 'INR',
          theme TEXT DEFAULT 'dark',
          notifications_enabled INTEGER DEFAULT 1,
          monthly_budget NUMERIC DEFAULT 0.00,
          savings_target NUMERIC DEFAULT 0.00,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      sqliteDb.exec(schema, async (schemaErr) => {
        if (schemaErr) {
          console.error('[Database] SQLite schema initialization error:', schemaErr);
          return reject(schemaErr);
        }

        await seedCategories();
        resolve();
      });
    });
  });
}

// Seed categories if missing
async function seedCategories() {
  try {
    const catRows = await query('SELECT COUNT(*) as count FROM categories');
    if (!catRows || catRows[0]?.count === 0) {
      console.log('[Database] Seeding standard categories...');
      const defaultCategories = [
        [1, 'Food', 'expense', 'Utensils', '#f59e0b'],
        [2, 'Transport', 'expense', 'Car', '#3b82f6'],
        [3, 'Shopping', 'expense', 'ShoppingBag', '#ec4899'],
        [4, 'Bills', 'expense', 'Receipt', '#ef4444'],
        [5, 'Entertainment', 'expense', 'Film', '#8b5cf6'],
        [6, 'Education', 'expense', 'GraduationCap', '#10b981'],
        [7, 'Health', 'expense', 'HeartPulse', '#06b6d4'],
        [8, 'Travel', 'expense', 'Plane', '#14b8a6'],
        [9, 'Subscriptions', 'expense', 'Tv', '#6366f1'],
        [10, 'Rent', 'expense', 'Home', '#f97316'],
        [11, 'EMI', 'expense', 'CreditCard', '#e11d48'],
        [12, 'Other', 'expense', 'MoreHorizontal', '#64748b'],
      ];

      for (const cat of defaultCategories) {
        if (dbType === 'mysql') {
          await query(
            'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
            cat
          );
        } else {
          await query(
            'INSERT OR IGNORE INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
            cat
          );
        }
      }
    }
  } catch (err) {
    console.error('[Database] Error seeding categories:', err);
  }
}

// Ensure demo_user exists, password hash matches Demo@123, and realistic isolated data exists
async function ensureDemoAccountAndData() {
  try {
    const DEMO_USERNAME = 'demo_user';
    const DEMO_PASSWORD_PLAIN = 'Demo@123';

    // 1. Check if demo user exists
    const users = await query('SELECT id, name, username, password, monthly_income FROM users WHERE LOWER(username) = LOWER(?)', [DEMO_USERNAME]);

    let demoUserId;
    if (!users || users.length === 0) {
      console.log('[Database] demo_user account not found. Creating demo_user account...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD_PLAIN, salt);
      const insertUserRes = await query(
        'INSERT INTO users (name, username, password, monthly_income) VALUES (?, ?, ?, ?)',
        ['Demo User', DEMO_USERNAME, hashedPassword, 35000.00]
      );
      demoUserId = insertUserRes.insertId;
      console.log(`[Database] demo_user account created successfully (ID: ${demoUserId}).`);
    } else {
      const demoUser = users[0];
      demoUserId = demoUser.id;
      // Verify password hash
      const isPasswordValid = await bcrypt.compare(DEMO_PASSWORD_PLAIN, demoUser.password);
      if (!isPasswordValid) {
        console.log('[Database] demo_user exists but password hash is invalid. Updating password hash for Demo@123...');
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(DEMO_PASSWORD_PLAIN, salt);
        await query('UPDATE users SET password = ? WHERE id = ?', [newHash, demoUserId]);
        console.log('[Database] demo_user password hash successfully updated.');
      } else {
        console.log('[Database] demo_user account verified with valid password hash.');
      }
    }

    // 2. Ensure settings exist for demo_user
    const settings = await query('SELECT id FROM settings WHERE user_id = ?', [demoUserId]);
    if (!settings || settings.length === 0) {
      await query(
        'INSERT INTO settings (user_id, currency, theme, notifications_enabled, monthly_budget, savings_target) VALUES (?, ?, ?, ?, ?, ?)',
        [demoUserId, 'INR', 'dark', 1, 28000.00, 7000.00]
      );
    }

    // 3. Ensure categories map
    const categories = await query('SELECT id, name FROM categories');
    const catMap = {};
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        catMap[c.name.toLowerCase()] = c.id;
      });
    }

    // 4. Ensure demo user has realistic financial data
    const expCount = await query('SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', [demoUserId]);
    if (!expCount || expCount[0]?.count === 0) {
      console.log(`[Database] Seeding realistic sample financial data for demo_user (ID: ${demoUserId})...`);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      const pad = (n) => String(n).padStart(2, '0');
      const curMonthStr = `${currentYear}-${pad(currentMonth)}`;

      const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYearNum = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthStr = `${prevYearNum}-${pad(prevMonthNum)}`;

      // Monthly overall budget
      await query(
        'INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, NULL, ?, ?, ?)',
        [demoUserId, currentMonth, currentYear, 28000.00]
      );

      // Category budgets
      if (catMap['food']) {
        await query('INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)', [demoUserId, catMap['food'], currentMonth, currentYear, 6000.00]);
      }
      if (catMap['transport']) {
        await query('INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)', [demoUserId, catMap['transport'], currentMonth, currentYear, 3000.00]);
      }
      if (catMap['shopping']) {
        await query('INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)', [demoUserId, catMap['shopping'], currentMonth, currentYear, 4000.00]);
      }
      if (catMap['bills']) {
        await query('INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)', [demoUserId, catMap['bills'], currentMonth, currentYear, 3500.00]);
      }
      if (catMap['rent']) {
        await query('INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES (?, ?, ?, ?, ?)', [demoUserId, catMap['rent'], currentMonth, currentYear, 10000.00]);
      }

      // Savings Goals
      await query(
        'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'New Phone', 45000.00, 28000.00, `${currentYear}-12-31`]
      );
      await query(
        'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'Emergency Fund', 100000.00, 65000.00, `${currentYear}-12-31`]
      );

      // Sample Incomes
      await query(
        'INSERT INTO income (user_id, source, amount, income_date, notes) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'Salary', 35000.00, `${curMonthStr}-01`, 'Monthly primary salary credit']
      );
      await query(
        'INSERT INTO income (user_id, source, amount, income_date, notes) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'Freelance Web Design', 8500.00, `${curMonthStr}-02`, 'Client project milestone']
      );
      await query(
        'INSERT INTO income (user_id, source, amount, income_date, notes) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'Salary', 35000.00, `${prevMonthStr}-01`, 'Previous month salary']
      );

      // Sample Expenses
      const sampleExpenses = [
        { cat: 'rent', desc: 'Monthly House Rent', amount: 10000.00, method: 'Bank Transfer', date: `${curMonthStr}-01`, notes: 'Monthly apartment rent' },
        { cat: 'bills', desc: 'Broadband Internet & Electricity', amount: 2450.00, method: 'UPI', date: `${curMonthStr}-02`, notes: 'Utility bills' },
        { cat: 'food', desc: 'Supermarket Grocery', amount: 2150.00, method: 'Credit Card', date: `${curMonthStr}-02`, notes: 'Weekly groceries' },
        { cat: 'transport', desc: 'Fuel for Commute', amount: 1200.00, method: 'UPI', date: `${curMonthStr}-03`, notes: 'Petrol pump refill' },
        { cat: 'food', desc: 'Cafe Coffee with Friends', amount: 450.00, method: 'UPI', date: `${curMonthStr}-03`, notes: 'Snacks & coffee' },
        { cat: 'subscriptions', desc: 'Spotify & Netflix', amount: 699.00, method: 'Credit Card', date: `${curMonthStr}-01`, notes: 'Monthly recurring entertainment' },
        { cat: 'shopping', desc: 'Autumn Clothing', amount: 2490.00, method: 'Credit Card', date: `${prevMonthStr}-28`, notes: 'Apparel purchase' },
        { cat: 'food', desc: 'Family Weekend Dinner', amount: 1850.00, method: 'Credit Card', date: `${prevMonthStr}-25`, notes: 'Dinner out' },
        { cat: 'transport', desc: 'Cab & Metro Rides', amount: 820.00, method: 'UPI', date: `${prevMonthStr}-24`, notes: 'City travel' },
      ];

      for (const exp of sampleExpenses) {
        const catId = catMap[exp.cat] || catMap['other'] || 1;
        await query(
          'INSERT INTO expenses (user_id, category_id, description, amount, payment_method, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [demoUserId, catId, exp.desc, exp.amount, exp.method, exp.date, exp.notes]
        );
      }

      console.log('[Database] Demo financial data seeded successfully.');
    }
  } catch (err) {
    console.error('[Database] Error ensuring demo account & data:', err);
  }
}

/**
 * Universal query runner:
 * Works seamlessly whether connected to MySQL or SQLite.
 * Returns:
 * - for SELECT: rows array
 * - for INSERT: { insertId, affectedRows }
 * - for UPDATE/DELETE: { affectedRows }
 */
async function query(sql, params = []) {
  if (dbType === 'mysql' && pool) {
    const [result] = await pool.query(sql, params);
    return result;
  } else if (dbType === 'sqlite' && sqliteDb) {
    return new Promise((resolve, reject) => {
      const trimmed = sql.trim();
      const isSelect = /^(SELECT|PRAGMA)/i.test(trimmed);

      if (isSelect) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({
            insertId: this.lastID,
            affectedRows: this.changes,
          });
        });
      }
    });
  } else {
    throw new Error('Database is not initialized yet.');
  }
}

function getDbType() {
  return dbType;
}

module.exports = {
  initDatabase,
  query,
  getDbType,
};
