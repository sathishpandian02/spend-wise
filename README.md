# SpendWise 💳
### *"Track smarter. Spend better. Save more."*

**SpendWise** is a full-stack personal finance and expense management web application designed for students, professionals, and developers. Built with a production-grade **React + Node.js/Express + Relational Database (MySQL / SQLite Dual-Engine)** architecture, SpendWise empowers users to manage budgets, calculate accurate surplus/deficit margins, set savings goals, visualize multi-period financial trends, and generate audited reports.

---

## 🚀 Key Highlights & Features

### 1. Unique User ID System & Authentication
- **User ID Registration:** Users register with a custom alphanumeric User ID (e.g., `SAT001`) rather than just an email address.
- **Duplicate Prevention:** Immediate backend check ensuring all User IDs are unique.
- **Security:** Industry-standard **bcrypt** password hashing with 10 salt rounds and **JWT (JSON Web Token)** authorization.
- **Strict Data Isolation:** Multi-tenant architecture where User A can **never** access, view, or modify User B's financial data.

### 2. Financial Overview & Calculation Logic
- **Base vs. Additional Income:** Combines fixed monthly baseline earnings with variable income sources (Salary, Freelance, Investments, Bonuses).
- **Personal Finance Surplus & Deficit:**
  - 🟢 **Surplus:** When Total Income > Total Outflow
  - 🔴 **Deficit:** When Total Outflow > Total Income
  - **Savings Calculation:** Accurately computed as `Total Income - Total Expenses`. No misleading business profit jargon.
- **Dynamic Time Filters:** Instant switching between **This Week**, **This Month**, **Last Month**, **This Year**, and **Custom Date Ranges**.

### 3. Dedicated Financial Analysis Suites
- 📅 **Weekly Financial Analysis:**
  - Side-by-side comparison between **Current Week** and **Previous Week**.
  - Metric changes: Outflow change amount, savings variance, and percentage changes calculated directly from database records.
  - Interactive **Monday–Sunday Daily Spending Bar/Line Chart**.
- 🗓️ **Monthly Financial Overview:**
  - Month (Jan–Dec) and Year selectors.
  - Metrics: Average daily expense, highest single purchase, most used category, and transaction count.
  - Month-over-month percentage changes and chronological daily outflow trends.
- 📈 **Yearly Financial Overview:**
  - 12-month Income vs. Expense vs. Savings bar chart.
  - Identifies highest and lowest outflow months.
  - **Year-to-Year Comparative Audits** (e.g. 2026 vs 2025).

### 4. Smart Budgeting & Savings Goals
- **Budget Threshold Engine:** Configurable thresholds with automatic visual alerts:
  - `0% – 69%` → **Safe** (Green)
  - `70% – 89%` → **Warning** (Amber)
  - `90% – 99%` → **Critical** (Orange)
  - `100%+` → **Exceeded** (Crimson)
- **Savings Goals with Deposit Milestones:** Track target amounts and deposit funds incrementally with progress bars and celebratory confetti upon reaching targets.

### 5. Transaction Hub & Financial Reports
- **Transaction History:** Real-time search, category filters, type filters (Expense/Income), payment method filters, and amount/date sorting with pagination.
- **Audited Financial Statements:** Weekly, monthly, and annual reports featuring user credentials, category breakdowns, major expenses, and previous period comparisons.
- **Export Capabilities:** One-click **Download PDF** and **Print Report** using tailored CSS print formatting.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 19, Vite, Chart.js, React-Chartjs-2, Lucide React, Canvas Confetti |
| **Styling** | Vanilla CSS Design Tokens, Glassmorphism, Google Fonts (*Outfit* & *Plus Jakarta Sans*) |
| **Backend API** | Node.js, Express.js REST API, JSON Web Token (JWT), bcryptjs, CORS |
| **Database** | MySQL (with automated zero-config embedded SQLite dual-mode driver) |
| **Testing** | Built-in Automated Integration & Security Isolation Test Suite (`server/test-api.js`) |

---

## 📁 System Architecture & Folder Structure

```text
/expense tracker
├── /client                     # Frontend React Application (Vite)
│   ├── /public
│   ├── /src
│   │   ├── /assets
│   │   ├── /components         # Modal, AddExpenseModal, AddIncomeModal, CategoryIcon, etc.
│   │   ├── /context            # AuthContext (JWT session), ToastContext (notifications)
│   │   ├── /hooks
│   │   ├── /layouts            # Navbar, Sidebar, AppLayout
│   │   ├── /pages              # Dashboard, Weekly, Monthly, Yearly, Transactions, Budgets, Savings, Reports, Profile, Login, Register
│   │   ├── /services           # Axios API services
│   │   ├── /utils              # formatters (₹ currency, dates, greetings)
│   │   ├── App.jsx             # Main Router & view orchestration
│   │   ├── index.css           # Design tokens, glassmorphism, responsive utilities, print styles
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── /server                     # Backend REST API (Express)
│   ├── /config                 # db.js (MySQL pool + SQLite automatic dual-engine)
│   ├── /controllers            # auth, income, expense, category, budget, savings, analytics, report, profile
│   ├── /middleware             # authMiddleware (JWT verify), errorHandler
│   ├── /routes                 # Express route definitions
│   ├── /utils                  # calculator.js (date math, percentage formulas)
│   ├── server.js               # Express application entrypoint
│   ├── test-api.js             # Automated end-to-end integration test suite
│   ├── spendwise.db            # Auto-generated relational storage fallback
│   └── package.json
│
├── /database
│   ├── schema.sql              # Complete MySQL DDL tables schema
│   └── seed.sql                # Production seed script with demo user & historical transactions
│
├── .env.example                # Sample environment configuration
├── package.json                # Root development scripts
└── README.md                   # Comprehensive project documentation
```

