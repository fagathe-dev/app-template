# Module d'Authentification

## Vue d'ensemble

Le module d'authentification (AuthBundle) gère l'ensemble du processus d'authentification et d'autorisation de l'application. Il fournit une interface sécurisée pour la connexion, l'inscription, la vérification des comptes et la récupération de mots de passe, en s'appuyant sur le composant Security de Symfony.

## Rôle et Responsabilités

### Fonctionnalités principales

- **Connexion sécurisée** : Authentification avec email/username et mot de passe
- **Inscription** : Création de nouveaux comptes avec validation
- **Vérification de compte** : Validation par email avec tokens sécurisés
- **Récupération de mot de passe** : Reset sécurisé par email
- **Gestion des sessions** : Maintien de l'état d'authentification
- **Protection CSRF** : Sécurisation des formulaires
- **Remember Me** : Connexion persistante optionnelle

## Architecture du Bundle

### Structure des répertoires

```
auth/
├─ config/
│  └─ services.yaml              # Configuration services AuthBundle
├─ src/
│  ├─ AuthBundle.php            # Classe principale du bundle
│  ├─ Controller/               # Contrôleurs d'authentification
│  │  ├─ LoginController.php    # Connexion/déconnexion
│  │  ├─ RegistrationController.php  # Inscription
│  │  ├─ UserVerificationController.php  # Vérification compte
│  │  └─ PasswordResetController.php     # Reset password
│  └─ Service/                  # Services métier auth
│     ├─ AuthService.php        # Service principal authentification
│     ├─ RegistrationService.php # Service inscription
│     └─ PasswordResetService.php # Service reset password
└─ templates/
   ├─ layout.html.twig          # Layout auth avec branding
   ├─ index.html.twig           # Page d'accueil auth
   ├─ login/
   │  └─ index.html.twig        # Formulaire de connexion
   ├─ registration/
   │  └─ index.html.twig        # Formulaire d'inscription
   ├─ verification/
   │  ├─ index.html.twig        # Page de vérification
   │  └─ resend.html.twig       # Demande de renvoi
   ├─ partials/
   │  ├─ flash-messages.html.twig  # Messages flash
   │  └─ auth-header.html.twig     # En-tête auth
   └─ password-reset/
      ├─ request.html.twig      # Demande de reset
      └─ reset.html.twig        # Nouveau mot de passe
```

## Services d'Authentification

### AuthService (Auth\Service\AuthService)

Service principal orchestrant les processus d'authentification.

