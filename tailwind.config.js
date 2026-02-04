/** @type {import('tailwindcss').Config} */
const spectrum = require('./src/config/spectrum-colors.js');

module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      // ====== SPECTRUM COLORS ======
      colors: {
        // Keep existing semantic colors for compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // Add Spectrum color palette
        spectrum: {
          purple: spectrum.colors.purple,
          indigo: spectrum.colors.indigo,
          cyan: spectrum.colors.cyan,
          amber: spectrum.colors.amber,
          emerald: spectrum.colors.emerald,
          red: spectrum.colors.red,
          gray: spectrum.colors.gray,
          quantum: spectrum.colors.quantum,
        }
      },

      // ====== SPACING SYSTEM (8px base grid) ======
      spacing: {
        ...spectrum.spacing,
      },

      // ====== TYPOGRAPHY ======
      fontSize: spectrum.fontSize,
      fontFamily: {
        heading: spectrum.fontFamily.heading,
        body: spectrum.fontFamily.body,
        mono: spectrum.fontFamily.mono,
      },

      // ====== SHADOWS (Depth System) ======
      boxShadow: {
        ...spectrum.boxShadow,
      },

      // ====== BORDER RADIUS ======
      borderRadius: {
        ...spectrum.borderRadius,
      },

      // ====== TRANSITIONS & ANIMATIONS ======
      transitionDuration: {
        fast: spectrum.transitionDuration.fast,
        base: spectrum.transitionDuration.base,
        slow: spectrum.transitionDuration.slow,
      },
      transitionTimingFunction: {
        ...spectrum.transitionTiming,
      },

      // ====== Z-INDEX SYSTEM ======
      zIndex: spectrum.zIndex,

      // ====== GAP (spacing between grid items) ======
      gap: spectrum.spacing,

      // ====== KEYFRAMES & ANIMATIONS ======
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        // Spectrum-specific animations
        'spectrum-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        'spectrum-shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        'spectrum-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spectrum-pulse': 'spectrum-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spectrum-shimmer': 'spectrum-shimmer 2s infinite',
        'spectrum-glow': 'spectrum-glow 3s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}