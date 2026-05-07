export const validators = {
  required: (msg = 'This field is required') => ({
    required: msg,
  }),

  minLength: (len, msg) => ({
    minLength: {
      value: 8,
      message: msg,
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: msg,
    },
  }),

  maxLength: (len, msg) => ({
    maxLength: {
      value: len,
      message: msg || `Must be at most ${len} characters`,
    },
  }),

  email: (msg = 'Please enter a valid email') => ({
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: msg,
    },
  }),

  password: (msg = 'Password must be at least 8 characters with uppercase, lowercase, and a digit') => ({
    minLength: {
      value: 8,
      message: msg,
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: msg,
    },
  }),

  username: (msg = 'Username must be 3-20 characters, letters and numbers only') => ({
    pattern: {
      value: /^[A-Za-z0-9_]{3,20}$/,
      message: msg,
    },
  }),

  phone: (msg = 'Please enter a valid phone number') => ({
    pattern: {
      value: /^\+?[0-9\s\-()]{7,20}$/,
      message: msg,
    },
  }),

  number: (min, max) => ({
    min: { value: min || 0, message: `Minimum is ${min}` },
    max: { value: max || 999999, message: `Maximum is ${max}` },
  }),
};

export const formatError = (error) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors?.map) {
    return error.response.data.errors.map((x) => x.msg).join(', ');
  }
  if (error.message) return error.message;
  return 'An error occurred';
};