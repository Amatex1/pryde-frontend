# Pryde CSS Architecture

The Pryde frontend follows a structured CSS architecture.

## Core

Global design system and safety guards.

Files:

* `tokens.css` → color, spacing, typography tokens (in design-system.css)
* `z-index.css` → centralized stacking order
* `layout-guards.css` → global layout protections

Core files must NOT contain component styling.

## Components

Reusable UI styling.

Examples:

* button.css (in components.css)
* modal.css (in components.css)
* tooltip.css (in components.css)
* navbar.css

Components must be isolated and reusable.

## Pages

Page-specific layout rules.

Examples:

* Feed.css
* Profile.css
* Messages.css

Page files should not override core tokens.
