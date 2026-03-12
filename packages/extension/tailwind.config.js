/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,html}'],
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
      animation: {
        typewriter: 'typewriter 2s steps(20) forwards',
        blink: 'blink 1s step-end infinite',
        glitch: 'glitch 0.3s ease forwards',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
      },
      keyframes: {
        typewriter: {
          from: { width: '0' },
          to: { width: '100%' },
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
