# Configuration Husky pour les Git Hooks

## Contexte

En tant que lead développeur, nous voulons mettre en place des git hooks pour assurer la qualité du code avant chaque commit en utilisant Husky.

## Objectifs

- Configurer Husky pour exécuter des tâches de validation avant les commits
- Assurer la qualité du code avec Prettier et ESLint
- Empêcher les commits si les standards de code ne sont pas respectés

## Installation et Configuration

### 1. Installation des Dépendances

```bash
npm install --save-dev husky lint-staged prettier
```

### 2. Configuration de Husky

Initialiser Husky :

```bash
npx husky install
```

Ajouter le script d'installation de Husky dans package.json :

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### 3. Configuration du Pre-commit Hook

Créer le fichier `.husky/pre-commit` :

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint-staged
```

### 4. Configuration de lint-staged

Ajouter la configuration lint-staged dans package.json :

```json
{
  "lint-staged": {
    "*.{js,ts}": ["prettier --write", "eslint --fix"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 5. Scripts npm à Ajouter

Ajouter dans package.json :

```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.ts",
    "format": "prettier --write .",
    "lint-staged": "lint-staged"
  }
}
```

## Fonctionnalités

1. **Pre-commit Hook**
   - Vérifie le formatage avec Prettier
   - Vérifie la qualité du code avec ESLint
   - Applique les corrections automatiques si possible

2. **Configuration Prettier**
   - Utilise le fichier `.prettierrc` existant
   - Applique le formatage sur les fichiers modifiés

3. **Validation ESLint**
   - Vérifie les erreurs et warnings
   - Bloque le commit si des erreurs sont détectées

## Notes Importantes

- Les hooks sont automatiquement installés lors d'un `npm install` grâce au script `prepare`
- Les règles de formatage sont définies dans `.prettierrc`
- Les règles ESLint sont définies dans `.eslintrc`
- Seuls les fichiers modifiés sont vérifiés pour optimiser les performances
