/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Poppins', 'Plus Jakarta Sans', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'elevation-xs': '0px 1px 2px rgba(0, 0, 0, 0.04)',
				'elevation-sm': '0px 2px 4px rgba(0, 0, 0, 0.06)',
				'elevation-md': '0px 4px 8px rgba(0, 0, 0, 0.08)',
				'elevation-lg': '0px 8px 16px rgba(0, 0, 0, 0.10)',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					50: '#e6ebf0',
					100: '#ccd7e1',
					200: '#99afc2',
					300: '#6687a4',
					400: '#335f85',
					500: '#002B45',
					600: '#002237',
					700: '#001a2a',
					800: '#00111c',
					900: '#00090e',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					50: '#ecfdf5',
					100: '#d1fae5',
					500: '#10b981',
					600: '#059669',
					700: '#047857',
				},
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					500: '#f59e0b',
					600: '#d97706',
					700: '#b45309',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			zIndex: {
				'dropdown': '10',
				'tooltip': '20',
				'fixed': '30',
				'sticky': '40',
				'modal-backdrop': '50',
				'modal': '60',
				'popover': '70',
				'toast': '80',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
