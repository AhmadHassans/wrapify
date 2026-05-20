/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wrap: {
          pink: '#E8508E',
          rose: '#C73E6F',
          mauve: '#A8366A',
          lilac: '#9B6B9E',
          dusty: '#D89CB0',
          blush: '#F5D9E2',
          cream: '#FBF1F0',
          plum: '#3A1A2A',
          ink: '#2A1320'
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 12px 32px -12px rgba(199, 62, 111, 0.28)',
        pop: '0 16px 40px -12px rgba(168, 54, 106, 0.42)',
        glow: '0 0 0 4px rgba(232, 80, 142, 0.12)'
      },
      borderRadius: {
        pill: '50px'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideInLeft: {
          '0%': { opacity: 0, transform: 'translateX(-30px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' }
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(30px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '33%': { transform: 'translate(15px, -15px) rotate(2deg)' },
          '66%': { transform: 'translate(-10px, -25px) rotate(-2deg)' }
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.95)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.05)' }
        },
        sparkle: {
          '0%, 100%': { opacity: 0, transform: 'scale(0.5) rotate(0deg)' },
          '50%': { opacity: 1, transform: 'scale(1) rotate(180deg)' }
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.92)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        }
      },
      animation: {
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        fadeIn: 'fadeIn 0.6s ease-out both',
        slideInLeft: 'slideInLeft 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        slideInRight: 'slideInRight 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 4s ease-in-out infinite',
        floatSlow: 'floatSlow 12s ease-in-out infinite',
        blob: 'blob 18s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
        sparkle: 'sparkle 2.5s ease-in-out infinite',
        scaleIn: 'scaleIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        bounceSoft: 'bounceSoft 1.8s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        gradientShift: 'gradientShift 8s ease infinite',
        wiggle: 'wiggle 1.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