```php
final class AuthService
{
    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'auth/auth-service';

    public function __construct(
        private UserRepository $userRepository,
        private UserRequestRepository $userRequestRepository,
        private UserService $userService,
        private MailerService $mailer,
        private Security $security,
        private EntityManagerInterface $manager,
        private UserPasswordHasherInterface $passwordHasher,
        private CsrfTokenManagerInterface $csrfTokenManager
    ) {}

    /**
     * Inscription d'un nouvel utilisateur
     */
    public function registration(User $user): bool
    {
        try {
            // Vérification de l'unicité de l'email
            if ($this->userRepository->findByEmail($user->getEmail())) {
                $this->addFlash('danger', 'Cette adresse email est déjà utilisée.');
                return false;
            }

            // Vérification de l'unicité du username
            if ($this->userRepository->findByUsername($user->getUsername())) {
                $this->addFlash('danger', 'Ce nom d\'utilisateur est déjà utilisé.');
                return false;
            }

            // Hachage du mot de passe
            $hashedPassword = $this->passwordHasher->hashPassword($user, $user->getPassword());
            $user->setPassword($hashedPassword);

            // Configuration du compte
            $user->setRoles(['ROLE_USER']);
            $user->setActive(false); // Activation après vérification email
            $user->setRegisteredAt($this->now());

            // Sauvegarde
            $this->manager->persist($user);
            $this->manager->flush();

            // Création de la demande de vérification
            $this->createAccountVerificationRequest($user);

            $this->addFlash('success', 'Compte créé ! Vérifiez votre email pour l\'activer.');
            $this->logInfo('User registered successfully', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Registration failed', $e);
            $this->addFlash('danger', 'Erreur lors de l\'inscription. Veuillez réessayer.');
            return false;
        }
    }

    /**
     * Vérification d'un compte utilisateur
     */
    public function verifyUserAccount(string $token): bool
    {
        try {
            $userRequest = $this->userRequestRepository->findOneBy([
                'token' => $token,
                'type' => UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value,
                'is_open' => true
            ]);

            if (!$userRequest) {
                $this->addFlash('danger', 'Token de vérification invalide.');
                return false;
            }

            if ($this->isTokenExpired($userRequest)) {
                $this->addFlash('danger', 'Token de vérification expiré.');
                return false;
            }

            $user = $userRequest->getUser();

            // Activation du compte
            $user->setActive(true);
            $user->setVerifiedAt($this->now());

            // Fermeture de la demande
            $userRequest->setIsOpen(false);
            $userRequest->setProcessedAt($this->now());

            $this->manager->persist($user);
            $this->manager->persist($userRequest);
            $this->manager->flush();

            // Email de confirmation
            $this->mailer->sendAccountActivatedEmail($user);

            $this->addFlash('success', 'Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.');
            $this->logInfo('User account verified', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Account verification failed', $e);
            $this->addFlash('danger', 'Erreur lors de la vérification.');
            return false;
        }
    }

    /**
     * Création d'une demande de vérification de compte
     */
    private function createAccountVerificationRequest(User $user): void
    {
        $token = bin2hex(random_bytes(32));

        $userRequest = new UserRequest();
        $userRequest->setToken($token)
                   ->setUser($user)
                   ->setType(UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value)
                   ->setCreatedAt($this->now())
                   ->setExpiredAt($this->now()->modify('+24 hours'))
                   ->setIsOpen(true);

        $this->manager->persist($userRequest);
        $this->manager->flush();

        // Envoi de l'email de vérification
        $this->mailer->sendVerificationEmail($user, $token);
    }

    /**
     * Vérification de l'expiration d'un token
     */
    private function isTokenExpired(UserRequest $userRequest): bool
    {
        return $userRequest->getExpiredAt() < $this->now();
    }

    /**
     * Tentative de connexion (logs de sécurité)
     */
    public function logLoginAttempt(string $identifier, bool $success, ?string $reason = null): void
    {
        $this->logInfo('Login attempt', [
            'identifier' => $identifier,
            'success' => $success,
            'reason' => $reason,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }
}
```

### PasswordResetService (Auth\Service\PasswordResetService)

Service spécialisé dans la récupération de mots de passe.

