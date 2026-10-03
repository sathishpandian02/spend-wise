import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ArrowDownLeft,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { expenseService, incomeService, categoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSpinner, EmptyState, ErrorBanner } from '../components/StateFeedbacks';
import CategoryIcon from '../components/CategoryIcon';
import AddExpenseModal from '../components/AddExpenseModal';
import AddIncomeModal from '../components/AddIncomeModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

export default function Transactions({ refreshTrigger }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'expense', 'income'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [editExpenseData, setEditExpenseData] = useState(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [editIncomeData, setEditIncomeData] = useState(null);
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewDetailsTarget, setViewDetailsTarget] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [expRes, incRes, catRes] = await Promise.all([
        expenseService.getAll({ limit: 500 }),
        incomeService.getAll({ limit: 500 }),
        categoryService.getAll(),
      ]);

      if (expRes.data.success) setExpenses(expRes.data.expenses || []);
      if (incRes.data.success) setIncomes(incRes.data.incomes || []);
      if (catRes.data.success) setCategories(catRes.data.categories || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Merge and transform into single transaction list
  const combinedTransactions = [
    ...expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: parseFloat(e.amount),
      date: e.expense_date,
      type: 'expense',
      category_id: e.category_id,
      category_name: e.category_name,
      category_icon: e.category_icon,
      category_color: e.category_color,
      payment_method: e.payment_method,
      notes: e.notes,
      raw: e,
    })),
    ...incomes.map((i) => ({
      id: i.id,
      description: i.source,
      amount: parseFloat(i.amount),
      date: i.income_date,
      type: 'income',
      category_id: null,
      category_name: 'Income',
      category_icon: 'ArrowDownLeft',
      category_color: '#10b981',
      payment_method: 'Bank / Direct',
      notes: i.notes,
      raw: i,
    })),
  ];

  // Apply filters
  const filtered = combinedTransactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && tx.category_id !== parseInt(categoryFilter, 10)) return false;
    if (paymentFilter !== 'all' && tx.payment_method !== paymentFilter) return false;
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category_name.toLowerCase().includes(q);
      const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
      if (!matchDesc && !matchCat && !matchNotes) return false;
    }
    return true;
  });

  // Apply sorting
  filtered.sort((a, b) => {
    if (sortOption === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortOption === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortOption === 'amount-desc') return b.amount - a.amount;
    if (sortOption === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      if (deleteTarget.type === 'expense') {
        await expenseService.delete(deleteTarget.id);
        addToast('Expense deleted successfully', 'success');
      } else {
        await incomeService.delete(deleteTarget.id);
        addToast('Income entry deleted successfully', 'success');
      }
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      addToast('Failed to delete item', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (tx) => {
    if (tx.type === 'expense') {
      setEditExpenseData(tx.raw);
      setIsEditExpenseOpen(true);
    } else {
      setEditIncomeData(tx.raw);
      setIsEditIncomeOpen(true);
    }
  };

  const handleViewClick = (tx) => {
    setViewDetailsTarget(tx);
    setIsViewOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={28} color="var(--primary)" />
            Transaction History
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '4px' }}>
            Search, filter, edit, and organize all financial records.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              color="var(--text-tertiary)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search description, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Types (Income & Expenses)</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            className="form-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="date-desc">Newest First (Date ↓)</option>
            <option value="date-asc">Oldest First (Date ↑)</option>
            <option value="amount-desc">Highest Amount (₹ ↓)</option>
            <option value="amount-asc">Lowest Amount (₹ ↑)</option>
          </select>
        </div>

        {/* Date Filters Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.825rem', width: '150px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '6px 10px', fontSize: '0.825rem', width: '150px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate || search || typeFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearch('');
                setTypeFilter('all');
                setCategoryFilter('all');
                setPaymentFilter('all');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> transactions
          </div>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <LoadingSpinner message="Loading transaction records..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Transactions Found"
          message="No financial records match your selected filters. Try clearing filters or recording a new expense."
        />
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Payment Method</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '14px 18px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <tr
                      key={`${tx.type}-${tx.id}`}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.date)}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tx.description}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CategoryIcon name={tx.category_name} icon={tx.category_icon} size={16} color={tx.category_color} />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{tx.category_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={isInc ? 'badge badge-safe' : 'badge badge-deficit'}>
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {tx.payment_method}
                      </td>
                      <td
                        style={{
                          padding: '14px 18px',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          textAlign: 'right',
                          color: isInc ? 'var(--success-text)' : 'var(--danger-text)',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {isInc ? '+' : '-'} {formatCurrency(tx.amount, user?.currency)}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleViewClick(tx)}
                            title="View Details"
                            style={{
                              background: 'var(--bg-surface-hover)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-secondary)',
                              padding: '5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleEditClick(tx)}
                            title="Edit"
                            style={{
                              background: 'var(--primary-light)',
                              border: '1px solid var(--border-glow)',
                              color: 'var(--primary)',
                              padding: '5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(tx);
                              setIsDeleteOpen(true);
                            }}
                            title="Delete"
                            style={{
                              background: 'var(--danger-light)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: 'var(--danger)',
                              padding: '5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isEditExpenseOpen}
        onClose={() => {
          setIsEditExpenseOpen(false);
          setEditExpenseData(null);
        }}
        initialData={editExpenseData}
        onSuccess={fetchData}
      />

      {/* Edit Income Modal */}
      <AddIncomeModal
        isOpen={isEditIncomeOpen}
        onClose={() => {
          setIsEditIncomeOpen(false);
          setEditIncomeData(null);
        }}
        initialData={editIncomeData}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${deleteTarget?.description}" (${formatCurrency(deleteTarget?.amount || 0, user?.currency)})?`}
        confirmText="Yes, Delete"
        loading={deleteLoading}
      />

      {/* View Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setViewDetailsTarget(null);
        }}
        title="Transaction Details"
        maxWidth="460px"
      >
        {viewDetailsTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px 0 20px', borderBottom: '1px solid var(--border-color)' }}>
              <span className={viewDetailsTarget.type === 'income' ? 'badge badge-safe' : 'badge badge-deficit'}>
                {viewDetailsTarget.type}
              </span>
              <h2
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  marginTop: '10px',
                  color: viewDetailsTarget.type === 'income' ? 'var(--success-text)' : 'var(--danger-text)',
                }}
              >
                {viewDetailsTarget.type === 'income' ? '+' : '-'} {formatCurrency(viewDetailsTarget.amount, user?.currency)}
              </h2>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>
                {viewDetailsTarget.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{viewDetailsTarget.category_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDate(viewDetailsTarget.date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                <span style={{ color: 'var(--text-primary)' }}>{viewDetailsTarget.payment_method}</span>
              </div>
              {viewDetailsTarget.notes && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Notes:</span>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                    {viewDetailsTarget.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setIsViewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
