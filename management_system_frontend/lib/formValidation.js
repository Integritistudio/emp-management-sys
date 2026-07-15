export function required(value, message = "This field is required") {
  if (value === null || value === undefined) return message;
  if (typeof value === "string" && !value.trim()) return message;
  return "";
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function positiveNumber(value, { min = 0, message } = {}) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "Please enter a valid number";
  if (num < min) {
    return message || `Must be at least ${min}`;
  }
  return "";
}

/** Returns true if there are any field errors. */
export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}
