# Flux de Données

## Vue d'ensemble des Flux

L'application gère plusieurs flux de données principaux entre le frontend, le backend et la base de données, orchestrés par une architecture en couches bien définie.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │   DATABASE      │
│   TypeScript    │    │    Symfony      │    │    MySQL        │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User Actions  │───▶│ • Controllers   │───▶│ • Tables        │
│ • Form Submits  │    │ • Services      │    │ • Relations     │
│ • API Calls     │    │ • Repositories  │    │ • Constraints   │
│ • UI Updates    │◄───│ • Responses     │◄───│ • Triggers      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. Flux d'Authentification

### Processus de Connexion

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUX DE CONNEXION                           │
└─────────────────────────────────────────────────────────────────┘

Frontend (Login Form)
       │
       │ POST /auth/login
       │ { email, password }
       ▼
Auth\Controller\LoginController
       │
       │ → AuthService::authenticate()
       ▼
AuthService
       │
       │ → UserRepository::findByEmail()
       ▼
UserRepository
       │
       │ SELECT * FROM user WHERE email = ?
       ▼
Database (user table)
       │
       │ User entity + validation
       ▼
Symfony Security
       │
       │ Password verification
       │ Role assignment
       │ Session creation
       ▼
JSON Response
       │
       │ { success: true, redirect: '/dashboard' }
       ▼
Frontend (Redirect)
```

#### Code détaillé

**Frontend (TypeScript)**

```typescript
// Soumission du formulaire de connexion
const handleLogin = async (formData: LoginData) => {
  try {
    const response = await fetchPOST('/auth/login', {
      email: formData.email,
      password: formData.password,
    });

    if (response.ok) {
      window.location.href = response.data.redirect;
    }
  } catch (error) {
    displayLoginError(error.message);
  }
};
```

**Backend (Controller)**

```php
#[Route('/auth/login', name: 'auth_login', methods: ['POST'])]
public function authenticate(Request $request): JsonResponse
{
    $credentials = json_decode($request->getContent(), true);

    $user = $this->authService->authenticate(
        $credentials['email'],
        $credentials['password']
    );

    if ($user) {
        return $this->json([
            'success' => true,
            'redirect' => $this->generateUrl('dashboard')
        ]);
    }

    return $this->json(['error' => 'Invalid credentials'], 401);
}
```

## 2. Flux CRUD Administration

### Gestion des Utilisateurs (Create/Read/Update/Delete)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX CRUD UTILISATEUR                        │
└─────────────────────────────────────────────────────────────────┘

Frontend (Admin Panel)
       │
       │ GET /admin/user (Liste)
       │ POST /admin/user (Création)
       │ PUT /admin/user/{id} (Modification)
       │ DELETE /admin/user/{id} (Suppression)
       ▼
Admin\Controller\UserController
       │
       │ → Admin\Service\UserService
       ▼
Admin\UserService
       │
       │ → Validation (Symfony Validator)
       │ → Business Logic
       │ → UserRepository operations
       ▼
UserRepository
       │
       │ Doctrine ORM operations
       │ INSERT/SELECT/UPDATE/DELETE
       ▼
Database
       │
       │ Persistence + Relations update
       ▼
Response (JSON/HTML)
       │
       │ Success/Error + Data
       ▼
Frontend (UI Update)
```

#### Flux détaillé par opération

**CREATE - Création d'utilisateur**

```typescript
// Frontend
const createUser = async (userData: UserData) => {
  const response = await fetchPOST('/admin/user', userData);

  if (response.ok) {
    showSuccessMessage('Utilisateur créé');
    refreshUserList();
  } else {
    displayValidationErrors(response.data.violations);
  }
};
```

