# Brand Tokens — NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12
> **Brand Reference**: https://humorous-courage-production.up.railway.app/brand-guidelines.html

## CSS Custom Properties

All UI code MUST use these CSS variables. No hardcoded colors, fonts, or spacing.

```css
:root {
  /* ═══════════════════════════════════════
     Core Palette
     ═══════════════════════════════════════ */
  --color-primary: #00ff41;       /* Green — primary actions, success */
  --color-secondary: #00ffff;     /* Cyan — secondary actions, info */
  --color-accent: #ff0080;        /* Pink — highlights, destructive hints */
  --color-warning: #ffaa00;       /* Amber — warnings, pending states */

  /* ═══════════════════════════════════════
     Pillar Colors
     ═══════════════════════════════════════ */
  --pillar-privacy: #00ff41;      /* Green */
  --pillar-ai: #00ffff;           /* Cyan */
  --pillar-blockchain: #ff0080;   /* Pink */
  --pillar-zk: #a855f7;           /* Purple */

  /* ═══════════════════════════════════════
     Backgrounds
     ═══════════════════════════════════════ */
  --bg-primary: #0a0a0a;          /* Page background */
  --bg-secondary: #111111;        /* Secondary sections */
  --bg-card: #1a1a1a;             /* Cards, panels */
  --bg-card-hover: #222222;       /* Card hover state */
  --bg-input: #1a1a1a;            /* Input fields */
  --bg-input-focus: #222222;      /* Input focus state */

  /* ═══════════════════════════════════════
     Text
     ═══════════════════════════════════════ */
  --color-text-bright: #ffffff;   /* Headings */
  --color-text: #e0e0e0;          /* Body text */
  --color-text-dim: #888888;      /* Muted, captions */
  --color-text-success: #00ff41;  /* Success messages */
  --color-text-error: #ff0080;    /* Error messages */
  --color-text-warning: #ffaa00;  /* Warning messages */

  /* ═══════════════════════════════════════
     Borders
     ═══════════════════════════════════════ */
  --border-color: #333333;
  --border-focus: #00ff41;        /* Input focus border */
  --border-error: #ff0080;        /* Error state border */

  /* ═══════════════════════════════════════
     Typography
     ═══════════════════════════════════════ */
  --font-primary: 'JetBrains Mono', monospace;  /* Headings, code, labels, nav, buttons */
  --font-secondary: 'Inter', sans-serif;         /* Body text, descriptions */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --font-xs: 0.75rem;    /* 12px */
  --font-sm: 0.875rem;   /* 14px */
  --font-base: 1rem;     /* 16px */
  --font-lg: 1.125rem;   /* 18px */
  --font-xl: 1.25rem;    /* 20px */
  --font-2xl: 1.5rem;    /* 24px */
  --font-3xl: 2rem;      /* 32px */
  --font-4xl: 2.5rem;    /* 40px */

  /* ═══════════════════════════════════════
     Spacing
     ═══════════════════════════════════════ */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
  --space-4xl: 6rem;     /* 96px */

  /* ═══════════════════════════════════════
     Border Radius
     ═══════════════════════════════════════ */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* ═══════════════════════════════════════
     Transitions
     ═══════════════════════════════════════ */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;

  /* ═══════════════════════════════════════
     Shadows (subtle, dark-mode appropriate)
     ═══════════════════════════════════════ */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow-green: 0 0 20px rgba(0, 255, 65, 0.15);
  --shadow-glow-cyan: 0 0 20px rgba(0, 255, 255, 0.15);
  --shadow-glow-pink: 0 0 20px rgba(255, 0, 128, 0.15);
}
```

## Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ns: {
          primary: '#00ff41',
          secondary: '#00ffff',
          accent: '#ff0080',
          warning: '#ffaa00',
          purple: '#a855f7',
          bg: {
            primary: '#0a0a0a',
            secondary: '#111111',
            card: '#1a1a1a',
            hover: '#222222',
          },
          text: {
            bright: '#ffffff',
            DEFAULT: '#e0e0e0',
            dim: '#888888',
          },
          border: '#333333',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 255, 65, 0.15)',
        'glow-cyan': '0 0 20px rgba(0, 255, 255, 0.15)',
        'glow-pink': '0 0 20px rgba(255, 0, 128, 0.15)',
      },
      animation: {
        'typewriter': 'typewriter 2s steps(20) forwards',
        'blink': 'blink 1s step-end infinite',
        'glitch': 'glitch 0.3s ease forwards',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
      },
      keyframes: {
        typewriter: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, 1px)' },
          '100%': { transform: 'translate(0)' },
        },
        'pulse-green': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 65, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 65, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};
```

## Font Loading

```html
<!-- Load from Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

For extension (offline): Bundle font files in `src/assets/fonts/`.

## Usage Rules

1. **ALWAYS** use CSS variables or Tailwind `ns-*` tokens
2. **NEVER** hardcode color values in components
3. **NEVER** use light backgrounds or light mode
4. **ALWAYS** use `font-mono` (JetBrains Mono) for headings, code, buttons, labels
5. **ALWAYS** use `font-sans` (Inter) for body text and descriptions
6. Respect `prefers-reduced-motion` for all animations

## Related Docs

- [UI Spec](UI_SPEC.md) — Screen designs and component specs
- [Dev Guide](DEV_GUIDE.md) — Coding conventions
