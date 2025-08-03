# Installation et Configuration

## Prérequis système

### Environnement de développement

- **PHP** : 8.2 ou supérieur
- **Node.js** : 18.x ou supérieur
- **NPM** : 9.x ou supérieur
- **MySQL/MariaDB** : 8.0+ / 10.6+
- **Composer** : 2.x
- **Git** : pour la gestion des versions

### Extensions PHP requises

```bash
# Extensions obligatoires
php -m | grep -E "(ctype|iconv|intl|pdo_mysql|mbstring|json|tokenizer)"

# Vérifier la version PHP
php -v
```

## Installation initiale

### 1. Clonage du projet

```bash
git clone <repository-url> app-template
cd app-template
```

### 2. Installation des dépendances

#### Dépendances PHP (Symfony)

```bash
# Installation des packages Composer
composer install

# En production, utiliser :
composer install --no-dev --optimize-autoloader
```

#### Dépendances JavaScript/TypeScript

```bash
# Installation des packages NPM
npm install

# Installation de Husky (hooks Git)
npm run prepare
```

### 3. Configuration de l'environnement

#### Fichier d'environnement

```bash
# Copier le fichier d'exemple
cp .env.template .env

# Éditer les variables d'environnement
nano .env
```

#### Variables d'environnement principales

```bash
# Base de données
DATABASE_URL="mysql://user:password@127.0.0.1:3306/app_db"

# Environnement
APP_ENV=dev
APP_SECRET=your-secret-key

# Mailer (optionnel)
MAILER_DSN=smtp://localhost:1025

# Logs
LOG_LEVEL=debug
```

### 4. Configuration de la base de données

#### Création de la base de données

```bash
# Créer la base de données
php bin/console doctrine:database:create

# Exécuter les migrations
php bin/console doctrine:migrations:migrate

# Charger les données de test (optionnel)
php bin/console doctrine:fixtures:load
```

#### Vérification du schéma

```bash
# Vérifier l'état du schéma
php bin/console doctrine:schema:validate

# Voir les migrations en attente
php bin/console doctrine:migrations:status
```

### 5. Compilation des assets

#### Mode développement

```bash
# Compilation unique
npm run build

# Mode watch (recompilation automatique)
npm run dev
```

#### Mode production

```bash
# Build optimisé pour la production
npm run build
```

## Configuration du serveur de développement

### Avec Symfony CLI (recommandé)

```bash
# Installation de Symfony CLI
curl -sS https://get.symfony.com/cli/installer | bash

# Démarrage du serveur
symfony serve

# Serveur avec HTTPS
symfony serve --port=8000 --allow-http
```

### Avec le serveur intégré PHP

```bash
# Serveur basique
php -S localhost:8000 -t public/

# Avec variables d'environnement
APP_ENV=dev php -S localhost:8000 -t public/
```

## Configuration de l'environnement de développement

### Git Hooks (Husky)

Les hooks Git sont automatiquement configurés après `npm install` :

```bash
# Vérifier l'installation des hooks
ls -la .husky/
# Devrait afficher : commit-msg, pre-commit, prepare-commit-msg
```

### Validation des commits

Le projet utilise **commitlint** avec un format spécifique :

```bash
# Format attendu : type(#issue): description
# Exemples :
feat(#123): add user authentication
fix(#456): resolve login redirect issue
```

### Linting et formatage

```bash
# Vérifier le formatage
npm run lint

# Corriger automatiquement
npm run format

# Lint-staged s'exécute automatiquement au commit
```

## Commandes de vérification

### Vérification de l'installation PHP

```bash
# Vérifier les extensions
php bin/console debug:config

# Cache et permissions
php bin/console cache:clear
chmod -R 755 var/
```

### Vérification de l'installation JavaScript

```bash
# Vérifier les dépendances
npm list --depth=0

# Tests de compilation
npm run build
```

### Vérification de la base de données

```bash
# Test de connexion
php bin/console dbal:run-sql "SELECT 1"

# Lister les entités
php bin/console doctrine:mapping:info
```

## Configuration des outils de développement

### IDE/Éditeur

Pour **VS Code**, extensions recommandées :

- PHP Intelephense
- Symfony for VSCode
- TypeScript Importer
- SCSS Intellisense
- Prettier - Code formatter
- ESLint

### Xdebug (optionnel)

```bash
# Installation Xdebug
pecl install xdebug

# Configuration dans php.ini
zend_extension=xdebug
xdebug.mode=debug
xdebug.start_with_request=yes
```

## Dépannage courant

### Problèmes de permissions

```bash
# Réparer les permissions Symfony
chmod -R 755 var/ public/
chown -R www-data:www-data var/ public/
```

### Problèmes de cache

```bash
# Vider tous les caches
php bin/console cache:clear
npm run build
```

### Problèmes de base de données

```bash
# Recréer la base
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### Problèmes de compilation assets

```bash
# Nettoyer et recompiler
rm -rf node_modules/
rm -rf public/assets/
npm install
npm run build
```

## Création du premier utilisateur admin

```bash
# Utiliser la commande dédiée
php bin/console app:create-admin-user

# Ou interactivement
php bin/console app:create-admin-user admin admin@example.com password123
```

## Variables d'environnement complètes

### Fichier .env.local type

```bash
# Application
APP_ENV=dev
APP_SECRET=your-32-character-secret-key

# Base de données
DATABASE_URL="mysql://username:password@127.0.0.1:3306/app_template_dev"

# Mailer
MAILER_DSN=smtp://localhost:1025

# Logs
LOG_LEVEL=debug
MONOLOG_LOGGING_PATH=var/log/

# Features flags
FEATURE_REGISTRATION_ENABLED=true
FEATURE_EMAIL_VERIFICATION=true
```

## Prochaines étapes

Après l'installation réussie :

1. Consulter la [documentation de l'architecture](architecture/overview.md)
2. Lire le [workflow de développement](development_workflow.md)
3. Explorer les [commandes disponibles](commands.md)
4. Comprendre les [modules de l'application](modules/)
