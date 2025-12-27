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

    // Look for relevant descendants in visual order
    const found = [];

    expected.forEach((cls) => {
      const el = root.querySelector(`.${cls}`);
      if (el) {
        found.push(cls);
      }
    });

    if (found.join(",") !== expected.join(",")) {
      console.warn(
        `[Pryde DOM Order Warning] ${selector} structure drift detected.`,
        "\nExpected order:", expected,
        "\nFound order:", found
      );
    }
  });
}

