/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
    darkMode: "class",
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#006AE8',
                    hover: '#0055BB',
                    light: '#3389F0',
                    soft: '#E8F2FF',
                },
                background: '#F7F9FC',
                card: '#FFFFFF',
                section: '#F1F5F9',
                textPrimary: '#1E293B',
                textSecondary: '#64748B',
                textDisabled: '#94A3B8',
                border: '#E2E8F0',
                divider: '#CBD5E1',
                input: '#F8FAFC',
                success: '#22C55E',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#0EA5E9'
            }
        },
    },
    plugins: [],
}