```php
final class PasswordResetService
{
    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'auth/password-reset';
    private const TOKEN_VALIDITY_HOURS = 2;

    public function __construct(
        private UserRepository $userRepository,
        private UserRequestRepository $userRequestRepository,
        private MailerService $mailer,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface $manager
    ) {}

    /**
     * Demande de réinitialisation de mot de passe
     */
    public function requestPasswordReset(string $email): bool
    {
        try {
            $user = $this->userRepository->findByEmail($email);

            if (!$user) {
                // Sécurité : ne pas révéler si l'email existe ou non
                $this->addFlash('success', 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.');
                return true;
            }

            if (!$user->isActive()) {
                $this->addFlash('danger', 'Ce compte n\'est pas activé.');
                return false;
            }

            // Vérifier s'il n'y a pas déjà une demande en cours
            $existingRequest = $this->userRequestRepository->findActivePasswordResetRequest($user);
            if ($existingRequest) {
                $this->addFlash('info', 'Une demande de réinitialisation est déjà en cours. Vérifiez votre email.');
                return true;
            }

            // Créer une nouvelle demande
            $token = bin2hex(random_bytes(32));

            $userRequest = new UserRequest();
            $userRequest->setToken($token)
                       ->setUser($user)
                       ->setType(UserRequestEnum::PASSWORD_RESET_REQUEST->value)
                       ->setCreatedAt($this->now())
                       ->setExpiredAt($this->now()->modify('+' . self::TOKEN_VALIDITY_HOURS . ' hours'))
                       ->setIsOpen(true);

            $this->manager->persist($userRequest);
            $this->manager->flush();

            // Envoi de l'email
            $this->mailer->sendPasswordResetEmail($user, $token);

            $this->addFlash('success', 'Un email de réinitialisation a été envoyé.');
            $this->logInfo('Password reset requested', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Password reset request failed', $e);
            $this->addFlash('danger', 'Erreur lors de la demande. Veuillez réessayer.');
            return false;
        }
    }

    /**
     * Réinitialisation du mot de passe avec token
     */
    public function resetPassword(string $token, string $newPassword): bool
    {
        try {
            $userRequest = $this->userRequestRepository->findOneBy([
                'token' => $token,
                'type' => UserRequestEnum::PASSWORD_RESET_REQUEST->value,
                'is_open' => true
            ]);

            if (!$userRequest || $this->isTokenExpired($userRequest)) {
                $this->addFlash('danger', 'Token de réinitialisation invalide ou expiré.');
                return false;
            }

            $user = $userRequest->getUser();

            // Validation du nouveau mot de passe
            if (!$this->isValidPassword($newPassword)) {
                $this->addFlash('danger', 'Le mot de passe ne respecte pas les critères de sécurité.');
                return false;
            }

            // Mise à jour du mot de passe
            $hashedPassword = $this->passwordHasher->hashPassword($user, $newPassword);
            $user->setPassword($hashedPassword);
            $user->setPasswordUpdatedAt($this->now());

            // Fermeture de la demande
            $userRequest->setIsOpen(false);
            $userRequest->setProcessedAt($this->now());

            $this->manager->persist($user);
            $this->manager->persist($userRequest);
            $this->manager->flush();

            // Email de confirmation
            $this->mailer->sendPasswordChangedNotification($user);

            $this->addFlash('success', 'Mot de passe modifié avec succès.');
            $this->logInfo('Password reset completed', ['user_id' => $user->getId()]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Password reset failed', $e);
            $this->addFlash('danger', 'Erreur lors de la réinitialisation.');
            return false;
        }
    }

    /**
     * Validation de la force du mot de passe
     */
    private function isValidPassword(string $password): bool
    {
        // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
        return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password) === 1;
    }
}
```

## Contrôleurs d'Authentification

### LoginController

```php
#[Route('/auth', name: 'auth_')]
final class LoginController extends AbstractController
{
    public function __construct(
        private AuthService $authService
    ) {}

    #[Route('/login', name: 'login', methods: ['GET', 'POST'])]
    public function login(AuthenticationUtils $authenticationUtils): Response
    {
        // Redirection si déjà connecté
        if ($this->getUser()) {
            return $this->redirectToRoute($this->getRedirectRoute());
        }

        // Récupération des erreurs d'authentification
        $error = $authenticationUtils->getLastAuthenticationError();
        $lastUsername = $authenticationUtils->getLastUsername();

        // Log de la tentative si erreur
        if ($error) {
            $this->authService->logLoginAttempt($lastUsername, false, $error->getMessage());
        }

        return $this->render('@auth/login/index.html.twig', [
            'last_username' => $lastUsername,
            'error' => $error,
        ]);
    }

    #[Route('/logout', name: 'logout', methods: ['GET'])]
    public function logout(): void
    {
        // Cette méthode peut rester vide - elle sera interceptée par la clé logout dans security.yaml
        throw new \LogicException('Cette méthode ne devrait jamais être appelée directement.');
    }

    /**
     * Détermine la route de redirection selon le rôle
     */
    private function getRedirectRoute(): string
    {
        $user = $this->getUser();

        return match(true) {
            $this->isGranted('ROLE_ADMIN') => 'admin_index',
            $this->isGranted('ROLE_USER') => 'app_index',
            default => 'auth_login'
        };
    }
}
```

### RegistrationController

```php
#[Route('/auth/registration', name: 'auth_registration_')]
final class RegistrationController extends AbstractController
{
    public function __construct(
        private AuthService $authService
    ) {}

    #[Route('', name: 'index', methods: ['GET', 'POST'])]
    public function index(Request $request): Response
    {
        // Redirection si déjà connecté
        if ($this->getUser()) {
            return $this->redirectToRoute('app_index');
        }

        $user = new User();
        $form = $this->createForm(RegistrationType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            if ($this->authService->registration($user)) {
                return $this->redirectToRoute('auth_verification_info');
            }
        }

        return $this->render('@auth/registration/index.html.twig', [
            'form' => $form->createView(),
            'user' => $user
        ]);
    }
}
```

