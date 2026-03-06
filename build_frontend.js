const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

const sourceDir = __dirname;
const destDir = path.join(__dirname, 'dist');

// Define directories/files to ignore from copying into the dist folder
const ignoreList = [
    'node_modules',
    '.git',
    'src-tauri',
    'dist',
    '.gemini',
    '.idea',
    'tmp',
    'build_frontend.js',
    'package-lock.json',
    'package.json',
    'skand-browser-master',
    'electron-bkp',
    'images',
    'target',
    'build',
    'vs_BuildTools.exe'
];

function minifyHTML(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
}

function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\n/g, ' ') // Collapse newlines
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .replace(/\s*([{}:;,>~+])\s*/g, '$1') // Remove spaces around operators
        .trim();
}

async function copyAndMinify(src, dest) {
    if (!fs.existsSync(src)) return;

    const stats = fs.statSync(src);
    const basename = path.basename(src);

    if (ignoreList.includes(basename) || basename.endsWith('.zip') || basename.endsWith('.exe') || basename.endsWith('.bak') || basename.endsWith('.csv')) {
        return; // Ignore these directories and files
    }

    if (stats.isDirectory()) {
        fs.ensureDirSync(dest);
        const items = fs.readdirSync(src);
        for (const item of items) {
            await copyAndMinify(path.join(src, item), path.join(dest, item));
        }
    } else {
        // Minify .js files unless they are already minified (.min.js)
        if (src.endsWith('.js') && !src.endsWith('.min.js')) {
            const code = fs.readFileSync(src, 'utf8');
            try {
                const result = await minify(code);
                if (result.code) {
                    fs.outputFileSync(dest, result.code);
                } else {
                    fs.copySync(src, dest);
                }
            } catch (err) {
                console.warn(`JS Minification failed for ${src}, copying as is. Error:`, err.message);
                fs.copySync(src, dest);
            }
        } else if (src.endsWith('.html')) {
            const code = fs.readFileSync(src, 'utf8');
            try {
                const minifiedHTML = minifyHTML(code);
                fs.outputFileSync(dest, minifiedHTML);
            } catch (err) {
                console.warn(`HTML Minification failed for ${src}, copying as is. Error:`, err.message);
                fs.copySync(src, dest);
            }
        } else if (src.endsWith('.css') && !src.endsWith('.min.css')) {
            const code = fs.readFileSync(src, 'utf8');
            try {
                const minifiedCSS = minifyCSS(code);
                fs.outputFileSync(dest, minifiedCSS);
            } catch (err) {
                console.warn(`CSS Minification failed for ${src}, copying as is. Error:`, err.message);
                fs.copySync(src, dest);
            }
        } else {
            // Copy all other files directly (images, fonts, pre-minified files, etc)
            fs.copySync(src, dest);
        }
    }
}

async function run() {
    console.log('Cleaning dist directory...');
    fs.emptyDirSync(destDir);

    console.log('Copying and minifying files to dist/...');
    await copyAndMinify(sourceDir, destDir);

    console.log('Frontend build complete.');
}

run().catch(console.error);