```php
// Backend Controller
#[Route('/admin/user', methods: ['POST'])]
public function create(Request $request): JsonResponse
{
    $user = new User();
    $form = $this->createForm(UserType::class, $user);
    $form->submit(json_decode($request->getContent(), true));

    if ($form->isValid()) {
        $this->userService->create($user);
        return $this->json(['success' => true]);
    }

    return $this->json([
        'violations' => $this->getFormErrors($form)
    ], 422);
}

// Service
public function create(User $user): bool
{
    $password = (new Token)->generate(30);
    $user->setPassword($this->hashPassword($user->setPassword($password)));
    $user->setRegisteredAt($this->now());

    return $this->save($user, true);
}
```

**READ - Liste paginée**

```php
// Repository avec pagination
public function findPaginated(int $page, int $limit): PaginationInterface
{
    $query = $this->createQueryBuilder('u')
        ->orderBy('u.registeredAt', 'DESC')
        ->getQuery();

    return $this->paginator->paginate($query, $page, $limit);
}

// Service
public function index(Request $request): array
{
    $users = $this->repository->findPaginated(
        $request->query->getInt('page', 1),
        10
    );

    return [
        'users' => $users,
        'breadcrumb' => $this->breadcrumb()
    ];
}
```

## 3. Flux de Validation et Gestion d'Erreurs

### Validation Multi-Couches

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUX DE VALIDATION                            │
└─────────────────────────────────────────────────────────────────┘

Frontend Validation (TypeScript)
       │ • Type checking
       │ • Required fields
       │ • Format validation
       ▼
HTTP Request (JSON)
       │
       ▼
Symfony Request Validation
       │ • CSRF Token
       │ • Content-Type
       │ • JSON parsing
       ▼
Form Validation (Symfony)
       │ • Form constraints
       │ • Field mapping
       │ • Data transformation
       ▼
Entity Validation (Doctrine)
       │ • Assert annotations
       │ • Custom validators
       │ • Database constraints
       ▼
Business Logic Validation (Service)
       │ • Business rules
       │ • Permission checks
       │ • Data consistency
       ▼
Database Constraints
       │ • Foreign keys
       │ • Unique constraints
       │ • Check constraints
       ▼
Response with Violations
```

#### Exemple complet de validation

```php
// Entity avec annotations de validation
class User implements UserInterface
{
    #[Assert\NotBlank(message: 'L\'email est requis.')]
    #[Assert\Email(message: 'L\'email "{{ value }}" n\'est pas valide.')]
    #[ORM\Column(length: 180)]
    private ?string $email = null;

    #[Assert\Length(min: 3, max: 100)]
    #[ORM\Column(length: 100)]
    private ?string $username = null;
}

// Service avec validation métier
public function create(User $user): bool
{
    // Validation métier
    if ($this->repository->findByEmail($user->getEmail())) {
        throw new ValidationException('Email déjà utilisé');
    }

    // Validation des rôles
    $roles = $user->getRoles();
    if (!$this->isValidRoleAssignment($roles)) {
        throw new ValidationException('Rôles non autorisés');
    }

    return $this->save($user, true);
}
```

## 4. Flux de Gestion des Fichiers

### Upload et Traitement de Fichiers

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUX DE FICHIERS                              │
└─────────────────────────────────────────────────────────────────┘

Frontend (File Input)
       │ • File selection
       │ • Client validation (size, type)
       │ • FormData creation
       ▼
Upload Request (multipart/form-data)
       │
       ▼
FileController
       │ • Symfony UploadedFile
       │ • Server validation
       │ • Virus scanning (optionnel)
       ▼
FileService
       │ • File processing
       │ • Metadata extraction
       │ • Storage path generation
       ▼
File Storage
       │ • Physical file save
       │ • Permissions setting
       ▼
Database (file table)
       │ • File metadata
       │ • Relations (request, user)
       ▼
Response (file info)
```

## 5. Flux de Notifications et Emails

### Système de Notification Asynchrone

```
┌─────────────────────────────────────────────────────────────────┐
│               FLUX DE NOTIFICATIONS                             │
└─────────────────────────────────────────────────────────────────┘

User Action (Frontend)
       │
       ▼
Business Service
       │ • Process action
       │ • Generate event
       ▼
Event Dispatcher
       │
       ▼
Email Subscriber
       │ • Listen to events
       │ • Prepare email data
       ▼
MailerService
       │ • Template rendering
       │ • Email composition
       ▼
Message Queue (optionnel)
       │
       ▼
SMTP Server
       │
       ▼
User Email Client
```

