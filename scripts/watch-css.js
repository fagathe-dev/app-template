const sass = require('sass');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const inputDir = 'public/scss';
const outputDir = 'public/css';

// Fonction récursive pour récupérer tous les fichiers .scss qui ne commencent pas par _
function getAllScssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getAllScssFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.scss') && !entry.name.startsWith('_')) {
      const relativePath = path.relative(inputDir, fullPath);
      const outputPath = path.join(outputDir, relativePath.replace(/\.scss$/, '.css'));
      return [{ input: fullPath, output: outputPath }];
    }
    return [];
  });
}

// Fonction pour récupérer dynamiquement les fichiers SCSS
function getScssFiles() {
  return getAllScssFiles(inputDir);
}

// Fonction pour compiler un fichier SCSS
function compileSass(inputFile, outputFile) {
  try {
    const result = sass.compile(inputFile, {
      style: 'expanded',
      sourceMap: false,
    });

    // S'assurer que le répertoire de sortie existe
    const outputPath = path.dirname(outputFile);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    fs.writeFileSync(outputFile, result.css);
    console.log(`✅ Compiled ${inputFile} → ${outputFile}`);
  } catch (err) {
    console.error(`❌ Error compiling ${inputFile}:`, err.message);
  }
}

// Compilation initiale
console.log('🎨 Starting SCSS watch mode...');
let scssFiles = getScssFiles();
scssFiles.forEach(({ input, output }) => {
  compileSass(input, output);
});

// Surveiller les changements dans tous les fichiers SCSS
const watcher = chokidar.watch('public/scss/**/*.scss', {
  ignored: /node_modules/,
  persistent: true,
});

watcher.on('change', (filePath) => {
  console.log(`📝 File changed: ${filePath}`);

  // Recharger la liste des fichiers au cas où de nouveaux fichiers auraient été ajoutés
  scssFiles = getScssFiles();

  // Recompiler tous les fichiers principaux quand un fichier change
  scssFiles.forEach(({ input, output }) => {
    compileSass(input, output);
  });
});

watcher.on('add', (filePath) => {
  // Quand un nouveau fichier SCSS est ajouté
  if (path.basename(filePath).endsWith('.scss') && !path.basename(filePath).startsWith('_')) {
    console.log(`➕ New SCSS file detected: ${filePath}`);
    scssFiles = getScssFiles();

    // Compiler le nouveau fichier
    const relativePath = path.relative(inputDir, filePath);
    const outputPath = path.join(outputDir, relativePath.replace(/\.scss$/, '.css'));
    compileSass(filePath, outputPath);
  }
});

watcher.on('ready', () => {
  console.log('👀 Watching for SCSS file changes...');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping SCSS watcher...');
  watcher.close();
  process.exit(0);
});
