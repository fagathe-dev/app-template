# Module de Gestion des Utilisateurs

## Vue d'ensemble

Le module de gestion des utilisateurs constitue le cœur de l'authentification et de l'autorisation de l'application. Il gère l'ensemble du cycle de vie des utilisateurs, de l'inscription à la suppression, en passant par la vérification des comptes et la gestion des permissions.

## Rôle et Responsabilités

### Fonctionnalités principales

- **Authentification** : Connexion/déconnexion sécurisée
- **Autorisation** : Gestion des rôles et permissions
- **Gestion des profils** : CRUD complet des utilisateurs
- **Vérification** : Validation des comptes par email
- **Métadonnées** : Données personnalisables par utilisateur
- **Sécurité** : Hachage des mots de passe, protection CSRF

## Entités et Modèles Doctrine

### Entité User

```php
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[UniqueEntity(fields: ['email'], message: 'Cette adresse email est déjà utilisée !')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    #[Assert\NotBlank(message: 'L\'email est requis.')]
    #[Assert\Email(message: 'L\'email "{{ value }}" n\'est pas valide.')]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $firstname = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $lastname = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 3, max: 100)]
    private ?string $username = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $registered_at = null;

    #[ORM\Column]
    private ?bool $active = null;

    // Relations
    #[ORM\OneToMany(targetEntity: UserRequest::class, mappedBy: 'user')]
    private Collection $requests;

    #[ORM\OneToMany(targetEntity: UserMetadata::class, mappedBy: 'user')]
    private Collection $metadatas;
}
```

### Entité UserMetadata

```php
#[ORM\Entity(repositoryClass: UserMetadataRepository::class)]
class UserMetadata
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'metadatas')]
    private ?User $user = null;

    #[ORM\Column(length: 50)]
    private ?string $md_key = null;

    #[ORM\Column(length: 255)]
    private ?string $md_value = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;
}
```

### Entité UserRequest

```php
#[ORM\Entity(repositoryClass: UserRequestRepository::class)]
class UserRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 300)]
    private ?string $token = null;

    #[ORM\ManyToOne(inversedBy: 'requests')]
    private ?User $user = null;

    #[ORM\Column(length: 40)]
    private ?string $type = null; // ACCOUNT_ACTIVATION_REQUEST, PASSWORD_RESET, etc.

    #[ORM\Column(length: 300, nullable: true)]
    private ?string $content = null;

    #[ORM\Column(nullable: true)]
    private ?bool $is_open = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $expired_at = null;
}
```

## Services Principaux

### UserService (App\Service\UserService)

Service principal de gestion des utilisateurs dans l'application.

```php
final class UserService
{
    use ResponseTrait, DateTimeTrait;

    private const LOG_FILE = 'service/user-service';

    public function __construct(
        private UserRepository $repository,
        private PaginatorInterface $paginator,
        private UserPasswordHasherInterface $hasher,
        private EntityManagerInterface $manager,
        private MailerService $mailer,
        private UrlGeneratorInterface $urlGenerator,
        private Security $security
    ) {}

    /**
     * Créer un nouvel utilisateur
     */
    public function create(User $user): bool
    {
        $user->setPassword($this->hasher->hashPassword($user, $user->getPassword()));
        $user->setRegisteredAt($this->now());
        $user->setActive(false); // Nécessite une vérification

        $result = $this->save($user);

        if ($result) {
            $this->sendVerificationEmail($user);
            $this->addFlash('success', 'Compte créé ! Vérifiez votre email.');
        }

        return $result;
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(User $user): bool
    {
        $user->setUpdatedAt($this->now());
        $result = $this->save($user);

        if ($result) {
            $this->addFlash('success', 'Utilisateur enregistré 🚀');
        }

        return $result;
    }
}
```

### AuthService (App\Service\AuthService)

Service d'authentification et de vérification des comptes.

