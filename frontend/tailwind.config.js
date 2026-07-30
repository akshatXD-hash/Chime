/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        devs: {
          bg: '#050811',
          surface: '#0B0F19',
          card: '#121827',
          hover: '#1B2438',
          active: '#23304A',
          border: '#202B42',
          borderLight: '#2D3C5C',
          blue: '#3B82F6',
          blueHover: '#2563EB',
          blueGlow: 'rgba(59, 130, 246, 0.25)',
          cyan: '#38BDF8',
          indigo: '#6366F1',
          text: '#F8FAFC',
          textSecondary: '#94A3B8',
          textMuted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.35)',
        'glow-cyan': '0 0 15px rgba(56, 189, 248, 0.3)',
        'card-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
