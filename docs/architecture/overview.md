# Vue d'ensemble de l'Architecture

## Architecture Globale

L'application suit une architecture **full-stack moderne** combinant un backend API Symfony avec un frontend TypeScript compilé via Webpack Encore.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                       │
├─────────────────────────────────────────────────────────────┤
│  HTML/CSS/JS (compilé) │  TypeScript → JavaScript           │
│  SCSS → CSS (minifié)  │  Assets optimisés                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/AJAX Requests
┌─────────────────▼───────────────────────────────────────────┐
│                    SYMFONY APPLICATION                      │
├─────────────────────────────────────────────────────────────┤
│  Controllers    │  Services     │  Security    │  Templates │
│  ├─ Web Pages   │  ├─ Business  │  ├─ Auth     │  ├─ Twig   │
│  ├─ API REST    │  ├─ Logic     │  ├─ Roles    │  ├─ Admin  │
│  └─ Admin       │  └─ Utils     │  └─ Voters   │  └─ Auth   │
├─────────────────────────────────────────────────────────────┤
│                      CUSTOM BUNDLES                         │
│  AdminBundle    │  AuthBundle   │  Fagathe\Libs              │
│  ├─ Controllers │  ├─ Controllers│  ├─ Helpers                │
│  ├─ Services    │  ├─ Services   │  ├─ Security               │
│  ├─ Templates   │  ├─ Forms      │  ├─ Logger                 │
│  └─ Forms       │  └─ Templates  │  └─ Utils                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ Doctrine ORM
┌─────────────────▼───────────────────────────────────────────┐
│                     DATABASE (MySQL)                        │
│  User Management │  Content      │  SEO         │  Tracking │
│  ├─ users        │  ├─ requests  │  ├─ seo      │  ├─ events│
│  ├─ user_meta    │  ├─ files     │  └─ seo_tags │  └─ logs  │
│  └─ user_req     │  └─ contacts  │              │           │
└─────────────────────────────────────────────────────────────┘
```

## Couches de l'Application

### 1. Couche Présentation (Frontend)

#### Technologies

- **TypeScript** : JavaScript typé pour la logique métier frontend
- **SCSS** : Préprocesseur CSS avec variables et mixins
- **Webpack Encore** : Compilation, optimisation et bundling
- **Bootstrap** : Framework CSS (via assets)

#### Organisation

```
assets/
├─ ts/           # Sources TypeScript
├─ scss/         # Sources SCSS
└─ vendor/       # Dépendances externes

public/
├─ js/           # JavaScript compilé
├─ css/          # CSS compilé et minifié
└─ assets/       # Assets statiques
```

### 2. Couche Application (Backend Symfony)

#### Architecture MVC

- **Models** : Entités Doctrine + DTOs
- **Views** : Templates Twig
- **Controllers** : Logique de routage et coordination

#### Bundles modulaires

- **App** : Bundle principal de l'application
- **AdminBundle** : Interface d'administration
- **AuthBundle** : Authentification et autorisation
- **Fagathe\Libs** : Librairies utilitaires réutilisables

### 3. Couche Métier (Services)

#### Services principaux

- **UserService** : Gestion des utilisateurs
- **AuthService** : Authentification et sécurité
- **UserRequestService** : Gestion des demandes utilisateur
- **MailerService** : Envoi d'emails
- **LoggerService** : Logging centralisé

#### Patterns utilisés

- **Dependency Injection** : Services injectés automatiquement
- **Repository Pattern** : Accès aux données centralisé
- **DTO Pattern** : Transfert de données typé
- **Trait Pattern** : Fonctionnalités réutilisables

### 4. Couche Données (Persistence)

#### ORM Doctrine

- **Entités** : Classes PHP mappées aux tables
- **Repositories** : Requêtes personnalisées
- **Migrations** : Versioning du schéma de base
- **Fixtures** : Données de test

#### Base de données MySQL

- **Tables utilisateurs** : user, user_metadata, user_request
- **Tables contenu** : request, request_contact, file
- **Tables SEO** : seo, seo_tag
- **Tables tracking** : xtracking_event, xtracking_event_log

## Flux de Données Principaux

### 1. Authentification Utilisateur

```
Browser → Auth\LoginController → AuthService → UserRepository
       ← JSON Response        ← Security    ← Database