```php
final class AuthService
{
    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'service/auth-service';

    public function __construct(
        private UserRepository $userRepository,
        private UserRequestRepository $userRequestRepository,
        private UserService $userService,
        private MailerService $mailer,
        private Security $security,
        private EntityManagerInterface $manager
    ) {}

    /**
     * Inscription d'un nouvel utilisateur
     */
    public function registration(User $user): bool
    {
        try {
            // Vérifier si l'email existe déjà
            if ($this->userRepository->findByEmail($user->getEmail())) {
                $this->addFlash('danger', 'Cette adresse email est déjà utilisée.');
                return false;
            }

            // Créer l'utilisateur
            $result = $this->userService->create($user);

            if ($result) {
                // Créer une demande de vérification
                $this->createVerificationRequest($user);
            }

            return $result;
        } catch (\Exception $e) {
            $this->logError('Registration failed', $e);
            return false;
        }
    }

    /**
     * Vérification d'un compte utilisateur
     */
    public function verificationUser(string $token): bool
    {
        $userRequest = $this->userRequestRepository->findOneBy([
            'token' => $token,
            'type' => UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value,
            'is_open' => true
        ]);

        if (!$userRequest || $this->isTokenExpired($userRequest)) {
            $this->addFlash('danger', 'Token de vérification invalide ou expiré.');
            return false;
        }

        $user = $userRequest->getUser();
        $user->setActive(true);

        $userRequest->setIsOpen(false);
        $userRequest->setUpdatedAt($this->now());

        $this->manager->persist($user);
        $this->manager->persist($userRequest);
        $this->manager->flush();

        $this->addFlash('success', 'Compte vérifié avec succès !');
        return true;
    }
}
```

### UserRequestService (App\Service\UserRequestService)

Service de gestion des demandes utilisateur (vérification, reset password, etc.).

```php
final class UserRequestService
{
    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'service/user-request';
    public const VERIFICATION_REDIRECT_ROUTE_NAME = 'auth_verification_index';

    public function __construct(
        private readonly UrlGeneratorInterface $urlGenerator,
        private readonly UserRequestRepository $repository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly MailerService $mailerService
    ) {}

    /**
     * Créer une nouvelle demande utilisateur
     */
    public function create(User $user, UserRequestEnum $type, array $data = []): UserRequest
    {
        $token = (new Token)->generate(60);

        $userRequest = new UserRequest();
        $userRequest->setToken($token)
                   ->setUser($user)
                   ->setType($type->value)
                   ->setContent(json_encode($data))
                   ->setCreatedAt($this->now())
                   ->setExpiredAt($this->now()->modify('+24 hours'))
                   ->setIsOpen(true);

        $this->save($userRequest, true);

        // Envoyer l'email de vérification
        $this->sendVerificationEmail($userRequest);

        return $userRequest;
    }

    /**
     * Vérifier un token de demande
     */
    public function userRequestVerification(string $token): bool
    {
        $userRequest = $this->repository->findOneBy([
            'token' => $token,
            'is_open' => true
        ]);

        if (!$userRequest) {
            $this->addFlash('danger', 'Token invalide.');
            return false;
        }

        if ($userRequest->getExpiredAt() < $this->now()) {
            $this->addFlash('danger', 'Token expiré.');
            return false;
        }

        // Traitement selon le type de demande
        return $this->processRequestByType($userRequest);
    }
}
```

## Contrôleurs

### Contrôleurs d'Authentification (AuthBundle)

#### RegistrationController

```php
#[Route('/registration', name: 'auth_registration_')]
final class RegistrationController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET', 'POST'])]
    public function index(Request $request): Response
    {
        $user = new User();
        $form = $this->createForm(RegistrationType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($this->authService->registration($user)) {
                return $this->redirectToRoute('auth_login');
            }
        }

        return $this->render('@auth/registration/index.html.twig', [
            'form' => $form,
            'user' => $user
        ]);
    }
}
```

#### UserVerificationController

```php
#[Route('/verification', name: 'auth_verification_')]
final class UserVerificationController extends AbstractController
{
    #[Route('/{token}', name: 'verify', methods: ['GET'])]
    public function verificationUser(string $token): RedirectResponse
    {
        $this->authService->verificationUser($token);
        return $this->redirectToRoute('auth_login');
    }

    #[Route('', name: 'index', methods: ['GET', 'POST'])]
    public function index(Request $request): Response
    {
        $form = $this->createForm(VerificationType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $email = $form->get('email')->getData();
            $this->userRequestService->resendVerification($email);
        }

        return $this->render('@auth/verification/index.html.twig', [
            'form' => $form
        ]);
    }
}
```

