import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 *
 * Uses the Pryde Social design system button classes from components.css
 *
 * @param {string} variant - Button style: 'primary', 'secondary', 'ghost', 'danger', 'success'
 * @param {string} size - Button size: 'sm', 'md' (default), 'lg', 'icon', 'icon-sm'
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 * @param {function} onClick - Click handler
 * @param {string} type - Button type (button, submit, reset)
 * @param {string} title - Button title/tooltip
 * @param {string} id - Button id
 * @param {string} ariaLabel - Accessibility label
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  onClick,
  type = 'button',
  title,
  id,
  'aria-label': ariaLabel,
  // Explicitly ignore any other props to prevent spreading unknown props to DOM
  // This prevents production crashes like "t.on is not a function" when objects are accidentally spread
  ...ignoredProps // eslint-disable-line no-unused-vars
}) => {
  // Build class names
  const classes = [
    'pryde-btn',
    variant !== 'primary' && `pryde-btn-${variant}`,
    size !== 'md' && `pryde-btn-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      type={type}
      title={title}
      id={id}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Button;

