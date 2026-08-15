/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Sleek Luxury Dark Palette
                brand: {
                    black: '#ffffff', // Inverted for light text on dark bg
                    dark: '#e4e4e7',  // Zinc-200
                    gray: '#161618',  // Zinc-900 (Card background)
                    cream: '#09090b', // Zinc-950 (Outer page background)
                    accent: '#a1a1aa', // Muted label color (Zinc-400)
                },
                // Aliasing rustic colors to dark theme palette
                rustic: {
                    50: '#09090b', // brand.cream
                    100: '#161618', // brand.gray
                    200: '#27272a', // zinc-800
                    300: '#3f3f46', // zinc-700
                    400: '#52525b', // zinc-650
                    500: '#71717a', // zinc-500
                    600: '#a1a1aa', // zinc-400
                    700: '#a1a1aa', // brand.accent
                    800: '#ffffff', // brand.black
                    900: '#f4f2ed',
                },
                olive: {
                    500: '#a1a1aa', // Mapped to accent
                    600: '#ffffff', // Mapped to black
                }
            },
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                display: ['"DM Sans"', 'sans-serif'],
                serif: ['"DM Sans"', 'serif'], // Override serif to be modern
                script: ['"DM Sans"', 'sans-serif'], // Remove script font entirely
            },
            backgroundImage: {
                'gradient-soft': 'linear-gradient(to bottom right, #f9f8f6, #f4f2ed)',
            },
            borderRadius: {
                '4xl': '2.5rem',
                '5xl': '3rem',
            },
            boxShadow: {
                'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }
        },
    },
    plugins: [],
}
