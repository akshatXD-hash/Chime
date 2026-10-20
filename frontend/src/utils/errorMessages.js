export const SESSION_EXPIRED = 'Your session has expired. Please sign in again to continue.';

export function getErrorMessage(error) {
  const status = error.response?.status;
  const url = error.config?.url || '';
  const signingIn = /\/auth\/signin/.test(url);
  const signingUp = /\/auth\/signup/.test(url);
  if (status === 401) return signingIn ? 'The email or password is incorrect. Please try again.' : SESSION_EXPIRED;
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'This is taking longer than expected. Please try again.';
  if (!error.response) return 'Unable to connect. Check your internet connection and try again.';
  if (status === 403) return 'You no longer have permission to do that. Please refresh and try again.';
  if (status === 404) return "We couldn't find what you were looking for. Please refresh and try again.";
  if (status === 409 && signingUp) return 'An account with this email already exists. Please sign in instead.';
  if (status === 413) return 'This file is too large. Please choose a smaller one.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (status >= 500) return "Something went wrong on our end. Please try again in a moment.";
  if (status === 400 || status === 422) {
    if (signingIn || signingUp) return 'Please check your details. Enter a valid email and a password with at least 6 characters.';
    return "We couldn't save those changes. Please check the details and try again.";
  }
  return "We couldn't complete that request. Please try again.";
}
