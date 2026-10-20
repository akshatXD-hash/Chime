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
          bg: '#141817',
          surface: '#1B201F',
          card: '#242B29',
          hover: '#2B3431',
          active: '#263D35',
          border: '#343E39',
          borderLight: '#45524B',
          blue: '#287D62',
          blueHover: '#226B54',
          blueGlow: 'rgba(99, 102, 241, 0.2)',
          cyan: '#8BCBB3',
          indigo: '#92CEB7',
          violet: '#B2D9C8',
          amber: '#F59E0B',
          emerald: '#10B981',
          text: '#F8FAFC',
          textSecondary: '#B2BDB7',
          textMuted: '#8B9B92',
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
