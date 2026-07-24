// Small, dependency-free form validation helpers shared across every form in the app.
// Keeps validation logic consistent (same rules, same messages) instead of every
// page reinventing its own checks.

export const rules = {
  required: (message = 'This field is required') => (value) => {
    if (value === undefined || value === null) return message;
    if (typeof value === 'string' && !value.trim()) return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return undefined;
  },
  email: (message = 'Enter a valid email address') => (value) => {
    if (!value) return undefined; // let `required` handle emptiness
    return /\S+@\S+\.\S+/.test(value) ? undefined : message;
  },
  phone: (message = 'Enter a valid phone number') => (value) => {
    if (!value) return undefined;
    return /^[+]?[\d\s-]{7,15}$/.test(value) ? undefined : message;
  },
  minLength: (len, message) => (value) => {
    if (!value) return undefined;
    return value.length >= len ? undefined : message || `Must be at least ${len} characters`;
  },
  numeric: (message = 'Must be a number') => (value) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return Number.isNaN(Number(value)) ? message : undefined;
  },
  positive: (message = 'Must be greater than 0') => (value) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return Number(value) > 0 ? undefined : message;
  },
};

/**
 * Validates a `values` object against a `schema` of { field: [validatorFn, ...] }.
 * Returns an `errors` object of { field: message } containing only the fields that failed.
 *
 * Example:
 *   const schema = {
 *     name: [rules.required('Name is required')],
 *     email: [rules.required(), rules.email()],
 *   };
 *   const errors = validateForm(values, schema);
 *   if (Object.keys(errors).length) return; // show errors, stop submit
 */
export function validateForm(values, schema) {
  const errors = {};
  for (const field of Object.keys(schema)) {
    for (const validator of schema[field]) {
      const message = validator(values[field]);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}

export const isValid = (errors) => Object.keys(errors).length === 0;
