# Technologies Utilisées

## Vue d'ensemble

L'application intègre un stack technologique moderne et robuste, combinant des technologies éprouvées avec des outils innovants pour assurer performance, maintenabilité et évolutivité.

## Backend - Framework et Librairies PHP

### Symfony 7.2

**Rôle** : Framework PHP principal pour l'architecture MVC et l'API REST

**Fonctionnalités utilisées** :

- **Kernel MicroKernelTrait** : Bootstrap simplifié de l'application
- **Dependency Injection** : Container de services automatique
- **Routing** : Système de routes avec annotations/attributs
- **Events** : System d'événements pour la modularité
- **Console** : Commandes CLI personnalisées

**Configuration** :

```php
// Kernel simplifié
class Kernel extends BaseKernel
{
    use MicroKernelTrait;
}

// Services auto-configurés
#[AsService]
class UserService
{
    public function __construct(
        private UserRepository $repository,
        private EntityManagerInterface $manager
    ) {}
}
```

### Doctrine ORM 3.5

**Rôle** : Mapping objet-relationnel et gestion de base de données

**Composants utilisés** :

- **Doctrine ORM** : Mapping entités ↔ tables
- **Doctrine DBAL** : Abstraction base de données
- **Doctrine Migrations** : Versioning du schéma
- **Doctrine Fixtures** : Données de test

**Fonctionnalités** :

```php
// Entité avec mapping avancé
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface
{
    #[ORM\OneToMany(targetEntity: UserRequest::class, mappedBy: 'user', cascade: ['persist', 'remove'])]
    private Collection $requests;
}

// Repository avec requêtes personnalisées
class UserRepository extends ServiceEntityRepository
{
    public function search(string $query): array
    {
        $connection = $this->getEntityManager()->getConnection();
        $stmt = $connection->prepare("CALL search_user(:query)");
        return $stmt->executeQuery()->fetchAllAssociative();
    }
}
```

### Twig 3.x

**Rôle** : Moteur de templates pour le rendu HTML

**Utilisation** :

- **Templates modulaires** : Base + héritages
- **Extensions personnalisées** : Fonctions métier
- **Sécurité** : Échappement automatique
- **Performance** : Compilation et cache

**Exemple** :

```twig
{# templates/base.html.twig #}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}App{% endblock %}</title>
    {{ encore_entry_link_tags('app') }}
</head>
<body>
    {% block body %}{% endblock %}
    {{ encore_entry_script_tags('app') }}
</body>
</html>
```

### Symfony Security

**Rôle** : Authentification, autorisation et sécurité

**Composants** :

- **UserInterface** : Interface utilisateur standard
- **PasswordHasher** : Hachage sécurisé des mots de passe
- **Voters** : Logique d'autorisation personnalisée
- **Firewall** : Protection des routes

```php
// Configuration sécurité
#[IsGranted('ROLE_ADMIN')]
#[Route('/admin/user', name: 'admin_user_')]
class UserController extends AbstractController
{
    #[IsGranted('admin.user.create')]
    public function create(): Response {}
}

// Hierarchie des rôles
ROLE_USER → ROLE_EDITOR → ROLE_ADMIN → ROLE_SUPER_ADMIN
```

### Monolog

**Rôle** : Système de logging centralisé et structuré

**Configuration** :

```yaml
# config/packages/monolog.yaml
monolog:
  channels: ['app', 'security', 'admin', 'service']
  handlers:
    main:
      type: rotating_file
      path: '%kernel.logs_dir%/%kernel.environment%.log'
      level: debug
```

**Utilisation** :

```php
use Fagathe\Libs\Logger\Logger;

$this->logger->info('User action', [
    'user' => $user->getId(),
    'action' => 'login',
    'ip' => $request->getClientIp()
]);
```

## Frontend - Technologies Web Modernes

### TypeScript 5.8

**Rôle** : JavaScript typé pour le développement frontend robuste

**Configuration** :

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Fonctionnalités utilisées** :

- **Types stricts** : Validation à la compilation
- **Modules ES** : Import/export natifs
- **Classes et interfaces** : POO moderne
- **Async/await** : Programmation asynchrone
- **Generics** : Types réutilisables

**Exemple** :

```typescript
interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

class ApiClient {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(url);
    return {
      ok: response.ok,
      status: response.status,
      data: await response.json(),
    };
  }
}
```

### SCSS/Sass

**Rôle** : Préprocesseur CSS avec fonctionnalités avancées

**Fonctionnalités** :

- **Variables** : Couleurs et dimensions réutilisables
- **Mixins** : Styles réutilisables
- **Nesting** : Hiérarchie naturelle
- **Partials** : Modularité des fichiers
- **Functions** : Logic CSS avancée

```scss
// Variables globales
$primary-color: #007bff;
$border-radius: 0.25rem;

// Mixin responsive
@mixin responsive($breakpoint) {
  @media (min-width: $breakpoint) {
    @content;
  }
}

// Utilisation
.button {
  background-color: $primary-color;
  border-radius: $border-radius;

  @include responsive(768px) {
    font-size: 1.2rem;
  }
}
```

## Compilation et Build

### esbuild

**Rôle** : Compilation ultra-rapide du TypeScript

**Avantages** :

- **Performance** : ~100x plus rapide que Webpack
- **Simplicité** : Configuration minimale
- **ESM natif** : Modules ES standards
- **Tree shaking** : Élimination du code mort

```javascript
// scripts/build-js.js
const esbuild = require('esbuild');

const buildOptions = {
  entryPoints: getAllTsFiles('public/ts'),
  outdir: 'public/js-mini',
  bundle: false,
  format: 'esm',
  target: 'es2020',
  minify: true,
};

esbuild.build(buildOptions);
```

