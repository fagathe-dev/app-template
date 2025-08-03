# Structure Backend Symfony

## Organisation des Répertoires

### Structure Racine

```
app-template/
├─ config/           # Configuration Symfony
├─ src/             # Code source principal
├─ admin/           # Bundle d'administration
├─ auth/            # Bundle d'authentification
├─ libs/            # Librairies personnalisées
├─ migrations/      # Migrations Doctrine
├─ templates/       # Templates Twig globaux
├─ tests/           # Tests unitaires et fonctionnels
├─ var/             # Fichiers de cache et logs
└─ vendor/          # Dépendances Composer
```

## Bundle Principal (src/)

### Structure du répertoire src/

```
src/
├─ Command/         # Commandes console Symfony
├─ Controller/      # Contrôleurs web et API
├─ DataFixtures/    # Fixtures pour les données de test
├─ DTO/             # Data Transfer Objects
├─ Entity/          # Entités Doctrine
├─ Form/            # Classes de formulaires Symfony
├─ Repository/      # Repositories Doctrine personnalisés
├─ Security/        # Classes de sécurité
├─ Service/         # Services métier
├─ Twig/            # Extensions Twig personnalisées
└─ Kernel.php       # Kernel Symfony
```

### Contrôleurs (src/Controller/)

```
Controller/
├─ APIController.php        # API REST générale
├─ HomeController.php       # Page d'accueil
├─ LandingController.php    # Pages de présentation
└─ Auth/                    # Contrôleurs d'authentification
   ├─ LoginController.php
   └─ RegistrationController.php
```

**Responsabilités** :

- Routage et gestion des requêtes HTTP
- Coordination entre services et vues
- Validation des entrées utilisateur
- Transformation des données pour les réponses

### Entités (src/Entity/)

#### Entités principales

```php
Entity/
├─ User.php                 # Utilisateurs du système
├─ UserMetadata.php         # Métadonnées utilisateur
├─ UserRequest.php          # Demandes utilisateur
├─ Request.php              # Demandes générales
├─ RequestContact.php       # Contacts des demandes
├─ RequestMetadata.php      # Métadonnées des demandes
├─ File.php                 # Fichiers joints
├─ Seo.php                  # Configuration SEO
├─ SeoTag.php              # Tags SEO
├─ XTrackingEvent.php      # Événements de tracking
└─ XTrackingEventLog.php   # Logs de tracking
```

#### Exemple d'entité

```php
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    // Relations
    #[ORM\OneToMany(targetEntity: UserRequest::class, mappedBy: 'user')]
    private Collection $requests;
}
```

### Services (src/Service/)

#### Services principaux

```
Service/
├─ UserService.php          # Gestion des utilisateurs
├─ AuthService.php          # Authentification
├─ UserRequestService.php   # Gestion des demandes
└─ MailerService.php        # Envoi d'emails
```

#### Exemple de service

```php
final class UserService
{
    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'service/user-service';

    public function __construct(
        private UserRepository $repository,
        private PaginatorInterface $paginator,
        private UserPasswordHasherInterface $hasher,
        private EntityManagerInterface $manager,
        private MailerService $mailer
    ) {}

    public function create(User $user): bool
    {
        $user->setPassword($this->hasher->hashPassword($user, $user->getPassword()));
        $user->setRegisteredAt($this->now());

        return $this->save($user);
    }
}
```

### Repositories (src/Repository/)

#### Structure

```
Repository/
├─ UserRepository.php
├─ UserRequestRepository.php
├─ RequestRepository.php
├─ SeoRepository.php
└─ XTrackingEventRepository.php
```

#### Fonctionnalités

- **Requêtes personnalisées** avec le QueryBuilder Doctrine
- **Méthodes de recherche** optimisées
- **Agrégations** et statistiques
- **Pagination** intégrée

### DTOs (src/DTO/)

#### Rôle des DTOs

- **Validation** des données d'entrée
- **Sérialisation** pour les API
- **Transformation** entre couches
- **Types stricts** pour le frontend

#### Exemple

```php
class ProjectDTO
{
    public function __construct(
        #[Assert\Type('int')]
        public ?int $id = null,

        #[Assert\NotBlank]
        #[Assert\Type('string')]
        public string $name,

        #[Assert\Url]
        public ?string $url = null,

        #[Assert\Type('bool')]
        public bool $published = false,
    ) {}
}
```

## Bundle d'Administration (admin/)

### Structure AdminBundle

```
admin/
├─ config/
│  └─ services.yaml         # Services du bundle
├─ src/
│  ├─ AdminBundle.php       # Classe principale du bundle
│  ├─ Controller/           # Contrôleurs admin
│  ├─ Form/                 # Formulaires d'administration
│  └─ Service/              # Services admin
└─ templates/               # Templates Twig admin
   ├─ index.html.twig
   ├─ layout.html.twig
   ├─ user/                 # Gestion utilisateurs
   ├─ emails/               # Templates emails
   └─ log/                  # Visualisation des logs
```

