/**
 * Field validation utilities for forms
 */

export const validators = {
  /**
   * Validate mobile number (exactly 10 digits)
   */
  mobile: (value) => {
    if (!value) return { valid: false, message: 'Mobile number is required' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 10) return { valid: false, message: 'Mobile number must be exactly 10 digits' };
    return { valid: true, message: '' };
  },

  /**
   * Validate PAN number (ABCDE1234F format)
   */
  pan: (value) => {
    if (!value) return { valid: true, message: '' }; // Optional field
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(value)) {
      return { valid: false, message: 'PAN must be in format: ABCDE1234F' };
    }
    return { valid: true, message: '' };
  },

  /**
   * Validate GST number (15 characters: 22AAAAA0000A1Z5)
   */
  gst: (value) => {
    if (!value) return { valid: true, message: '' }; // Optional field
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(value)) {
      return { valid: false, message: 'GST must be in format: 22AAAAA0000A1Z5' };
    }
    return { valid: true, message: '' };
  },

  /**
   * Validate email address
   */
  email: (value) => {
    if (!value) return { valid: true, message: '' }; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true, message: '' };
  },
};

/**
 * Field formatters to clean/format input values
 */
export const formatters = {
  /**
   * Format mobile number (remove non-digits, limit to 10)
   */
  mobile: (value) => value.replace(/\D/g, '').slice(0, 10),

  /**
   * Format PAN (uppercase, limit to 10)
   */
  pan: (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),

  /**
   * Format GST (uppercase, limit to 15)
   */
  gst: (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15),

  /**
   * Format email (lowercase, trim)
   */
  email: (value) => value.toLowerCase().trim(),
};

/**
 * Validate all fields in a form
 * @param {Object} fields - Object with field names as keys and values
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - { valid: boolean, errors: Object }
 */
export function validateForm(fields, requiredFields = []) {
  const errors = {};
  let valid = true;

  // Check required fields
  requiredFields.forEach((field) => {
    if (!fields[field] || fields[field].trim() === '') {
      errors[field] = `${field.replace(/_/g, ' ')} is required`;
      valid = false;
    }
  });

  // Validate mobile if present
  if (fields.mobile_number) {
    const result = validators.mobile(fields.mobile_number);
    if (!result.valid) {
      errors.mobile_number = result.message;
      valid = false;
    }
  }

  // Validate PAN if present
  if (fields.pan_number) {
    const result = validators.pan(fields.pan_number);
    if (!result.valid) {
      errors.pan_number = result.message;
      valid = false;
    }
  }

  // Validate GST if present
  if (fields.gst_number) {
    const result = validators.gst(fields.gst_number);
    if (!result.valid) {
      errors.gst_number = result.message;
      valid = false;
    }
  }

  // Validate email if present
  if (fields.email) {
    const result = validators.email(fields.email);
    if (!result.valid) {
      errors.email = result.message;
      valid = false;
    }
  }

  return { valid, errors };
}