### Sass (Dart Sass)

**Rôle** : Compilation SCSS vers CSS optimisé

```javascript
// scripts/build-css.js
const sass = require('sass');

function compileSass(inputFile, outputFile) {
  const result = sass.compile(inputFile, {
    style: 'compressed',
    sourceMap: false,
  });

  fs.writeFileSync(outputFile, result.css);
}
```

### RTLcss

**Rôle** : Génération automatique de CSS RTL (Right-to-Left)

**Support multilingue** :

```javascript
// Configuration RTL
new RtlCssPlugin({
  filename: 'css/[name]-rtl.min.css',
});
```

## Qualité du Code et Tooling

### Husky

**Rôle** : Gestion des hooks Git pour la qualité du code

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

node scripts/commit-helper.js validate-branch
npx lint-staged
```

### lint-staged

**Rôle** : Linting automatique des fichiers modifiés

```json
{
  "lint-staged": {
    "*.{js,ts}": ["prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Commitlint

**Rôle** : Validation des messages de commit selon les conventions

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'chore']],
  },
};
```

### ESLint + Prettier

**Rôle** : Linting et formatage automatique du JavaScript/TypeScript

**Configuration** :

```json
{
  "extends": ["@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

## Base de Données

### MySQL 8.0+

**Rôle** : Base de données relationnelle principale

**Fonctionnalités utilisées** :

- **JSON columns** : Stockage de données flexibles
- **Foreign keys** : Intégrité référentielle
- **Indexes** : Performance des requêtes
- **Stored procedures** : Logique côté base

```sql
-- Table avec colonnes JSON
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(180) NOT NULL,
    roles JSON NOT NULL,
    metadata JSON DEFAULT NULL
);

-- Procédure stockée
DELIMITER $$
CREATE PROCEDURE search_user(IN query VARCHAR(255))
BEGIN
    SELECT * FROM user
    WHERE email LIKE CONCAT('%', query, '%')
    OR username LIKE CONCAT('%', query, '%');
END$$
DELIMITER ;
```

## Librairies et Utilitaires

### Fagathe\Libs (Librairies Custom)

**Rôle** : Collection d'utilitaires réutilisables

**Modules** :

```
libs/src/
├─ Helpers/         # Traits utilitaires (DateTime, Response)
├─ Logger/          # Système de logs centralisé
├─ Security/        # Enums et helpers sécurité
├─ Utils/           # Services utilitaires (Mailer, etc.)
├─ JSON/            # Sérialisation JSON avancée
└─ Twig/            # Extensions Twig personnalisées
```

### Faker

**Rôle** : Génération de données de test réalistes

```php
// DataFixtures
class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');

        for ($i = 0; $i < 50; $i++) {
            $user = new User();
            $user->setEmail($faker->email())
                 ->setFirstname($faker->firstName)
                 ->setLastname($faker->lastName);

            $manager->persist($user);
        }
    }
}
```

### KnpPaginatorBundle

**Rôle** : Pagination automatique des listes

```php
public function index(Request $request): Response
{
    $query = $this->repository->createQueryBuilder('u');

    $users = $this->paginator->paginate(
        $query,
        $request->query->getInt('page', 1),
        10
    );

    return $this->render('users/index.html.twig', [
        'users' => $users
    ]);
}
```

## Tests et Qualité

### PHPUnit 9.6

**Rôle** : Framework de tests unitaires et fonctionnels

```php
class UserServiceTest extends KernelTestCase
{
    public function testUserCreation(): void
    {
        $userService = self::getContainer()->get(UserService::class);

        $user = new User();
        $user->setEmail('test@example.com');

        $result = $userService->create($user);

        $this->assertTrue($result);
        $this->assertNotNull($user->getId());
    }
}
```

### Symfony Test Client

**Rôle** : Tests d'intégration des contrôleurs

```php
class AdminControllerTest extends WebTestCase
{
    public function testAdminAccess(): void
    {
        $client = static::createClient();
        $client->request('GET', '/admin/');

        $this->assertResponseStatusCodeSame(302); // Redirect to login
    }
}
```

## Déploiement et Production

### Composer

**Rôle** : Gestionnaire de dépendances PHP

```bash
# Production
composer install --no-dev --optimize-autoloader

# Optimisation
composer dump-autoload --optimize --classmap-authoritative
```

### npm/Node.js

**Rôle** : Gestionnaire de dépendances JavaScript et scripts de build

```json
{
  "scripts": {
    "build": "concurrently \"npm run build:*\"",
    "build:ts": "node ./scripts/build-js.js",
    "build:scss": "node ./scripts/build-css.js",
    "dev": "concurrently \"npm run dev:*\""
  }
}
```

## Monitoring et Performance

### Symfony Profiler

**Rôle** : Profilage et debug en développement

**Métriques surveillées** :

- Temps d'exécution
- Requêtes SQL
- Utilisation mémoire
- Events dispatched

### Custom Analytics (XTracking)

**Rôle** : Analytics personnalisés pour l'usage de l'application

```php
class XTrackingEvent
{
    #[ORM\Column(length: 120)]
    private ?string $name = null;

    #[ORM\Column(type: Types::JSON)]
    private ?array $devices = null;

    #[ORM\OneToMany(targetEntity: XTrackingEventLog::class, mappedBy: 'event')]
    private Collection $logs;
}
```

Cette stack technologique moderne assure une base solide, performante et maintenable pour l'évolution continue de l'application.
