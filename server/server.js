const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase, getDbType } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const profileRoutes = require('./routes/profileRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health & Status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'SpendWise API',
    tagline: 'Track smarter. Spend better. Save more.',
    database_driver: getDbType(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/profile', profileRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start server after DB is ready
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  SpendWise Personal Finance Backend Running`);
      console.log(`  URL: http://localhost:${PORT}`);
      console.log(`  Active Database Engine: ${getDbType().toUpperCase()}`);
      console.log(`  Tagline: "Track smarter. Spend better. Save more."`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Server] Failed to launch SpendWise server:', err);
    process.exit(1);
  }
}

startServer();
