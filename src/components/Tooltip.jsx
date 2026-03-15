import { useState } from 'react';
import './Tooltip.css';

export default function Tooltip({ children, text }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onTouchStart={() => setVisible(true)}
      onTouchEnd={() => setTimeout(() => setVisible(false), 1200)}
    >
      {children}
      {visible && <div className="tooltip-bubble" role="tooltip">{text}</div>}
    </div>
  );
}
