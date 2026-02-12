'use client';

import { useState, useCallback } from 'react';
import { validators, formatters } from '@/lib/validators';

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and handlers
 */
export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return '';

    // Required field validation
    if (rules.required) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return rules.requiredMessage || `${fieldName.replace(/_/g, ' ')} is required`;
      }
    }

    // Skip other validations if field is empty and not required
    if (!value || value === '') return '';

    // Type-specific validations
    if (rules.type === 'mobile') {
      const result = validators.mobile(value);
      if (!result.valid) return result.message;
    }

    if (rules.type === 'pan') {
      const result = validators.pan(value);
      if (!result.valid) return result.message;
    }

    if (rules.type === 'gst') {
      const result = validators.gst(value);
      if (!result.valid) return result.message;
    }

    if (rules.type === 'email') {
      const result = validators.email(value);
      if (!result.valid) return result.message;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be at most ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Invalid format';
    }

    // Custom validation function
    if (rules.custom) {
      const customError = rules.custom(value, values);
      if (customError) return customError;
    }

    return '';
  }, [validationRules, values]);

  /**
   * Handle field change
   */
  const handleChange = useCallback((name, value) => {
    // Apply formatter if available
    const rules = validationRules[name];
    let formattedValue = value;
    
    if (rules?.type && formatters[rules.type]) {
      formattedValue = formatters[rules.type](value);
    }

    setValues(prev => ({ ...prev, [name]: formattedValue }));

    // Validate in real-time if field was already touched
    if (touched[name]) {
      const error = validateField(name, formattedValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField, validationRules]);

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [values, validateField]);

  /**
   * Validate all fields
   */
  const validateAll = useCallback(() => {
    const newErrors = {};
    const newTouched = {};

    Object.keys(validationRules).forEach(fieldName => {
      newTouched[fieldName] = true;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [validationRules, values, validateField]);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set form values programmatically
   */
  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues: setFormValues,
    hasErrors: Object.keys(errors).some(key => errors[key]),
  };
}
