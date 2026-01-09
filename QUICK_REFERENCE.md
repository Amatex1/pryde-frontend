# Platform-Grade Design System - Quick Reference

## 🎯 Core Principle

**"Calm. Trustworthy. Solid. Quietly confident."**

---

## 📐 Layout

### Page Container (ALWAYS USE)

\\\jsx
<div className="page-container">
  {/* Your content */}
</div>
\\\

- Max-width: 1140px
- Auto-centered
- Responsive padding

---

## 🎨 Colors

### Use Tokens, Not Hardcoded Values

\\\css
/* ✅ CORRECT */
background: var(--color-surface);
color: var(--color-text);
border: 1px solid var(--color-border);

/* ❌ WRONG */
background: #FFFFFF;
color: #1E1E26;
border: 1px solid rgba(0, 0, 0, 0.08);
\\\

### Available Tokens

\\\css
/* Backgrounds */
--color-bg
--color-surface
--color-surface-muted

/* Text */
--color-text
--color-text-secondary
--color-meta

/* Borders */
--color-border
--color-border-subtle
--color-border-strong

/* Brand (LIMITED USE) */
--color-brand
--color-brand-hover
\\\

---

## 📏 Spacing

### Use Scale, Not Random Values

\\\css
/* ✅ CORRECT */
margin-bottom: var(--space-5);
padding: var(--space-4);
gap: var(--space-3);

/* ❌ WRONG */
margin-bottom: 23px;
padding: 17px;
gap: 14px;
\\\

### Scale

\\\css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 24px
--space-6: 32px
--space-7: 40px
--space-8: 48px
\\\

### Semantic

\\\css
--section-gap: 48px  /* Between sections */
--card-gap: 24px     /* Between cards */
--card-padding: 24px /* Inside cards */
\\\

---

## 🔤 Typography

### Hierarchy

\\\jsx
<h1>Page Title</h1>           {/* 2.5rem, bold */}
<h2>Section Title</h2>         {/* 2rem, semibold */}
<h3>Subsection Title</h3>      {/* 1.5rem, semibold */}
<p>Body text</p>               {/* 1rem, regular */}
<span className="meta">Meta</span> {/* 0.875rem, muted */}
\\\

### Rules

- **One H1 per page**
- Metadata uses --color-meta
- No inline font sizes

---

## 🎴 Cards

### Standard Card

\\\css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
}
\\\

### Rules

- ❌ NO gradients
- ❌ NO shadows
- ❌ NO glow effects
- ✅ Flat and matte

---

## 🔘 Buttons

### Primary (ONE per section)

\\\jsx
<button className="btn-primary">Join Pryde</button>
\\\

### Secondary

\\\jsx
<button className="btn-secondary">Learn More</button>
\\\

### Tertiary

\\\jsx
<button className="btn-tertiary">Cancel</button>
\\\

### Rules

- Only ONE primary CTA per section
- All others must be secondary/tertiary
- No visual competition

---

## 🚫 What NOT to Do

### ❌ Gradients on Cards

\\\css
/* WRONG */
.card {
  background: linear-gradient(135deg, #EDEAFF 0%, #d4c5ff 100%);
}
\\\

### ❌ Heavy Shadows

\\\css
/* WRONG */
.card {
  box-shadow: 0 10px 40px rgba(108, 92, 231, 0.3);
}
\\\

### ❌ Glowing Borders

\\\css
/* WRONG */
.card {
  border: 2px solid var(--color-brand);
  box-shadow: 0 0 20px var(--color-brand);
}
\\\

### ❌ Floating Animations

\\\css
/* WRONG */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
\\\

### ❌ Random Spacing

\\\css
/* WRONG */
margin-bottom: 23px;
padding: 17px 19px;
\\\

### ❌ Hardcoded Colors

\\\css
/* WRONG */
color: #1E1E26;
background: #FFFFFF;
\\\

---

## ✅ What TO Do

### ✅ Use Page Container

\\\jsx
<div className="page-container">
  {/* Content */}
</div>
\\\

### ✅ Use Tokens

\\\css
background: var(--color-surface);
color: var(--color-text);
\\\

### ✅ Use Spacing Scale

\\\css
margin-bottom: var(--space-5);
padding: var(--space-4);
\\\

### ✅ Flat Cards

\\\css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
}
\\\

### ✅ One Primary CTA

\\\jsx
<div className="hero-buttons">
  <button className="btn-primary">Join</button>
  <button className="btn-secondary">Login</button>
</div>
\\\

---

## 📱 Responsive

### Breakpoints

\\\css
/* Mobile: < 768px (default) */
/* Tablet: 768px - 1023px */
/* Desktop: >= 1024px */
\\\

### Mobile-First

\\\css
/* Mobile (default) */
.element {
  padding: var(--space-4);
}

/* Tablet */
@media (min-width: 768px) {
  .element {
    padding: var(--space-5);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .element {
    padding: var(--space-6);
  }
}
\\\

---

## 🌙 Dark Mode

### Always Use Tokens

\\\css
/* Tokens automatically switch in dark mode */
background: var(--color-surface);
color: var(--color-text);
border: 1px solid var(--color-border);
\\\

---

## ♿ Accessibility

### Focus States

\\\css
button:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
\\\

### Reduced Motion

\\\css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
\\\

---

## 📋 Checklist

Before committing:

- [ ] Uses .page-container
- [ ] Uses spacing scale
- [ ] Uses color tokens
- [ ] No gradients on cards
- [ ] No heavy shadows
- [ ] One primary CTA per section
- [ ] Typography hierarchy clear
- [ ] Metadata is muted
- [ ] No decorative animations
- [ ] Responsive
- [ ] Dark mode works
- [ ] Accessibility

---

## 📚 Resources

- **Design Contract:** DESIGN_CONTRACT.md
- **Implementation Guide:** IMPLEMENTATION_GUIDE.md
- **Tokens:** src/styles/tokens.css
- **Layout:** src/styles/layout.css
- **Example:** src/pages/Home.css

---

## 🆘 When in Doubt

Ask: **"Does this feel like a serious platform, or an art project?"**

If it feels like an art project, simplify it.

---

**Version 1.0** - January 2026
