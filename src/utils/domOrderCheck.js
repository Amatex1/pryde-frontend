/**
 * DOM ORDER SANITY CHECK
 * Runs in development only.
 * Warns if critical layout elements are out of order.
 */

export function checkDomOrder() {
  if (process.env.NODE_ENV !== "development") return;

  const checks = [
    {
      selector: "nav.navbar.glossy",
      expected: ["navbar-logo", "navbar-utility-search", "navbar-actions"],
    },
    {
      selector: ".post-header",
      expected: ["post-author", "post-header-actions"],
    },
  ];

  checks.forEach(({ selector, expected }) => {
    const root = document.querySelector(selector);
    if (!root) return;

    const children = Array.from(root.children).map((el) =>
      expected.find((cls) => el.classList.contains(cls))
    );

    const filtered = children.filter(Boolean);

    if (filtered.join(",") !== expected.join(",")) {
      console.warn(
        `[Pryde DOM Order Warning] ${selector} children order is incorrect.`,
        "\nExpected:", expected,
        "\nFound:", filtered
      );
    }
  });
}

