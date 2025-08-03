# Application Web - Vue d'ensemble générale

## Description

Cette application web est construite avec **Symfony 7.2** pour le backend et utilise **TypeScript, SCSS/CSS** pour le frontend. Elle intègre **Webpack Encore** pour la compilation des assets et met en place un système complet de gestion de la qualité du code avec **Husky**, **lint-staged**, et **commitlint**.

## Architecture globale

L'application suit une architecture modulaire organisée autour de :

- **Backend Symfony** : API REST, gestion des utilisateurs, authentification, administration
- **Frontend TypeScript/SCSS** : Interface utilisateur interactive avec compilation via Webpack Encore
- **Bundles personnalisés** : `AdminBundle` et `AuthBundle` pour la modularité
- **Librairies internes** : Collection d'utilitaires réutilisables dans le namespace `Fagathe\Libs`

## Fonctionnalités principales

### Gestion des utilisateurs

- Système d'authentification et d'autorisation complet
- Gestion des rôles (USER, EDITOR, ADMIN, SUPER_ADMIN)
- Profils utilisateurs avec métadonnées personnalisables
- Système de vérification par email

### Interface d'administration

- Panel d'administration sécurisé
- Gestion des utilisateurs (CRUD complet)
- Gestion des règles d'accès aux fonctionnalités
- Système de logs intégré
- Templates email configurables

### Système de demandes (Requests)

- Gestion de demandes avec fichiers joints
- Métadonnées personnalisables
- Contacts associés (utilisateurs ou invités)
- Suivi des états et historique

### SEO et métadonnées

- Gestion centralisée des métadonnées SEO
- Tags personnalisables (Open Graph, etc.)
- Configuration par page/section

### Tracking et analytics

- Système de tracking des événements personnalisé
- Logs détaillés avec catégorisation
- Détection des appareils

## Technologies utilisées

### Backend

- **Symfony 7.2** - Framework PHP
- **Doctrine ORM** - Mapping objet-relationnel
- **Twig** - Moteur de templates
- **Symfony Security** - Authentification et autorisation
- **Monolog** - Logging
- **PHPUnit** - Tests unitaires

### Frontend

- **TypeScript** - JavaScript typé
- **SCSS/CSS** - Styles avec préprocesseur
- **Webpack Encore** - Compilation et optimisation des assets
- **Bootstrap** (via les assets) - Framework CSS

### Qualité du code

- **Husky** - Git hooks
- **lint-staged** - Linting des fichiers stagés
- **commitlint** - Validation des messages de commit
- **Prettier** - Formatage du code
- **ESLint** - Analyse statique JavaScript/TypeScript

### Base de données

- **MySQL/MariaDB** - Base de données relationnelle
- **Doctrine Migrations** - Gestion des schémas

## Structure des modules

### Module Utilisateur

- Entités : `User`, `UserMetadata`, `UserRequest`
- Services : `UserService`, `AuthService`, `UserRequestService`
- Contrôleurs : Authentification, profils, administration

### Module Administration

- Bundle dédié `AdminBundle`
- Interface complète de gestion
- Permissions granulaires

### Module Requests

- Entités : `Request`, `RequestContact`, `RequestMetadata`, `File`
- Gestion des demandes avec workflow

### Module SEO

- Entités : `Seo`, `SeoTag`
- Gestion centralisée des métadonnées

### Module Tracking

- Entités : `XTrackingEvent`, `XTrackingEventLog`
- Analytics personnalisés

## Environnement de développement

### Prérequis

- PHP 8.2+
- Node.js 18+
- MySQL/MariaDB
- Composer

### Installation rapide

```bash
# Dépendances PHP
composer install

# Dépendances JavaScript
npm install

# Base de données
php bin/console doctrine:migrations:migrate

# Assets
npm run build

# Démarrage
symfony serve
```

### Workflow de développement

- Branches nommées selon le pattern : `(us|archi|fix|docs)-numero_issue-description`
- Commits automatiquement formatés selon les conventions
- Pre-commit hooks pour la qualité du code
- Tests automatisés avec PHPUnit

## Points d'entrée principaux

- **Application publique** : `/` (landing page)
- **Authentification** : `/auth/login`, `/auth/registration`
- **Administration** : `/admin/` (accès restreint)
- **API** : `/api/` (endpoints REST)

## Documentation détaillée

Pour plus d'informations, consultez :

- [Installation et configuration](installation_and_setup.md)
- [Architecture technique](architecture/overview.md)
- [Workflow de développement](development_workflow.md)
- [Commandes disponibles](commands.md)
- [Modules fonctionnels](modules/)
- [API et intégrations](api/)
- [Sécurité](security/)
- [Tests](testing/)
