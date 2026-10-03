// Utility functions for financial analytics and dates

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get Start and End of current week (Monday to Sunday)
function getWeekRange(date = new Date(), offsetWeeks = 0) {
  const d = new Date(date);
  const day = d.getDay();
  // In JS, Sunday is 0. Make Monday 0, Sunday 6
  const diffToMonday = d.getDate() - (day === 0 ? 6 : day - 1) + (offsetWeeks * 7);
  const monday = new Date(d.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
    startDateObj: monday,
    endDateObj: sunday,
  };
}

// Get Start and End of a month
function getMonthRange(year, month) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day
  return {
    start: formatDate(start),
    end: formatDate(end),
    daysInMonth: end.getDate(),
  };
}

// Calculate percentage change safely
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100; // or null if comparison not applicable
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return Math.round(change * 10) / 10;
}

module.exports = {
  formatDate,
  getWeekRange,
  getMonthRange,
  calculatePercentageChange,
};