#### Exemple de notification

```php
// Event dispatch dans un service
public function createUser(User $user): bool
{
    $result = $this->save($user, true);

    if ($result) {
        // Déclencher l'événement
        $this->eventDispatcher->dispatch(
            new UserCreatedEvent($user),
            UserCreatedEvent::NAME
        );
    }

    return $result;
}

// Subscriber pour l'email
class UserEmailSubscriber implements EventSubscriberInterface
{
    public function onUserCreated(UserCreatedEvent $event): void
    {
        $user = $event->getUser();

        $email = new Email(
            name: UserRequestEnum::ACCOUNT_CREATION_REQUEST->value,
            action: 'Création de compte',
            template: 'auth/account-created',
            context: ['user' => $user]
        );

        $this->mailerService->send($email);
    }
}
```

## 6. Flux de Tracking et Analytics

### Collecte de Données d'Usage

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUX DE TRACKING                               │
└─────────────────────────────────────────────────────────────────┘

Frontend (User Interaction)
       │ • Click events
       │ • Page views
       │ • Form interactions
       ▼
JavaScript Tracking
       │ • Event collection
       │ • Device detection
       │ • Session info
       ▼
Tracking API (/api/track)
       │
       ▼
TrackingController
       │ • Request validation
       │ • Event processing
       ▼
XTrackingService
       │ • Event aggregation
       │ • Device categorization
       ▼
Database (xtracking_event_log)
       │ • Event storage
       │ • Real-time analytics
       ▼
Analytics Dashboard
```

## 7. Optimisation des Flux

### Stratégies de Performance

#### Cache Multi-Niveaux

```php
// Service avec cache
public function getUserStats(int $userId): array
{
    return $this->cache->get("user_stats_{$userId}", function() use ($userId) {
        return $this->repository->calculateUserStats($userId);
    }, 3600); // Cache 1h
}
```

#### Lazy Loading

```php
// Relations chargées à la demande
class User
{
    #[ORM\OneToMany(targetEntity: UserRequest::class, mappedBy: 'user')]
    private Collection $requests; // Pas de fetch="EAGER"

    public function getRequests(): Collection
    {
        // Chargé uniquement si nécessaire
        return $this->requests;
    }
}
```

#### Pagination Optimisée

```typescript
// Frontend avec pagination infinie
class InfiniteList {
  private async loadMore() {
    const nextPage = this.currentPage + 1;
    const response = await fetchGET(`/api/users?page=${nextPage}`);

    if (response.data.length > 0) {
      this.appendItems(response.data);
      this.currentPage = nextPage;
    }
  }
}
```

## 8. Gestion des États et Cohérence

### Synchronisation Frontend-Backend

#### État Optimiste

```typescript
// Update optimiste avec rollback
const updateUser = async (userId: string, changes: Partial<User>) => {
  // 1. Update immédiat de l'UI
  this.updateUserInUI(userId, changes);

  try {
    // 2. Synchronisation serveur
    await fetchPUT(`/admin/user/${userId}`, changes);
  } catch (error) {
    // 3. Rollback en cas d'erreur
    this.revertUserInUI(userId);
    throw error;
  }
};
```

#### Validation de Cohérence

```php
// Service avec vérification de cohérence
public function updateUser(User $user, array $changes): bool
{
    $this->entityManager->beginTransaction();

    try {
        // Appliquer les changements
        $this->applyChanges($user, $changes);

        // Vérifier la cohérence
        $this->validateBusinessRules($user);

        // Sauvegarder
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        $this->entityManager->commit();

        return true;
    } catch (\Exception $e) {
        $this->entityManager->rollback();
        throw $e;
    }
}
```

Cette architecture de flux de données assure une communication robuste, performante et cohérente entre toutes les couches de l'application.