### UserVerificationController

```php
#[Route('/auth/verification', name: 'auth_verification_')]
final class UserVerificationController extends AbstractController
{
    public function __construct(
        private AuthService $authService,
        private UserRequestService $userRequestService
    ) {}

    #[Route('/{token}', name: 'verify', methods: ['GET'], requirements: ['token' => '[a-f0-9]{64}'])]
    public function verify(string $token): RedirectResponse
    {
        $this->authService->verifyUserAccount($token);
        return $this->redirectToRoute('auth_login');
    }

    #[Route('', name: 'index', methods: ['GET', 'POST'])]
    public function index(Request $request): Response
    {
        $form = $this->createForm(VerificationType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $email = $form->get('email')->getData();
            $this->userRequestService->resendVerificationEmail($email);
        }

        return $this->render('@auth/verification/index.html.twig', [
            'form' => $form->createView()
        ]);
    }

    #[Route('/info', name: 'info', methods: ['GET'])]
    public function info(): Response
    {
        return $this->render('@auth/verification/info.html.twig');
    }
}
```

### PasswordResetController

```php
#[Route('/auth/password-reset', name: 'auth_password_reset_')]
final class PasswordResetController extends AbstractController
{
    public function __construct(
        private PasswordResetService $passwordResetService
    ) {}

    #[Route('/request', name: 'request', methods: ['GET', 'POST'])]
    public function request(Request $request): Response
    {
        $form = $this->createForm(PasswordResetRequestType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $email = $form->get('email')->getData();
            $this->passwordResetService->requestPasswordReset($email);
            return $this->redirectToRoute('auth_password_reset_info');
        }

        return $this->render('@auth/password-reset/request.html.twig', [
            'form' => $form->createView()
        ]);
    }

    #[Route('/reset/{token}', name: 'reset', methods: ['GET', 'POST'], requirements: ['token' => '[a-f0-9]{64}'])]
    public function reset(string $token, Request $request): Response
    {
        $form = $this->createForm(PasswordResetType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $newPassword = $form->get('password')->getData();
            if ($this->passwordResetService->resetPassword($token, $newPassword)) {
                return $this->redirectToRoute('auth_login');
            }
        }

        return $this->render('@auth/password-reset/reset.html.twig', [
            'form' => $form->createView(),
            'token' => $token
        ]);
    }

    #[Route('/info', name: 'info', methods: ['GET'])]
    public function info(): Response
    {
        return $this->render('@auth/password-reset/info.html.twig');
    }
}
```

## Formulaires Symfony

### LoginType

```php
class LoginType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('_username', TextType::class, [
                'label' => 'Email ou nom d\'utilisateur',
                'attr' => [
                    'placeholder' => 'votre@email.com',
                    'autocomplete' => 'username'
                ]
            ])
            ->add('_password', PasswordType::class, [
                'label' => 'Mot de passe',
                'attr' => [
                    'placeholder' => '••••••••',
                    'autocomplete' => 'current-password'
                ]
            ])
            ->add('_remember_me', CheckboxType::class, [
                'label' => 'Se souvenir de moi',
                'required' => false,
            ])
            ->add('_token', HiddenType::class, [
                'data' => $this->csrfTokenManager->getToken('authenticate')->getValue()
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'Se connecter',
                'attr' => ['class' => 'btn btn-primary btn-lg w-100']
            ]);
    }
}
```

### RegistrationType