```

### 2. Administration CRUD

```
Admin UI → Admin\UserController → Admin\UserService → UserRepository
        ← Twig Template      ← DTO/Response    ← Doctrine ORM
```

### 3. API REST

```
Frontend → App\APIController → Business Service → Repository
        ← JSON Response     ← Processed Data  ← Database
```

### 4. Compilation Assets

```
TypeScript/SCSS → Webpack Encore → public/js,css → Browser
                ↓ Scripts
            build-js.js/build-css.js
```

## Intégrations et Communications

### Frontend ↔ Backend

#### Communication AJAX

- **fetchAPI** : Wrapper personnalisé autour de fetch()
- **Error Handling** : Classe ApiError pour les erreurs HTTP
- **JSON** : Format d'échange principal
- **CSRF** : Protection automatique Symfony

#### Exemple d'intégration

```typescript
// Frontend TypeScript
const response = await fetchPOST('/admin/user', userData);
if (response.ok) {
    // Traiter la réponse
}

// Backend Controller
#[Route('/admin/user', methods: ['POST'])]
public function create(Request $request): JsonResponse {
    // Traiter la demande
    return $this->json($result);
}
```

### Bundles ↔ Application

#### AdminBundle

```php
// Configuration dans config/bundles.php
Admin\AdminBundle::class => ['all' => true],

// Services automatiquement disponibles
Admin\Service\UserService → App\Service\UserService
Admin\Controller\* → Routes /admin/*
```

#### AuthBundle

```php
// Intégration avec Symfony Security
Auth\AuthBundle::class => ['all' => true],

// Controllers d'authentification
Auth\Controller\LoginController → /auth/login
Auth\Controller\RegistrationController → /auth/registration
```

## Sécurité et Permissions

### Système de Rôles

```php
// Hiérarchie des rôles
ROLE_USER → ROLE_EDITOR → ROLE_ADMIN → ROLE_SUPER_ADMIN

// Annotations de sécurité
#[IsGranted('ROLE_ADMIN')]
#[IsGranted('admin.user.create')]
```

### Protection CSRF

```twig
{# Tokens CSRF automatiques dans les formulaires #}
{{ csrf_token('user_form') }}
```

### Validation des Données

```php
// Validation Symfony
#[Assert\NotBlank]
#[Assert\Email]
public string $email;

// Validation côté service
$violations = $this->validator->validate($data);
```

## Performance et Optimisation

### Cache

- **Symfony Cache** : Cache applicatif automatique
- **OPcache** : Cache PHP des opcodes
- **Twig Cache** : Templates compilés

### Assets

- **Minification** : CSS/JS minifiés en production
- **Concatenation** : Bundling automatique via Webpack
- **Versioning** : Cache busting automatique

### Base de Données

- **Index** : Sur les clés étrangères et champs fréquents
- **Lazy Loading** : Relations Doctrine chargées à la demande
- **Query Optimization** : Repositories avec requêtes optimisées

## Monitoring et Logs

### Logging

```php
// Logger centralisé
use Fagathe\Libs\Logger\Logger;

$this->logger->info('User action', [
    'user' => $user->getId(),
    'action' => 'login'
]);
```

### Profiling

- **Symfony Profiler** : Debug toolbar en développement
- **Monolog** : Logs structurés par niveau
- **Custom Tracking** : Système XTracking pour les analytics

## Déploiement et Environnements

### Environnements

- **dev** : Développement local avec debug
- **test** : Tests automatisés
- **prod** : Production optimisée

### Configuration

```php
// Variables d'environnement
$_ENV['APP_ENV'] // dev|test|prod
$_ENV['DATABASE_URL'] // URL de base de données
$_ENV['MAILER_DSN'] // Configuration email
```

### Build Production

```bash
# Backend
composer install --no-dev --optimize-autoloader
php bin/console cache:clear --env=prod

# Frontend
npm run build
```

## Extensibilité

### Ajout de Nouveaux Modules

1. **Créer les entités** Doctrine
2. **Générer les migrations**
3. **Créer les services** métier
4. **Développer les contrôleurs**
5. **Intégrer les templates** Twig
6. **Ajouter les assets** TypeScript/SCSS

### Patterns d'Extension

- **Events** : Système d'événements Symfony
- **Subscribers** : Écoute d'événements
- **Custom Services** : Services injectables
- **Traits** : Code réutilisable entre classes

Cette architecture modulaire permet une maintenance facile et une évolutivité optimale de l'application.
