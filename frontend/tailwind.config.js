export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        overlay: 'var(--bg-overlay)',
        
        borderSubtle: 'var(--border-subtle)',
        borderDefault: 'var(--border-default)',
        borderBright: 'var(--border-bright)',
        
        accent: 'var(--accent-green)',
        accentDim: 'var(--accent-green-dim)',
        danger: 'var(--accent-red)',
        dangerDim: 'var(--accent-red-dim)',
        info: 'var(--accent-blue)',
        warning: 'var(--accent-yellow)',
        purple: 'var(--accent-purple)',
        
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)'
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'] // fallback standard
      },
      boxShadow: {
        glowGreen: 'var(--glow-green)',
        glowRed: 'var(--glow-red)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
