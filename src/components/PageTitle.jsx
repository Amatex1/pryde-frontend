import { useEffect, useState } from "react";
import "./PageTitle.css";

/**
 * One Header Rule:
 * - No global page banners
 * - Titles live inside content
 * - Optional first-visit visibility
 */
export default function PageTitle({
  title,
  subtitle,
  pageKey,
  firstVisitOnly = false,
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!firstVisitOnly) return;

    const seen = localStorage.getItem(`seen:${pageKey}`);
    if (seen) {
      setVisible(false);
    } else {
      localStorage.setItem(`seen:${pageKey}`, "true");
    }
  }, [firstVisitOnly, pageKey]);

  if (!visible) return null;

  return (
    <header className="page-title">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

