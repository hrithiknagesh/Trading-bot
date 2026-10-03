/** fmt.js — shared formatting utility */

// Auto-picks decimal places based on magnitude
export const format = (n, digits) => {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  // Auto-detect digits if not provided
  if (digits === undefined) {
    if (Math.abs(num) === 0)      digits = 2;
    else if (Math.abs(num) < 0.000001) digits = 10;
    else if (Math.abs(num) < 0.001)    digits = 8;
    else if (Math.abs(num) < 1)        digits = 6;
    else if (Math.abs(num) < 100)      digits = 4;
    else                               digits = 2;
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

// Format price with auto-decimal (for display next to $ sign)
export const fmtPrice = (n) => {
  if (n === null || n === undefined) return "—";
  const num = Number(n);
  if (Math.abs(num) < 0.000001) return num.toFixed(10);
  if (Math.abs(num) < 0.001)    return num.toFixed(8);
  if (Math.abs(num) < 1)        return num.toFixed(6);
  if (Math.abs(num) < 100)      return num.toFixed(4);
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
