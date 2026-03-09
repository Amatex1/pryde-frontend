/**
 * Accessible Form Components
 * Provides properly labeled form inputs
 */

import React from 'react';
import './FormComponents.css';

/**
 * AccessibleFormField - Wraps form inputs with proper labels
 * @param {string} label - The label text
 * @param {string} htmlFor - The id of the associated input
 * @param {boolean} required - Whether this field is required
 * @param {string} helpText - Optional help text below the label
 * @param {string} error - Optional error message
 * @param {React.ReactNode} children - The input element(s)
 */
export function AccessibleFormField({ 
  label, 
  htmlFor, 
  required = false, 
  helpText, 
  error, 
  children 
}) {
  const helpId = htmlFor ? `${htmlFor}-help` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  
  return (
    <div className="form-field-wrapper">
      <label 
        htmlFor={htmlFor} 
        className={`form-label ${required ? 'required' : ''}`}
      >
        {label}
        {required && <span className="required-indicator" aria-hidden="true"> *</span>}
      </label>
      
      {children}
      
      {helpText && !error && (
        <span 
          id={helpId} 
          className="form-help"
        >
          {helpText}
        </span>
      )}
      
      {error && (
        <span 
          id={errorId} 
          className="form-error" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * AccessibleInput - Input with built-in label
 */
export function AccessibleInput({ 
  id, 
  label, 
  type = 'text', 
  required = false,
  helpText,
  error,
  ...props 
}) {
  return (
    <AccessibleFormField
      label={label}
      htmlFor={id}
      required={required}
      helpText={helpText}
      error={error}
    >
      <input
        id={id}
        type={type}
        className={`form-input ${error ? 'has-error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...props}
      />
    </AccessibleFormField>
  );
}

/**
 * AccessibleTextarea - Textarea with built-in label
 */
export function AccessibleTextarea({ 
  id, 
  label, 
  required = false,
  helpText,
  error,
  ...props 
}) {
  return (
    <AccessibleFormField
      label={label}
      htmlFor={id}
      required={required}
      helpText={helpText}
      error={error}
    >
      <textarea
        id={id}
        className={`form-textarea ${error ? 'has-error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...props}
      />
    </AccessibleFormField>
  );
}

/**
 * AccessibleSelect - Select with built-in label
 */
export function AccessibleSelect({ 
  id, 
  label, 
  options = [],
  required = false,
  helpText,
  error,
  placeholder,
  ...props 
}) {
  return (
    <AccessibleFormField
      label={label}
      htmlFor={id}
      required={required}
      helpText={helpText}
      error={error}
    >
      <select
        id={id}
        className={`form-select ${error ? 'has-error' : ''}`}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </AccessibleFormField>
  );
}

/**
 * AccessibleCheckbox - Checkbox with proper labeling
 */
export function AccessibleCheckbox({ 
  id, 
  label, 
  checked, 
  onChange,
  ...props 
}) {
  return (
    <div className="checkbox-wrapper">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="form-checkbox"
        {...props}
      />
      <label htmlFor={id} className="checkbox-label">
        {label}
      </label>
    </div>
  );
}

/**
 * AccessibleRadioGroup - Radio group with fieldset and legend
 */
export function AccessibleRadioGroup({ 
  name, 
  label, 
  options = [], 
  value, 
  onChange,
  required = false,
  error 
}) {
  const groupId = `${name}-group`;
  
  return (
    <fieldset className="radio-group-fieldset">
      <legend 
        className="radio-group-legend"
        aria-required={required}
      >
        {label}
        {required && <span className="required-indicator" aria-hidden="true"> *</span>}
      </legend>
      
      <div className="radio-options">
        {options.map((option) => (
          <div key={option.value} className="radio-option">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="form-radio"
            />
            <label 
              htmlFor={`${name}-${option.value}`}
              className="radio-label"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {error && (
        <span className="form-error" role="alert" aria-live="polite">
          {error}
        </span>
      )}
    </fieldset>
  );
}

export default {
  AccessibleFormField,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleRadioGroup
};
