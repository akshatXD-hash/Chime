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
          bg: '#080B14',
          surface: '#0E1322',
          card: '#151B2C',
          hover: '#1D253B',
          active: '#242F4B',
          border: '#1F2942',
          borderLight: '#2D3A5C',
          blue: '#6366F1',
          blueHover: '#4F46E5',
          blueGlow: 'rgba(99, 102, 241, 0.2)',
          cyan: '#38BDF8',
          indigo: '#818CF8',
          violet: '#A78BFA',
          amber: '#F59E0B',
          emerald: '#10B981',
          text: '#F8FAFC',
          textSecondary: '#94A3B8',
          textMuted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 4px 20px -2px rgba(99, 102, 241, 0.35)',
        'glow-cyan': '0 4px 20px -2px rgba(56, 189, 248, 0.3)',
        'card-dark': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'subtle': '0 2px 8px 0 rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
