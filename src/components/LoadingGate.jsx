/**
 * LoadingGate - Pass-through wrapper.
 * Loading screen removed; children render immediately on page load/refresh.
 */
function LoadingGate({ children }) {
  return children;
}

export default LoadingGate;
