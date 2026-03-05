import { useTooltip } from '../hooks/useTooltip';

/**
 * IconButton - A button component with built-in tooltip support
 * 
 * Combines CSS-based tooltips (data-tooltip) with JavaScript fallback
 * to ensure tooltips work in all environments (localhost + production).
 * 
 * Usage:
 * <IconButton 
 *   icon={<SomeIcon />} 
 *   tooltip="Click me" 
 *   onClick={() => doSomething()}
 * />
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element (Lucide icon, etc.)
 * @param {string} props.tooltip - Tooltip text content
 * @param {string} props.tooltipPosition - Position: 'top' | 'bottom' | 'left' | 'right'
 * @param {number} props.tooltipDelay - Delay before showing tooltip (ms)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - 'default' | 'primary' | 'ghost' | 'danger'
 * @param {string} props.size - 'sm' | 'md' | 'lg'
 * @param {boolean} props.disabled - Disable the button
 * @param {Function} props.onClick - Click handler
 * @param {Object} props...rest - Other button props (aria-label, etc.)
 */
export function IconButton({
  icon,
  tooltip,
  tooltipPosition = 'bottom',
  tooltipDelay = 300,
  className = '',
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  ...rest
}) {
  const { tooltipProps, TooltipComponent } = useTooltip({
    content: tooltip,
    position: tooltipPosition,
    delay: tooltipDelay,
  });

  const sizeClasses = {
    sm: 'icon-btn--sm',
    md: 'icon-btn--md',
    lg: 'icon-btn--lg',
  };

  const variantClasses = {
    default: 'icon-btn--default',
    primary: 'icon-btn--primary',
    ghost: 'icon-btn--ghost',
    danger: 'icon-btn--danger',
  };

  return (
    <button
      className={`
        icon-btn 
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      // CSS tooltip attribute (works in most cases)
      data-tooltip={tooltip}
      // JS tooltip handlers (fallback)
      {...tooltipProps}
      // Pass through other props
      {...rest}
    >
      {icon}
      {/* JS tooltip component (renders via portal) */}
      {TooltipComponent}
    </button>
  );
}

export default IconButton;