### Contrôleurs d'Administration (AdminBundle)

#### UserController

```php
#[Route('/user', name: 'admin_user_')]
final class UserController extends AbstractController
{
    #[Route('', name: 'index', methods: ['GET'])]
    #[IsGranted('admin.user.list')]
    public function index(Request $request): Response
    {
        return $this->render('@admin/user/index.html.twig',
            $this->userService->index($request)
        );
    }

    #[Route('/create', name: 'create', methods: ['GET', 'POST'])]
    #[IsGranted('admin.user.create')]
    public function create(Request $request): Response
    {
        $user = new User();
        $form = $this->createForm(UserType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->userService->create($user);
            return $this->redirectToRoute('admin_user_index');
        }

        return $this->render('@admin/user/create.html.twig', [
            'form' => $form,
            'user' => $user
        ]);
    }

    #[Route('/{id}/edit', name: 'edit_action', methods: ['PUT'])]
    #[IsGranted('admin.user.edit')]
    public function putAction(User $user, Request $request): Response
    {
        $response = $this->userService->update($request, $user);

        return $this->json(
            data: $response->data,
            status: $response->status,
            headers: $response->headers
        );
    }
}
```

## Repositories

### UserRepository

```php
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(
        ManagerRegistry $registry,
        private DenormalizerInterface $denormalizer
    ) {
        parent::__construct($registry, User::class);
    }

    /**
     * Recherche d'utilisateurs avec procédure stockée
     */
    public function search(string $query): array
    {
        $connection = $this->getEntityManager()->getConnection();
        $stmt = $connection->prepare("CALL search_user(:query)");
        $stmt->bindValue('query', $query);
        $result = $stmt->executeQuery()->fetchAllAssociative() ?: [];

        $users = [];
        foreach ($result as $key => $value) {
            $value['roles'] = json_decode($value['roles'], true);
            $value['active'] = (bool) $value['active'];
            $users[$key] = $this->denormalizer->denormalize($value, User::class);
        }

        return $users;
    }

    /**
     * Recherche par email ou username
     */
    public function findByUsernameOrEmail(string $userIdentifier): ?User
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.email = :identifier OR u.username = :identifier')
            ->setParameter('identifier', $userIdentifier)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Mise à jour automatique du password (Symfony Security)
     */
    public function upgradePassword(
        PasswordAuthenticatedUserInterface $user,
        string $newHashedPassword
    ): void {
        if (!$user instanceof User) {
            throw new UnsupportedUserException();
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }
}
```

## Formulaires Symfony

### RegistrationType

```php
class RegistrationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('username', TextType::class, [
                'label' => 'Nom d\'utilisateur',
            ])
            ->add('email', EmailType::class, [
                'label' => 'Adresse e-mail',
            ])
            ->add('password', RepeatedType::class, [
                'type' => PasswordType::class,
                'invalid_message' => 'Les deux mots de passes doivent être identiques !',
                'first_options' => ['label' => 'Mot de passe'],
                'second_options' => ['label' => 'Confirmez le mot de passe'],
                'constraints' => [
                    new NotBlank(),
                    new Regex([
                        'pattern' => '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/',
                        'message' => 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.'
                    ])
                ]
            ])
            ->add('firstname', TextType::class, [
                'label' => 'Prénom',
                'required' => false,
            ])
            ->add('lastname', TextType::class, [
                'label' => 'Nom de famille',
                'required' => false,
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'S\'inscrire',
                'attr' => ['class' => 'btn btn-primary'],
            ]);
    }
}
```

### UserType (Admin)

```php
class UserType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('firstname', TextType::class, [
                'label' => 'Prénom',
                'required' => false,
            ])
            ->add('lastname', TextType::class, [
                'label' => 'Nom de famille',
                'required' => false,
            ])
            ->add('username', TextType::class, [
                'label' => 'Nom d\'utilisateur',
                'required' => false,
            ])
            ->add('email', EmailType::class, [
                'label' => 'Adresse e-mail',
                'required' => false,
            ])
            ->add('roles', ChoiceType::class, [
                'label' => 'Rôle de l\'utilisateur',
                'choices' => RoleEnum::choices(),
                'multiple' => false,
                'expanded' => false,
                'placeholder' => 'Choisir un rôle',
                // Transformation array ↔ string pour l'interface
                'getter' => fn(User $user) => $user->getRoles()[0] ?? null,
                'setter' => function (User $user, ?string $role) {
                    $roles = ['ROLE_USER'];
                    if ($role && $role !== 'ROLE_USER') {
                        $roles[] = $role;
                    }
                    $user->setRoles(array_unique($roles));
                },
            ])
            ->add('active', CheckboxType::class, [
                'label' => 'Activer l\'utilisateur',
                'required' => false,
                'attr' => ['role' => 'switch'],
            ]);
    }
}
```

