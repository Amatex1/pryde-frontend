# Pryde Layout System

## Core Primitives

The layout system uses a strict hierarchy of CSS-only primitives:

```
PageViewport
  └── PageContainer (width constraint)
       └── PageLayout (column arrangement)
            └── Feature Content
```

## 1. PageViewport

**File**: `src/layouts/PageViewport.jsx`

Establishes the full-viewport container for each page.

```jsx
<PageViewport>
  {/* Page content */}
</PageViewport>
```

**CSS**:
- `width: 100%`
- `min-height: 100vh`
- Handles safe areas for PWA

## 2. PageContainer

**File**: `src/layouts/PageContainer.jsx`
**Authority**: `src/styles/layout.css`

Constrains content width and centers it. Uses CSS variables for responsive behavior.

```css
.page-container {
  width: 100%;
  max-width: var(--page-max-width);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--page-padding);
  padding-right: var(--page-padding);
}
```

### Responsive Variables

| Breakpoint | --page-max-width | --page-padding |
|------------|------------------|----------------|
| Mobile (≤600px) | 100% (full-bleed) | 12px |
| Tablet (≥601px) | 960px | 24px |
| Desktop (≥1025px) | 1200px | 32px |
| Wide (≥1400px) | 1400px | 40px |

## 3. PageLayout

**File**: `src/layouts/PageLayout.jsx`

Arranges content into columns (main + sidebar).

```jsx
<PageLayout>
  <main>Content</main>
  <aside>Sidebar</aside>
</PageLayout>
```

**Mobile**: Single column (sidebar stacks below)
**Desktop**: Two columns (grid: main + sidebar)

## CSS Variable Authority

**⚠️ CRITICAL**: All layout variables are defined in ONE place:

```
src/styles/layout.css
```

No other CSS file should define:
- `--page-max-width`
- `--page-padding`
- `.page-container` width/max-width rules

## Mobile vs Tablet vs Desktop

All responsive behavior is handled via CSS media queries in `layout.css`:

```css
/* Mobile (default) */
:root {
  --page-max-width: 100%;
  --page-padding: 12px;
}

/* Tablet */
@media (min-width: 601px) {
  :root {
    --page-max-width: 960px;
    --page-padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  :root {
    --page-max-width: 1200px;
    --page-padding: 32px;
  }
}
```

## Usage Example

```jsx
import PageContainer from '../layouts/PageContainer';
import PageLayout from '../layouts/PageLayout';

function MyPage() {
  return (
    <PageContainer>
      <PageLayout>
        <main className="page-main">
          {/* Main content */}
        </main>
        <aside className="page-sidebar">
          {/* Sidebar */}
        </aside>
      </PageLayout>
    </PageContainer>
  );
}
```

## Rules

1. **Never** add hard-coded `max-width` to `.page-container` outside layout.css
2. **Never** use `!important` on layout properties
3. **Always** use CSS variables for layout dimensions
4. **Never** fork layouts based on viewport detection in JS
5. Feature CSS may only affect content *inside* the layout primitives

