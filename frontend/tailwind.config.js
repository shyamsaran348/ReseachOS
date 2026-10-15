/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        'surface-card': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'border-subtle': '#e5e7eb',
        'border-strong': '#d1d5db',
        'text-primary': '#111827',
        'text-secondary': '#4b5563',
        'text-muted': '#9ca3af',
        primary: {
          DEFAULT: '#1e293b',
          accent: '#2563eb',
          'accent-hover': '#1d4ed8',
          container: '#2563eb',
          fixed: '#dbe1ff',
          'on-primary': '#ffffff',
        },
        'status-ready': {
          bg: '#ecfdf5',
          text: '#059669',
          border: '#a7f3d0',
        },
        'status-pending': {
          bg: '#eff6ff',
          text: '#2563eb',
          border: '#bfdbfe',
        },
        'status-failed': {
          bg: '#fef2f2',
          text: '#dc2626',
          border: '#fecaca',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
