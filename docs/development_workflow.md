# Workflow de Développement et Qualité du Code

Ce document décrit les outils et les pratiques utilisés pour maintenir la qualité du code et assurer un workflow de développement cohérent.

## Convention de nommage des branches

Le projet utilise une convention stricte pour nommer les branches :

### Format

```bash
(us|archi|fix|docs)-numero_issue-description
```

### Types de branches

- **`us-`** : User Stories / nouvelles fonctionnalités
- **`archi-`** : Modifications architecturales
- **`fix-`** : Corrections de bugs
- **`docs-`** : Documentation

### Exemples

```bash
us-123-add-user-authentication
fix-456-resolve-login-redirect
docs-789-update-api-documentation
archi-101-setup-docker-environment
```

## Workflow de commit automatisé

### Messages de commit conventionnels

Les messages de commit sont automatiquement formatés selon les [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
type(#issue): description
```

### Mapping des types

| Type de branche | Type de commit | Description               |
| --------------- | -------------- | ------------------------- |
| `us-`           | `feat`         | Nouvelles fonctionnalités |
| `fix-`          | `fix`          | Corrections de bugs       |
| `docs-`         | `docs`         | Documentation             |
| `archi-`        | `chore`        | Tâches de maintenance     |

### Exemples de commits

```bash
feat(#123): add user authentication system
fix(#456): resolve login page redirect issue
docs(#789): update API documentation
chore(#101): configure CI/CD pipeline
```

## Commandes de Build des Assets Frontend

L'application utilise des scripts personnalisés pour compiler les assets JavaScript, TypeScript et SCSS.

### Mode développement

Lance la compilation en mode watch, qui recompilera les assets à chaque modification.

```bash
# TypeScript + SCSS en mode watch
npm run dev

# TypeScript seulement
npm run dev:ts

# SCSS seulement
npm run dev:scss
```

### Build pour la production

Compile et minifie les assets pour le déploiement en production.

```bash
# Build complet optimisé
npm run build

# TypeScript seulement
npm run build:ts

# SCSS seulement
npm run build:scss
```

### Scripts personnalisés

```bash
# Utilisation directe des scripts
node ./scripts/build-css.js
node ./scripts/build-js.js
node ./scripts/watch-css.js
node ./scripts/watch-js.js
```

## Linting et Formatage du Code

Le linting et le formatage sont appliqués pour maintenir une base de code propre et cohérente.

### JavaScript/TypeScript

#### Outil et configuration

- **Outil** : [ESLint](https://eslint.org/)
- **Configuration** : Définie dans `package.json`
- **Standards** : TypeScript strict, Prettier integration

#### Commandes

```bash
# Exécuter manuellement
npm run lint

# Corriger automatiquement (si possible)
npm run lint -- --fix

# Formater avec Prettier
npm run format
```

### SCSS/CSS

#### Standards

- Préprocesseur SASS/SCSS
- Compilation via scripts personnalisés
- Minification automatique en production
- Support RTL via rtlcss

#### Compilation

```bash
# Mode développement avec watch
npm run dev:scss

# Build production minifié
npm run build:scss
```

### TypeScript

#### Configuration

- **Fichier** : `tsconfig.json`
- **Target** : ESNext
- **Module** : ESNext (modules ES natifs)
- **Strict mode** activé

#### Fonctionnalités

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "strictNullChecks": true,
    "outDir": "public/js",
    "sourceMap": false,
    "esModuleInterop": true
  }
}
```

## Hooks de Pré-commit (Husky & lint-staged)

L'application utilise [Husky](https://typicode.github.io/husky/) pour gérer les hooks Git et [lint-staged](https://github.com/okonet/lint-staged) pour exécuter des commandes sur les fichiers mis en scène.

### Pre-commit Hook

Avant chaque commit, les actions suivantes sont automatiquement exécutées :

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validation du nom de branche
node scripts/commit-helper.js validate-branch

# Affichage du statut Git
node scripts/commit-helper.js status

# Exécution du linting sur les fichiers stagés
npx lint-staged
```

### Lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{js,ts}": ["prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Commit Message Hook

Le hook `commit-msg` traite automatiquement les messages :

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Traitement du message avec l'assistant
node scripts/commit-helper.js process-message "$1"

# Validation avec commitlint
npx commitlint --edit "$1"
```

## Commitlint Configuration

### Règles de validation

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'chore']],
    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },
};
```

### Types autorisés

- `feat` : Nouvelles fonctionnalités
- `fix` : Corrections de bugs
- `docs` : Documentation
- `chore` : Tâches de maintenance

## Assistant de Commit (commit-helper.js)

Le script `commit-helper.js` automatise le workflow de commit :

### Fonctionnalités

- **Validation des branches** : Vérifie le format du nom de branche
- **Génération de messages** : Crée automatiquement les messages de commit
- **Statut Git** : Affiche un résumé formaté des modifications
- **Format conventionnel** : Assure la conformité aux standards

### Commandes disponibles

```bash
# Valider le nom de branche
npm run commit:validate

# Voir l'état Git
npm run commit:status

# Aide sur le workflow
npm run commit:help
```

## Workflow de Développement Complet

### 1. Création d'une branche

```bash
# Créer une branche selon la convention
git checkout -b us-123-add-user-dashboard

# Valider le nom de branche
npm run commit:validate
```

### 2. Développement

```bash
# Démarrer le mode watch pour les assets
npm run dev

# Faire les modifications nécessaires
# Les assets sont recompilés automatiquement
```

### 3. Commit

```bash
# Ajouter les fichiers
git add .

# Le commit déclenche automatiquement :
# - Validation du nom de branche
# - Affichage du statut
# - Linting et formatage des fichiers
# - Formatage du message de commit
git commit -m "implement user dashboard with charts"

# Résultat automatique :
# "feat(#123): implement user dashboard with charts"
```

### 4. Push et Pull Request

```bash
# Push de la branche
git push origin us-123-add-user-dashboard

# Créer une Pull Request
# Le titre sera automatiquement bien formaté
```

## Intégration Continue (Recommandations)

### Pipeline CI/CD type

```yaml
# .github/workflows/ci.yml (exemple)
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          composer install
          npm install
      - name: Run tests
        run: |
          php bin/phpunit
          npm run lint
          npm run build
```

## Bonnes Pratiques

### Commits

- **Un commit = un changement logique**
- **Messages descriptifs** en anglais
- **Squash** les commits de correction avant merge
- **Tester** avant de commiter

### Branches

- **Vie courte** : merger rapidement
- **Noms explicites** selon la convention
- **Rebase** plutôt que merge pour l'historique
- **Supprimer** après merge

### Code

- **Formater automatiquement** avec Prettier
- **Résoudre** tous les warnings ESLint
- **Tester** les nouvelles fonctionnalités
- **Documenter** les changements importants

## Dépannage

### Problèmes de hooks

```bash
# Réinstaller Husky
rm -rf .husky
npm run prepare

# Vérifier les permissions
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Problèmes de lint-staged

```bash
# Nettoyer et réinstaller
rm -rf node_modules
npm install

# Tester manuellement
npx lint-staged
```

### Bypass temporaire (urgence uniquement)

```bash
# Ignorer les hooks (à éviter)
git commit --no-verify -m "emergency fix"
```
