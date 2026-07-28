import API from "./axios";

/**
 * Password Reset API Functions
 * Handles all password reset related API calls using the Resend package
 */

/**
 * Request a password reset link
 * @param {string} email - User's email address
 * @returns {Promise<{message: string, success: boolean}>}
 */
export const requestPasswordReset = (email) => {
  return API.post("/auth/forgot-password", { email });
};

/**
 * Verify if a reset token is valid
 * @param {string} token - Reset token from email link
 * @returns {Promise<{message: string, valid: boolean}>}
 */
export const verifyResetToken = (token) => {
  return API.post("/auth/verify-reset-token", { token });
};

/**
 * Reset the password using a valid token
 * @param {string} token - Reset token from email link
 * @param {string} newPassword - New password (min 6 characters)
 * @param {string} confirmPassword - Confirmation of new password
 * @returns {Promise<{message: string, success: boolean}>}
 */
export const resetPassword = (token, newPassword, confirmPassword) => {
  return API.post("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword
  });
};

export default {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};