## Routes et Endpoints

### Routes d'authentification

- `POST /auth/login` : Connexion
- `GET|POST /auth/registration` : Inscription
- `GET /auth/logout` : Déconnexion
- `GET /auth/verification/{token}` : Vérification de compte
- `GET|POST /auth/verification` : Demande de renvoi de vérification

### Routes d'administration

- `GET /admin/user` : Liste paginée des utilisateurs
- `GET /admin/user/create` : Formulaire de création
- `POST /admin/user` : Création d'utilisateur (API)
- `GET /admin/user/{id}/edit` : Formulaire d'édition
- `PUT /admin/user/{id}` : Modification d'utilisateur (API)
- `PATCH /admin/user/{id}` : Modification partielle (API)
- `DELETE /admin/user/{id}` : Suppression (API)

### API REST

```typescript
// Exemples d'utilisation frontend
const createUser = async (userData: UserFormData) => {
  const response = await fetchPOST('/admin/user', userData);
  if (response.ok) {
    showSuccessMessage('Utilisateur créé');
  }
};

const updateUserRole = async (userId: number, role: string) => {
  const response = await fetchPATCH(`/admin/user/${userId}`, { role });
  return response.ok;
};
```

## Templates Twig

### Templates d'authentification

```
auth/templates/
├─ layout.html.twig          # Layout auth
├─ registration/
│  └─ index.html.twig        # Formulaire d'inscription
├─ login/
│  └─ index.html.twig        # Formulaire de connexion
└─ verification/
   └─ index.html.twig        # Page de vérification
```

### Templates d'administration

```
admin/templates/user/
├─ index.html.twig           # Liste des utilisateurs
├─ create.html.twig          # Création d'utilisateur
└─ edit.html.twig            # Édition d'utilisateur
```

## Sécurité et Permissions

### Système de rôles

```php
// Enum des rôles
enum RoleEnum: string
{
    case ROLE_USER = 'ROLE_USER';
    case ROLE_EDITOR = 'ROLE_EDITOR';
    case ROLE_ADMIN = 'ROLE_ADMIN';
    case ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN';

    public static function choices(): array
    {
        return array_combine(
            array_map(fn($case) => $case->value, self::cases()),
            array_map(fn($case) => $case->value, self::cases())
        );
    }
}
```

### Permissions granulaires

```php
// Annotations de sécurité
#[IsGranted('ROLE_ADMIN')]           // Rôle global
#[IsGranted('admin.user.create')]    // Permission spécifique
#[IsGranted('admin.user.edit')]      // Permission d'édition
```

## Interdépendances

### Relations avec d'autres modules

- **Module Requests** : Les utilisateurs peuvent créer des demandes
- **Module SEO** : Métadonnées pour les profils utilisateur
- **Module Tracking** : Suivi des actions utilisateur
- **Module Admin** : Interface de gestion complète

### Services externes utilisés

- **MailerService** : Envoi d'emails de vérification
- **Logger** : Traçabilité des actions
- **Security** : Authentification Symfony
- **Paginator** : Pagination des listes

## Composants Frontend

### Scripts TypeScript liés

```
public/js/admin/user.js          # Gestion utilisateurs admin
public/js/utils/fetch.js         # Client API
public/js/utils/form.js          # Gestionnaire de formulaires
```

### Styles SCSS

```
public/scss/admin/users.scss     # Styles interface admin
public/scss/auth/forms.scss      # Styles formulaires auth
public/scss/components/form.scss # Composants formulaires
```

Ce module offre une gestion complète et sécurisée des utilisateurs avec toutes les fonctionnalités modernes attendues d'une application web professionnelle.
