/**
 * Utility functions for API responses
 */

export const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

export const errorResponse = (message, error = null) => ({
  success: false,
  message,
  error,
  timestamp: new Date().toISOString()
});

export const createError = (status, message, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const sanitizeUser = (user) => {
  const { password, apiKeys, ...safeUser } = user;
  return safeUser;
};
