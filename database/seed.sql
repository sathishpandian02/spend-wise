-- ========================================================
-- SpendWise Seed Data (MySQL)
-- Personal Finance Management Application
-- "Track smarter. Spend better. Save more."
-- ========================================================

USE spendwise_db;

-- Insert Standard Categories
INSERT INTO categories (id, name, type, icon, color) VALUES
(1, 'Food', 'expense', 'Utensils', '#f59e0b'),
(2, 'Transport', 'expense', 'Car', '#3b82f6'),
(3, 'Shopping', 'expense', 'ShoppingBag', '#ec4899'),
(4, 'Bills', 'expense', 'Receipt', '#ef4444'),
(5, 'Entertainment', 'expense', 'Film', '#8b5cf6'),
(6, 'Education', 'expense', 'GraduationCap', '#10b981'),
(7, 'Health', 'expense', 'HeartPulse', '#06b6d4'),
(8, 'Travel', 'expense', 'Plane', '#14b8a6'),
(9, 'Subscriptions', 'expense', 'Tv', '#6366f1'),
(10, 'Rent', 'expense', 'Home', '#f97316'),
(11, 'EMI', 'expense', 'CreditCard', '#e11d48'),
(12, 'Other', 'expense', 'MoreHorizontal', '#64748b')
ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), color=VALUES(color);

-- Insert Demo User: demo_user / Demo@123
INSERT INTO users (id, name, username, password, monthly_income) VALUES
(1, 'Demo User', 'demo_user', '$2a$10$oLKIkW21rx4Pag/DcjtvhuMetAVd2FQodW4WvHon11f7hOQoruxq2', 45000.00)
ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), monthly_income=VALUES(monthly_income);

-- Insert Settings for Demo User
INSERT INTO settings (user_id, currency, theme, notifications_enabled, monthly_budget, savings_target) VALUES
(1, 'INR', 'dark', 1, 35000.00, 10000.00)
ON DUPLICATE KEY UPDATE currency=VALUES(currency), monthly_budget=VALUES(monthly_budget);

-- Insert Savings Goals
INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date) VALUES
(1, 'Emergency Fund', 100000.00, 65000.00, '2026-12-31'),
(1, 'New Phone & Tech', 45000.00, 28000.00, '2026-11-15'),
(1, 'Goa Vacation', 30000.00, 18500.00, '2026-12-25');

-- Budgets for Current & Recent Months (e.g. Month 10 Year 2026)
INSERT INTO budgets (user_id, category_id, month, year, amount) VALUES
(1, NULL, 10, 2026, 35000.00),
(1, 1, 10, 2026, 7000.00),    -- Food
(1, 2, 10, 2026, 3500.00),    -- Transport
(1, 3, 10, 2026, 5000.00),    -- Shopping
(1, 4, 10, 2026, 4000.00),    -- Bills
(1, 5, 10, 2026, 2500.00),    -- Entertainment
(1, 10, 10, 2026, 12000.00);  -- Rent

-- Additional Income for Demo User
INSERT INTO income (user_id, source, amount, income_date, notes) VALUES
(1, 'Salary', 45000.00, '2026-10-01', 'Monthly primary salary credit'),
(1, 'Freelance Web Design', 12000.00, '2026-10-02', 'Client payment for landing page redesign'),
(1, 'Investment Dividends', 3500.00, '2026-09-28', 'Mutual funds quarterly dividend'),
(1, 'Salary', 45000.00, '2026-09-01', 'Monthly salary credit'),
(1, 'Freelance Consulting', 15000.00, '2026-09-15', 'Technical audit consulting'),
(1, 'Salary', 45000.00, '2026-08-01', 'Monthly salary credit'),
(1, 'Performance Bonus', 10000.00, '2026-08-20', 'Mid-year performance reward'),
(1, 'Salary', 45000.00, '2026-07-01', 'Monthly salary credit'),
(1, 'Salary', 45000.00, '2026-06-01', 'Monthly salary credit'),
(1, 'Salary', 45000.00, '2026-05-01', 'Monthly salary credit');

