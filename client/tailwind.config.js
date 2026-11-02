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
        background: {
          DEFAULT: '#F2F1EE',
          surface: '#E8E6E2',
          elevated: '#FFFFFF',
          card: '#E8E6E2',
          border: 'rgba(49, 35, 49, 0.12)',
          subtle: '#E2DFDA',
        },
        aubergine: {
          DEFAULT: '#30152F',
          dark: '#200F22',
          muted: '#654D63',
          light: '#7E6C7D',
          border: 'rgba(49, 35, 49, 0.12)',
          subtle: 'rgba(49, 35, 49, 0.06)',
          hover: '#3E1C3D',
        },
        silver: {
          ice: '#F2F1EE',
          pearl: '#E8E6E2',
          surface: '#E8E6E2',
          border: 'rgba(49, 35, 49, 0.12)',
          steel: '#D5D3D1',
          muted: '#7E6C7D',
          white: '#FFFFFF',
        },
        canon: {
          DEFAULT: '#287A59',
          light: '#359D73',
          dark: '#1C5941',
          subtle: 'rgba(40, 122, 89, 0.10)',
        },
        hypothetical: {
          DEFAULT: '#986421',
          light: '#BD8030',
          dark: '#734A16',
          subtle: 'rgba(152, 100, 33, 0.10)',
        },
        alternate: {
          DEFAULT: '#986421',
          light: '#BD8030',
          dark: '#734A16',
          subtle: 'rgba(152, 100, 33, 0.10)',
        },
        multiverse: {
          DEFAULT: '#654D63',
          light: '#836581',
          dark: '#30152F',
          subtle: 'rgba(101, 77, 99, 0.10)',
        },
        alert: {
          DEFAULT: '#A83842',
          light: '#C44E58',
          dark: '#7D262E',
          subtle: 'rgba(168, 56, 66, 0.10)',
        },
        info: {
          DEFAULT: '#3C6E9E',
          light: '#568BBF',
          dark: '#284C6F',
          subtle: 'rgba(60, 110, 158, 0.10)',
        }
      },
      fontFamily: {
        editorial: ['Cormorant Garamond', 'Georgia', 'serif'],
        cinematic: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'editorial': '0 20px 40px -15px rgba(48, 21, 47, 0.08)',
        'editorial-hover': '0 25px 50px -12px rgba(48, 21, 47, 0.14)',
        'silver-card': '0 4px 20px -2px rgba(48, 21, 47, 0.05)',
        'cinematic': '0 30px 60px -15px rgba(32, 15, 34, 0.2)',
      }
    },
  },
  plugins: [],
}

