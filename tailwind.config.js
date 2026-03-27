/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './vendor/laravel/filament/resources/views/**/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],
    theme: {
        extend: {
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideInUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
                bounce: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                flipX: {
                    '0%': { transform: 'rotateX(0deg)' },
                    '100%': { transform: 'rotateX(360deg)' },
                },
                glow: {
                    '0%, 100%': { 'box-shadow': '0 0 5px rgba(59, 130, 246, 0.5)' },
                    '50%': { 'box-shadow': '0 0 20px rgba(59, 130, 246, 0.8)' },
                },
                countUp: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                fadeIn: 'fadeIn 0.6s ease-out',
                slideInUp: 'slideInUp 0.6s ease-out',
                slideInDown: 'slideInDown 0.6s ease-out',
                slideInLeft: 'slideInLeft 0.6s ease-out',
                slideInRight: 'slideInRight 0.6s ease-out',
                scaleIn: 'scaleIn 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                bounce: 'bounce 1s ease-in-out infinite',
                flipX: 'flipX 0.6s ease-out',
                glow: 'glow 2s ease-in-out infinite',
                countUp: 'countUp 0.5s ease-out',
            },
            transitionDuration: {
                '300': '300ms',
                '500': '500ms',
            },
        },
    },
    plugins: [],
}