```php
class RegistrationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('username', TextType::class, [
                'label' => 'Nom d\'utilisateur',
                'constraints' => [
                    new NotBlank(),
                    new Length(min: 3, max: 100),
                    new Regex(pattern: '/^[a-zA-Z0-9_]+$/', message: 'Seuls les lettres, chiffres et underscores sont autorisés.')
                ],
                'attr' => ['placeholder' => 'monnomdutilisateur']
            ])
            ->add('email', EmailType::class, [
                'label' => 'Adresse e-mail',
                'constraints' => [
                    new NotBlank(),
                    new Email()
                ],
                'attr' => ['placeholder' => 'votre@email.com']
            ])
            ->add('password', RepeatedType::class, [
                'type' => PasswordType::class,
                'invalid_message' => 'Les deux mots de passe doivent être identiques.',
                'first_options' => [
                    'label' => 'Mot de passe',
                    'attr' => ['placeholder' => '••••••••']
                ],
                'second_options' => [
                    'label' => 'Confirmez le mot de passe',
                    'attr' => ['placeholder' => '••••••••']
                ],
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
                'attr' => ['placeholder' => 'Votre prénom']
            ])
            ->add('lastname', TextType::class, [
                'label' => 'Nom de famille',
                'required' => false,
                'attr' => ['placeholder' => 'Votre nom']
            ])
            ->add('terms', CheckboxType::class, [
                'label' => 'J\'accepte les conditions d\'utilisation',
                'mapped' => false,
                'constraints' => [
                    new IsTrue(['message' => 'Vous devez accepter les conditions d\'utilisation.'])
                ]
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'S\'inscrire',
                'attr' => ['class' => 'btn btn-primary btn-lg w-100']
            ]);
    }
}
```

### PasswordResetRequestType

```php
class PasswordResetRequestType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('email', EmailType::class, [
                'label' => 'Adresse e-mail',
                'constraints' => [
                    new NotBlank(['message' => 'Veuillez saisir votre adresse e-mail.']),
                    new Email(['message' => 'Veuillez saisir une adresse e-mail valide.'])
                ],
                'attr' => [
                    'placeholder' => 'votre@email.com',
                    'autocomplete' => 'email'
                ]
            ])
            ->add('submit', SubmitType::class, [
                'label' => 'Envoyer le lien de réinitialisation',
                'attr' => ['class' => 'btn btn-primary btn-lg w-100']
            ]);
    }
}
```

## Configuration de Sécurité

### Security.yaml

```yaml
security:
  password_hashers:
    App\Entity\User:
      algorithm: auto

  providers:
    app_user_provider:
      entity:
        class: App\Entity\User
        property: email

  firewalls:
    dev:
      pattern: ^/(_(profiler|wdt)|css|images|js)/
      security: false

    main:
      lazy: true
      provider: app_user_provider
      form_login:
        login_path: auth_login
        check_path: auth_login
        default_target_path: app_index
        always_use_default_target_path: false
        success_handler: App\Security\LoginSuccessHandler
        failure_handler: App\Security\LoginFailureHandler
        enable_csrf: true
      logout:
        path: auth_logout
        target: auth_login
        invalidate_session: true
        delete_cookies:
          REMEMBERME: { path: '/', domain: null }
      remember_me:
        secret: '%kernel.secret%'
        lifetime: 604800 # 1 semaine
        path: /
        always_remember_me: false

  access_control:
    - { path: ^/auth/login, roles: PUBLIC_ACCESS }
    - { path: ^/auth/registration, roles: PUBLIC_ACCESS }
    - { path: ^/auth/verification, roles: PUBLIC_ACCESS }
    - { path: ^/auth/password-reset, roles: PUBLIC_ACCESS }
    - { path: ^/admin, roles: ROLE_ADMIN }
    - { path: ^/, roles: ROLE_USER }
```

## Templates Twig

### Layout principal (layout.html.twig)

```twig
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Authentification{% endblock %} - {{ app.name }}</title>

    {{ encore_entry_link_tags('auth') }}
    {{ encore_entry_link_tags('app') }}

    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
</head>
<body class="auth-layout">
    <div class="auth-container">
        <div class="auth-card">
            <!-- Branding -->
            <div class="auth-header">
                <a href="{{ path('app_index') }}" class="brand">
                    <img src="{{ asset('images/logo.svg') }}" alt="Logo">
                    <span>{{ app.name }}</span>
                </a>
            </div>

            <!-- Messages flash -->
            {% include '@auth/partials/flash-messages.html.twig' %}

            <!-- Contenu principal -->
            <div class="auth-content">
                {% block content %}{% endblock %}
            </div>

            <!-- Liens de navigation -->
            <div class="auth-footer">
                {% block auth_links %}{% endblock %}
            </div>
        </div>
    </div>

    {{ encore_entry_script_tags('auth') }}
    {{ encore_entry_script_tags('app') }}
</body>
</html>
```

