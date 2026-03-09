const fs = require('fs');
const path = require('path');

const files = [
    'src/app/pages/ReasoningPage.tsx',
    'src/app/pages/LandingPage.tsx',
    'src/app/components/Sidebar.tsx',
    'src/app/components/HeroSection.tsx'
];

const mappedColors = {
    // Backgrounds
    '#04101f': 'var(--background)',
    '#071628': 'var(--card)',
    '#0a1e3d': 'var(--popover)',

    // Text / Foreground
    'rgba(255,255,255,0.85)': 'var(--foreground)',
    'rgba(255,255,255,0.8)': 'var(--foreground)',
    'rgba(255,255,255,0.75)': 'var(--foreground)',
    'rgba(255,255,255,0.7)': 'var(--foreground)',
    'rgba(255,255,255,0.65)': 'var(--foreground)',
    'rgba(255,255,255,0.6)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.55)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.5)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.45)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.4)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.38)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.35)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.3)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.28)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.25)': 'var(--muted-foreground)',
    'rgba(255,255,255,0.2)': 'var(--muted-foreground)',
    // 'white' and '#fff' are too generic to replace blindly, they might break logos or borders
    // '#fff': 'var(--foreground)',
    // 'white': 'var(--foreground)',

    // Borders / Subtle Bgs
    'rgba(255,255,255,0.1)': 'var(--border)',
    'rgba(255,255,255,0.08)': 'var(--border)',
    'rgba(255,255,255,0.07)': 'var(--border)',
    'rgba(255,255,255,0.06)': 'var(--border)',
    'rgba(255,255,255,0.05)': 'var(--border)',
    'rgba(255,255,255,0.04)': 'var(--secondary)',
    'rgba(255,255,255,0.03)': 'var(--secondary)',
    'rgba(255,255,255,0.02)': 'var(--secondary)',
};

files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf-8');

    let replacements = 0;
    for (const [hex, cssVar] of Object.entries(mappedColors)) {
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapeRegExp(hex), 'g');
        const matches = content.match(regex);
        if (matches) {
            replacements += matches.length;
            content = content.replace(regex, cssVar);
        }
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}: ${replacements} replacements.`);
});
console.log('Done.');
