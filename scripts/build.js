const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const inputDir = 'public/ts';
const outputDir = 'public/js-mini';

// Fonction récursive pour récupérer tous les fichiers .ts
function getAllTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getAllTsFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      return [fullPath];
    }
    return [];
  });
}

const entryFiles = getAllTsFiles(inputDir);

// Crée une build pour chaque fichier
Promise.all(
  entryFiles.map((entry) => {
    const relativePath = path.relative(inputDir, entry);
    const outputPath = path.join(outputDir, relativePath.replace(/\.ts$/, '.js'));

    return esbuild.build({
      entryPoints: [entry],
      bundle: true,
      outfile: outputPath,
      sourcemap: false,
      minify: false,
      target: ['es2020'],
      platform: 'browser',
      // --- C'est la modification clé ! ---
      format: 'esm', // Produit des modules ES
      // ------------------------------------
      logLevel: 'info',
      treeShaking: false, // 👈 garde tout le code
    });
  })
).catch(() => process.exit(1));