---

## ⚙️ Environment Variables

Create `.env` inside `/server` or at the root:

```env
PORT=5000
JWT_SECRET=spendwise_super_secret_jwt_key_2026_finance_secure
JWT_EXPIRES_IN=7d

# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=spendwise_db
```

> **Note on Database Dual-Engine:**  
> If MySQL is running on `localhost:3306`, SpendWise automatically connects to MySQL and applies `schema.sql`. If MySQL is not running or not installed on the evaluator's machine, SpendWise seamlessly activates its embedded relational SQLite engine (`spendwise.db`) with an identical schema and seed dataset. **Zero crashes, 100% out-of-the-box functionality!**

---

## 🚀 Installation & How to Run

### Step 1: Install Dependencies
From the project root:
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### Step 2: Start the Backend Server
```bash
cd server
npm start
```
*The backend API will run on `http://localhost:5000`.*

### Step 3: Start the Frontend Client
In a new terminal window:
```bash
cd client
npm run dev
```
*The frontend application will launch on `http://localhost:5173`.*

---

## 🔑 Demo Account Credentials

SpendWise includes a pre-seeded demonstration account loaded with several months of transactions across Food, Transport, Rent, Utilities, Entertainment, and Freelance Income:

- **Username / User ID:** `demo_user`
- **Password:** `Demo@123`
- *Or simply click the **"Auto Fill"** button on the Login page.*

---

## 📡 REST API Documentation

### Authentication
- `POST /api/auth/register` — Create a new account with a unique User ID and monthly income.
- `POST /api/auth/login` — Authenticate and receive a signed JWT token.
- `GET /api/auth/me` — Retrieve the current user's profile and settings.
- `POST /api/auth/logout` — Invalidate user session.

### Income Management
- `GET /api/income` — Fetch user's additional income records (supports date range, source, search filters).
- `POST /api/income` — Record additional earnings.
- `PUT /api/income/:id` — Update an existing income entry.
- `DELETE /api/income/:id` — Delete an income record.

### Expense Management
- `GET /api/expenses` — Query expenses with category joins, pagination, and multi-field sorting.
- `POST /api/expenses` — Log an expense with description, amount, category, date, and payment method.
- `PUT /api/expenses/:id` — Update an expense.
- `DELETE /api/expenses/:id` — Remove an expense entry.

### Analytics & Reports
- `GET /api/analytics/dashboard` — Live surplus/deficit, category share, and dynamic insights.
- `GET /api/analytics/weekly` — Mon–Sun daily spending & current vs. previous week comparison.
- `GET /api/analytics/monthly` — Monthly summary, daily spending progression, and month-over-month variance.
- `GET /api/analytics/yearly` — 12-month distribution and annual year-over-year comparison.
- `GET /api/reports/weekly` — Audited weekly statement.
- `GET /api/reports/monthly` — Audited monthly report.
- `GET /api/reports/yearly` — Audited annual summary.

### Budgets & Savings Goals
- `GET /api/budgets` — Retrieve monthly/category budgets with live usage and status badges.
- `POST /api/budgets` — Configure or adjust a budget threshold.
- `DELETE /api/budgets/:id` — Remove a budget limit.
- `GET /api/savings-goals` — Fetch savings goals and progress.
- `POST /api/savings-goals` — Create a target goal.
- `PUT /api/savings-goals/:id` — Update target or add deposit funds.
- `DELETE /api/savings-goals/:id` — Delete a savings goal.

---

## 🧪 Testing & Verification

Run the automated integration test suite:
```bash
cd server
node test-api.js
```
The test script verifies:
1. Health check & status
2. Demo user authentication
3. Unique user registration
4. Duplicate User ID prevention (409 Conflict)
5. Expense creation, update, and deletion
6. Income credit & budget threshold calculation
7. Savings goal creation & fund deposits
8. Multi-period financial report generation
9. Strict multi-user data isolation (User A never sees User B's data)

---

## 🛡️ License & Viva Suitability
This project was engineered for:
- BSc IT / BCA / B.Tech Computer Science Mini & Major Projects
- Full-Stack Development Internship Demonstrations
- Viva-Voce Technical Evaluations & Portfolio Showcases
