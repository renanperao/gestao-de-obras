/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primaria: 'var(--cor-primaria)',
        destaque: 'var(--cor-destaque)',
        fundo: 'var(--fundo)',
        superficie: 'var(--superficie)',
        texto: 'var(--texto)',
        'texto-suave': 'var(--texto-suave)',
        borda: 'var(--borda)',
      },
      borderRadius: {
        card: 'var(--raio-card)',
      },
      boxShadow: {
        card: 'var(--sombra-card)',
      },
      fontFamily: {
        sans: ['Raleway', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
