/** @type {import('tailwindcss').Config} */

module.exports = {
  corePlugins: {
    preflight: false,
    container: false,
  },
  content: ['./src/runtime/components/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      transitionTimingFunction: {
        swing: 'cubic-bezier(0.56, 0.04, 0.25, 1)',
      },
    },
    spacing: {
      770: '770px',
      340: '340px',
      300: '300px',
      200: '200px',
      120: '120px',
      100: '100px',
      90: '90px',
      80: '80px',
      70: '70px',
      60: '60px',
      50: '50px',
      40: '40px',
      30: '30px',
      25: '25px',
      20: '20px',
      18: '18px',
      16: '16px',
      15: '15px',
      12: '12px',
      10: '10px',
      8: '8px',
      5: '5px',
      4: '4px',
      3: '3px',
      2: '2px',
      1: '1px',
      0: '0px',
    },
    borderWidth: {
      DEFAULT: '1px',
      0: '0',
      2: '2px',
      3: '3px',
      4: '4px',
    },
  },
}
