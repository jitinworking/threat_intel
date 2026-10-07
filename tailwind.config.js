/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '14px',
      },
      colors: {
        background: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          hover: 'var(--color-surface-hover)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          muted: 'var(--color-primary-muted)',
        },
        critical: {
          DEFAULT: 'var(--color-critical)',
          muted: 'var(--color-critical-muted)',
        },
        high: {
          DEFAULT: 'var(--color-high)',
          muted: 'var(--color-high-muted)',
        },
        medium: {
          DEFAULT: 'var(--color-medium)',
          muted: 'var(--color-medium-muted)',
        },
        low: {
          DEFAULT: 'var(--color-low)',
          muted: 'var(--color-low-muted)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          muted: 'var(--color-success-muted)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },

        // Legacy compatibility mappings
        foreground: 'var(--color-text)',
        paper: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-elevated)',
        },
        ink: {
          DEFAULT: 'var(--color-text)',
          mid: 'var(--color-text-secondary)',
        },
        line: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        destructive: 'var(--color-critical)',
        warning: 'var(--color-high)',
        red: 'var(--color-critical)',
        amber: 'var(--color-high)',
        blue: 'var(--color-primary)',
        green: 'var(--color-success)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