### Formulaire de connexion (login/index.html.twig)

```twig
{% extends '@auth/layout.html.twig' %}

{% block title %}Connexion{% endblock %}

{% block content %}
<h2 class="auth-title">Connexion à votre compte</h2>

{% if error %}
    <div class="alert alert-danger">
        {{ error.messageKey|trans(error.messageData, 'security') }}
    </div>
{% endif %}

{{ form_start(form, {'attr': {'class': 'auth-form'}}) }}
    <div class="form-group">
        {{ form_label(form._username) }}
        {{ form_widget(form._username, {'attr': {'class': 'form-control form-control-lg'}}) }}
        {{ form_errors(form._username) }}
    </div>

    <div class="form-group">
        {{ form_label(form._password) }}
        {{ form_widget(form._password, {'attr': {'class': 'form-control form-control-lg'}}) }}
        {{ form_errors(form._password) }}
    </div>

    <div class="form-check">
        {{ form_widget(form._remember_me, {'attr': {'class': 'form-check-input'}}) }}
        {{ form_label(form._remember_me, null, {'label_attr': {'class': 'form-check-label'}}) }}
    </div>

    {{ form_widget(form._token) }}
    {{ form_widget(form.submit) }}
{{ form_end(form) }}
{% endblock %}

{% block auth_links %}
<div class="auth-links">
    <a href="{{ path('auth_registration_index') }}">Créer un compte</a>
    <a href="{{ path('auth_password_reset_request') }}">Mot de passe oublié ?</a>
</div>
{% endblock %}
```

## Routes et Endpoints

### Routes d'authentification

- `GET|POST /auth/login` : Connexion
- `GET /auth/logout` : Déconnexion
- `GET|POST /auth/registration` : Inscription
- `GET /auth/verification/{token}` : Vérification de compte
- `GET|POST /auth/verification` : Demande de renvoi de vérification
- `GET|POST /auth/password-reset/request` : Demande de reset password
- `GET|POST /auth/password-reset/reset/{token}` : Nouveau mot de passe

### Handlers de sécurité

```php
// LoginSuccessHandler
class LoginSuccessHandler implements AuthenticationSuccessHandlerInterface
{
    public function onAuthenticationSuccess(Request $request, TokenInterface $token): ?Response
    {
        $user = $token->getUser();

        // Log de connexion réussie
        $this->logger->info('User logged in successfully', ['user_id' => $user->getId()]);

        // Redirection selon le rôle
        $targetUrl = $this->isGranted('ROLE_ADMIN') ? '/admin' : '/';

        return new RedirectResponse($targetUrl);
    }
}

// LoginFailureHandler
class LoginFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        // Log de tentative échouée
        $this->logger->warning('Login attempt failed', [
            'username' => $request->request->get('_username'),
            'reason' => $exception->getMessage()
        ]);

        return new RedirectResponse('/auth/login');
    }
}
```

## Sécurité et Protection

### Protection contre les attaques

- **CSRF** : Tokens CSRF sur tous les formulaires
- **Brute Force** : Rate limiting sur les tentatives de connexion
- **Session Fixation** : Régénération des sessions
- **Password Hashing** : Algorithme bcrypt/Argon2i
- **Remember Me** : Tokens sécurisés avec expiration

### Validation et contraintes

- **Email** : Validation format et unicité
- **Username** : Caractères autorisés et unicité
- **Password** : Force minimale requise
- **Tokens** : Expiration et unicité

## Interdépendances

### Modules utilisés

- **UserManagement** : Entités User et UserRequest
- **MailerService** : Envoi des emails de vérification
- **LoggerService** : Traçabilité des actions

### Services Symfony

- **Security** : Authentification et autorisation
- **Form** : Gestion des formulaires
- **Mailer** : Envoi d'emails
- **Validator** : Validation des données

Le module d'authentification fournit une base solide et sécurisée pour la gestion des utilisateurs avec toutes les fonctionnalités modernes attendues d'une application web professionnelle.
