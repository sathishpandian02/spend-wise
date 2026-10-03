// Currency and date formatting helpers for SpendWise

export function formatCurrency(amount, currency = 'INR') {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  // Format with Indian numbering system
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
  }).format(num);

  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return `${symbol}${formatted}`;
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

export function formatMonthYear(year, month) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
