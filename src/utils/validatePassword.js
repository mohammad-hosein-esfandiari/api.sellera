// Password validation function
const validatePassword = (password) => {
  const errors = [];

  // Check password length (at least 8 characters)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  return errors;
};

module.exports = { validatePassword}