-- Recent & Historical Expenses for Demo User
INSERT INTO expenses (user_id, category_id, description, amount, payment_method, expense_date, notes) VALUES
-- Current Week (Oct 2026)
(1, 10, 'Monthly House Rent', 12000.00, 'Bank Transfer', '2026-10-01', 'Paid to apartment owner'),
(1, 4, 'Broadband Internet & Electricity', 2450.00, 'UPI', '2026-10-02', 'ACT Fibernet & BESCOM bill'),
(1, 1, 'Supermarket Weekly Grocery', 2150.00, 'Credit Card', '2026-10-02', 'Vegetables, milk, pulses and groceries'),
(1, 2, 'Fuel for Commute', 1200.00, 'UPI', '2026-10-03', 'HPCL Petrol Pump'),
(1, 1, 'Cafe Coffee Day with Friends', 450.00, 'UPI', '2026-10-03', 'Coffee and snacks'),
(1, 9, 'Spotify & Netflix Subscriptions', 699.00, 'Credit Card', '2026-10-01', 'Auto-renew monthly recurring'),

-- Previous Week (Late Sept 2026)
(1, 1, 'Dinner at Barbeque Nation', 1850.00, 'Credit Card', '2026-09-27', 'Family weekend dinner'),
(1, 2, 'Ola & Uber Rides', 820.00, 'UPI', '2026-09-28', 'City travel to client office'),
(1, 3, 'Myntra Autumn Clothing', 2890.00, 'Credit Card', '2026-09-29', 'Cotton shirts and sneakers on sale'),
(1, 1, 'Daily Organic Milk & Dairy', 650.00, 'UPI', '2026-09-29', 'Country Delight subscription refill'),
(1, 7, 'Dental Checkup & Medicines', 1500.00, 'Debit Card', '2026-09-30', 'Apollo Pharmacy and clinic fees'),
(1, 5, 'Movie Tickets IMAX 3D', 900.00, 'UPI', '2026-09-26', 'BookMyShow weekend show'),

-- Previous Month (September 2026)
(1, 10, 'Monthly House Rent', 12000.00, 'Bank Transfer', '2026-09-01', 'September house rent'),
(1, 4, 'Electricity & Gas Utility', 2100.00, 'UPI', '2026-09-05', 'Bescom & Indane gas refill'),
(1, 1, 'Groceries & Provisions', 6800.00, 'Debit Card', '2026-09-12', 'BigBasket monthly cart'),
(1, 2, 'Fuel & Metro Smartcard Recharge', 2400.00, 'UPI', '2026-09-14', 'Commute expenses'),
(1, 3, 'Smart Watch Purchase', 3499.00, 'Credit Card', '2026-09-18', 'Amazon Great Indian Festival deal'),
(1, 6, 'Full-Stack Advanced Course', 4500.00, 'Debit Card', '2026-09-20', 'Udemy Certification & labs'),

-- Earlier Months (August & July 2026)
(1, 10, 'Monthly House Rent', 12000.00, 'Bank Transfer', '2026-08-01', 'August rent'),
(1, 1, 'Groceries & Dining', 7200.00, 'Debit Card', '2026-08-10', 'Monthly food and pantry items'),
(1, 4, 'Utility Bills', 2300.00, 'UPI', '2026-08-08', 'Internet & Water'),
(1, 8, 'Coorg Weekend Road Trip', 8500.00, 'Credit Card', '2026-08-15', 'Resort booking & travel fuel'),
(1, 10, 'Monthly House Rent', 12000.00, 'Bank Transfer', '2026-07-01', 'July rent'),
(1, 1, 'Food & Essentials', 6500.00, 'Debit Card', '2026-07-10', 'Monthly food expenses'),
(1, 2, 'Fuel & Transit', 2200.00, 'UPI', '2026-07-15', 'Monthly vehicle fuel');
