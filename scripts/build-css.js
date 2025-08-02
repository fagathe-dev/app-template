const sass = require('sass');
const fs = require('fs');
const path = require('path');

const inputDir = 'public/scss';
const outputDir = 'public/css-mini';

// Fonction récursive pour récupérer tous les fichiers .scss qui ne commencent pas par _
function getAllScssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getAllScssFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.scss') && !entry.name.startsWith('_')) {
      const relativePath = path.relative(inputDir, fullPath);
      const outputPath = path.join(outputDir, relativePath.replace(/\.scss$/, '.min.css'));
      return [{ input: fullPath, output: outputPath }];
    }
    return [];
  });
}

const scssFiles = getAllScssFiles(inputDir);

// Fonction pour compiler un fichier SCSS en mode production
function compileSass(inputFile, outputFile) {
  try {
    const result = sass.compile(inputFile, {
      style: 'compressed',
      sourceMap: false,
    });

    // S'assurer que le répertoire de sortie existe
    const outputPath = path.dirname(outputFile);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    fs.writeFileSync(outputFile, result.css);
    console.log(`✅ Built ${inputFile} → ${outputFile}`);
  } catch (err) {
    console.error(`❌ Error building ${inputFile}:`, err.message);
    process.exit(1);
  }
}

// Compilation de tous les fichiers
console.log('🎨 Building SCSS files...');

Promise.all(
  scssFiles.map(({ input, output }) => {
    return new Promise((resolve, reject) => {
      try {
        compileSass(input, output);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  })
)
  .then(() => {
    console.log('✨ All SCSS files built successfully!');
  })
  .catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