### Contrôleurs Admin

```
admin/src/Controller/
├─ DefaultController.php           # Dashboard principal
├─ UserController.php              # Gestion utilisateurs
├─ EmailController.php             # Templates emails
├─ LogController.php               # Visualisation logs
└─ FeatureAccessRuleController.php # Règles d'accès
```

### Services Admin

```php
final class UserService
{
    public function index(Request $request): array
    {
        $users = $this->paginator->paginate(
            $this->repository->createQueryBuilder('u'),
            $request->query->getInt('page', 1),
            10
        );

        return [
            'users' => $users,
            'breadcrumb' => $this->breadcrumb()
        ];
    }

    public function create(User $user): bool
    {
        $password = (new Token)->generate(30);
        $user->setPassword($this->hashPassword($user->setPassword($password)));

        return $this->save($user, true);
    }
}
```

## Bundle d'Authentification (auth/)

### Structure AuthBundle

```
auth/
├─ config/
│  └─ services.yaml
├─ src/
│  ├─ AuthBundle.php
│  ├─ Controller/
│  └─ Service/
└─ templates/
   ├─ index.html.twig
   ├─ layout.html.twig
   ├─ login/
   ├─ registration/
   └─ verification/
```

### Contrôleurs Auth

```
auth/src/Controller/
├─ LoginController.php              # Connexion
├─ RegistrationController.php       # Inscription
├─ UserVerificationController.php   # Vérification email
└─ UserRequestVerificationController.php # Vérification demandes
```

## Librairies Personnalisées (libs/)

### Structure Fagathe\Libs

```
libs/src/
├─ DetectDevice/        # Détection d'appareils
├─ File/               # Gestion de fichiers
├─ Front/              # Helpers frontend
├─ Helpers/            # Utilitaires généraux
├─ JSON/               # Sérialisation JSON
├─ Logger/             # Système de logs
├─ Security/           # Sécurité et rôles
├─ SEO/                # Optimisation SEO
├─ Twig/               # Extensions Twig
└─ Utils/              # Utilitaires divers
```

### Helpers Principaux

```php
// DateTimeTrait - Gestion des dates
trait DateTimeTrait
{
    protected function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable();
    }
}

// ResponseTrait - Réponses standardisées
trait ResponseTrait
{
    protected function sendJson(array $data, int $status = 200): object
    {
        return (object) [
            'data' => $data,
            'status' => $status,
            'headers' => []
        ];
    }
}
```

## Configuration (config/)

### Structure de Configuration

```
config/
├─ bundles.php          # Déclaration des bundles
├─ services.yaml        # Services globaux
├─ routes.yaml          # Routes principales
├─ packages/            # Configuration des packages
│  ├─ doctrine.yaml
│  ├─ security.yaml
│  ├─ twig.yaml
│  └─ framework.yaml
└─ routes/              # Routes spécialisées
   ├─ framework.yaml
   └─ security.yaml
```

### Bundles Enregistrés

```php
// config/bundles.php
return [
    Symfony\Bundle\FrameworkBundle\FrameworkBundle::class => ['all' => true],
    Doctrine\Bundle\DoctrineBundle\DoctrineBundle::class => ['all' => true],
    Symfony\Bundle\SecurityBundle\SecurityBundle::class => ['all' => true],
    Symfony\Bundle\TwigBundle\TwigBundle::class => ['all' => true],
    Admin\AdminBundle::class => ['all' => true],
    Auth\AuthBundle::class => ['all' => true],
    // ...
];
```

## Templates Twig (templates/)

### Organisation

```
templates/
├─ base.html.twig       # Template de base
├─ api/                 # Templates API
├─ components/          # Composants réutilisables
├─ emails/              # Templates emails
├─ landing/             # Pages de présentation
└─ partials/            # Fragments partagés
```

## Migrations (migrations/)

### Gestion du Schéma

```php
final class Version20250606161243 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE user (...)');
        $this->addSql('CREATE TABLE user_request (...)');
        // ...
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE user');
        // ...
    }
}
```

## Avantages de cette Structure

### Modularité

- **Bundles séparés** pour des domaines fonctionnels distincts
- **Services spécialisés** avec responsabilités claires
- **Librairies réutilisables** entre projets

### Maintenabilité

- **Séparation des préoccupations** claire
- **Tests isolés** par module
- **Configuration centralisée**

### Évolutivité

- **Ajout facile** de nouveaux bundles
- **Extension** des services existants
- **Réutilisation** des composants

Cette structure backend Symfony offre une base solide pour le développement et la maintenance d'applications web complexes.
