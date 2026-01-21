# 🎨 One Surface CSS Pattern Guide

**How to maintain the "One Surface" design pattern across Pryde.**

---

## 🎯 Core Principle

**Content floats on the page background. No nested boxes.**

---

## ✅ The Pattern

### 1. Container Transparency
```css
.container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important; /* or minimal padding */
}
```

### 2. Content Separation via Space
```css
.content-item {
  margin-bottom: 2rem; /* 32px on desktop */
  padding: 1.5rem 0; /* Vertical padding only */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Subtle divider */
  background: transparent !important;
  border-left: none !important;
  border-right: none !important;
  border-top: none !important;
  box-shadow: none !important;
}
```

### 3. Mobile Full Width
```css
@media (max-width: 768px) {
  .container {
    max-width: 100% !important;
    padding: 0 1rem !important; /* 16px side padding only */
  }
  
  .content-item {
    padding: 1.5rem 0 !important; /* Vertical padding only */
    border-radius: 0 !important; /* No rounded corners */
  }
}
```

---

## ❌ What to Avoid

### Don't: Nested Boxes
```css
/* ❌ BAD */
.outer-container {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 1rem;
}

.inner-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  padding: 1rem;
}
```

### Don't: Boxed Content
```css
/* ❌ BAD */
.content-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1rem;
  margin-bottom: 1rem;
}
```

---

## ✅ What to Do Instead

### Do: Transparent Containers
```css
/* ✅ GOOD */
.outer-container {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

.content-item {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding: 1.5rem 0 !important;
  margin-bottom: 0 !important; /* Use gap instead */
}
```

### Do: Space-Based Separation
```css
/* ✅ GOOD */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 2rem; /* 32px between items */
}

.content-item {
  /* No background, no border, no shadow */
  /* Separated by gap in parent */
}
```

---

## 📐 Spacing Guidelines

### Desktop
- **Between items:** 32px (2rem)
- **Vertical padding:** 24px (1.5rem)
- **Horizontal padding:** 0 (full width within container)
- **Container max-width:** 760px (Feed), 1200px (Messages)

### Mobile
- **Between items:** 24px (1.5rem)
- **Vertical padding:** 24px (1.5rem)
- **Horizontal padding:** 16px (1rem) on container only
- **Container max-width:** 100%

---

## 🎨 Divider Guidelines

### When to Use Dividers
- Between content items (subtle)
- Between sections (subtle)
- Between header and content (subtle)

### Divider Style
```css
border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Very subtle */
```

### When NOT to Use Dividers
- Around content (use space instead)
- Between nested containers (eliminate nesting)
- On mobile (use space instead)

---

## 🎯 Target Feeling

**"Quiet, open, modern, real platform."**

- ✅ Content floats on background
- ✅ Space separates content
- ✅ No nested boxes
- ✅ No white cards
- ✅ No thick borders
- ✅ No shadows
- ✅ Subtle dividers only

---

## 📋 Checklist for New Components

When creating a new component, ask:

- [ ] Does it have a background? (Should be transparent)
- [ ] Does it have a border? (Should be none or subtle divider)
- [ ] Does it have a shadow? (Should be none)
- [ ] Does it have rounded corners? (Should be 0 on mobile)
- [ ] Is it nested inside another box? (Eliminate nesting)
- [ ] Does it use space for separation? (Should use gap/margin)
- [ ] Is it full width on mobile? (Should be 100% with 16px padding)

---

## 🎨 Examples from Pryde

### Feed Post
```css
.post-card {
  padding: 1.5rem 0 !important; /* Vertical only */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  background: transparent !important;
  border-left: none !important;
  border-right: none !important;
  border-top: none !important;
  box-shadow: none !important;
}
```

### Message Bubble
```css
.message-bubble.received {
  background: rgba(255, 255, 255, 0.05) !important; /* Very subtle */
  border: none !important; /* No border */
  border-radius: 18px 18px 18px 4px;
}
```

### Conversation Item
```css
.conversation-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  background: transparent !important;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.03) !important; /* Very subtle */
}
```

---

**Follow this pattern for all new components to maintain the "One Surface" design.** 🎨✨

