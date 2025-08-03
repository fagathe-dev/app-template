# Système d'Autorisation

## Vue d'ensemble

Ce document détaille l'implémentation du système d'autorisation basé sur les rôles et permissions, incluant la hiérarchie des rôles, les contrôles d'accès granulaires et les voters personnalisés.

## Architecture du Système d'Autorisation

### Hiérarchie des Rôles

#### Configuration des rôles

```yaml
# config/packages/security.yaml
security:
  role_hierarchy:
    ROLE_MODERATOR: ROLE_USER
    ROLE_SUPPORT: ROLE_USER
    ROLE_ANALYST: ROLE_USER
    ROLE_ADMIN: [ROLE_USER, ROLE_MODERATOR, ROLE_SUPPORT, ROLE_ANALYST]
    ROLE_SUPER_ADMIN: [ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]
```

#### Description des rôles

- **ROLE_USER** : Utilisateur standard avec accès de base
- **ROLE_MODERATOR** : Modération du contenu et des utilisateurs
- **ROLE_SUPPORT** : Support client et gestion des demandes
- **ROLE_ANALYST** : Accès aux analytics et rapports
- **ROLE_ADMIN** : Administration complète de l'application
- **ROLE_SUPER_ADMIN** : Administration système et impersonation

## Service de Gestion des Autorisations

### AuthorizationService

```php
<?php

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Component\Security\Core\Security;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

final class AuthorizationService
{
    use ResponseTrait;

    private const LOG_FILE = 'security/authorization';

    // Définition des permissions par rôle
    private const ROLE_PERMISSIONS = [
        'ROLE_USER' => [
            'profile.view',
            'profile.edit',
            'request.create',
            'request.view_own',
            'request.edit_own',
            'file.upload',
            'file.view_own'
        ],
        'ROLE_MODERATOR' => [
            'user.view_list',
            'user.moderate',
            'request.view_all',
            'request.moderate',
            'comment.moderate'
        ],
        'ROLE_SUPPORT' => [
            'request.view_all',
            'request.assign',
            'request.resolve',
            'user.view_details',
            'email.send'
        ],
        'ROLE_ANALYST' => [
            'analytics.view',
            'report.generate',
            'export.data',
            'user.view_statistics'
        ],
        'ROLE_ADMIN' => [
            'user.create',
            'user.edit',
            'user.delete',
            'user.manage_roles',
            'system.configure',
            'log.view',
            'backup.create'
        ],
        'ROLE_SUPER_ADMIN' => [
            'system.maintenance',
            'user.impersonate',
            'database.access',
            'security.configure'
        ]
    ];

    public function __construct(
        private Security $security,
        private AuthorizationCheckerInterface $authorizationChecker,
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
        private LoggerInterface $logger
    ) {}

    /**
     * Vérifier si l'utilisateur connecté a une permission spécifique
     */
    public function hasPermission(string $permission): bool
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return false;
        }

        return $this->userHasPermission($user, $permission);
    }

    /**
     * Vérifier si un utilisateur donné a une permission spécifique
     */
    public function userHasPermission(User $user, string $permission): bool
    {
        $userRoles = $user->getRoles();

        foreach ($userRoles as $role) {
            if (isset(self::ROLE_PERMISSIONS[$role]) &&
                in_array($permission, self::ROLE_PERMISSIONS[$role])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Vérifier l'accès avec exception si refusé
     */
    public function denyAccessUnlessGranted(string $permission, ?object $subject = null): void
    {
        if (!$this->hasPermission($permission)) {
            $this->logAccessDenied($permission, $subject);
            throw new AccessDeniedException(
                "Accès refusé. Permission requise : {$permission}"
            );
        }
    }

    /**
     * Vérifier si l'utilisateur peut accéder à une ressource spécifique
     */
    public function canAccessResource(string $resourceType, $resourceId, string $action = 'view'): bool
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return false;
        }

        return match($resourceType) {
            'user' => $this->canAccessUser($user, $resourceId, $action),
            'request' => $this->canAccessRequest($user, $resourceId, $action),
            'file' => $this->canAccessFile($user, $resourceId, $action),
            'admin' => $this->canAccessAdmin($user, $action),
            default => false
        };
    }

    /**
     * Vérifier l'accès à un autre utilisateur
     */
    private function canAccessUser(User $currentUser, $targetUserId, string $action): bool
    {
        // L'utilisateur peut toujours accéder à ses propres données
        if ($currentUser->getId() === $targetUserId) {
            return true;
        }

        // Vérifier les permissions selon l'action
        return match($action) {
            'view' => $this->userHasPermission($currentUser, 'user.view_list'),
            'edit' => $this->userHasPermission($currentUser, 'user.edit'),
            'delete' => $this->userHasPermission($currentUser, 'user.delete'),
            'moderate' => $this->userHasPermission($currentUser, 'user.moderate'),
            'impersonate' => $this->userHasPermission($currentUser, 'user.impersonate'),
            default => false
        };
    }

    /**
     * Vérifier l'accès à une demande
     */
    private function canAccessRequest(User $user, $requestId, string $action): bool
    {
        // Récupérer la demande pour vérifier le propriétaire
        $request = $this->entityManager->getRepository(\App\Entity\Request::class)->find($requestId);

        if (!$request) {
            return false;
        }

        // Le propriétaire peut accéder à ses propres demandes
        if ($request->getUser()?->getId() === $user->getId()) {
            return match($action) {
                'view', 'edit' => true,
                'delete' => $this->userHasPermission($user, 'request.delete_own'),
                default => false
            };
        }

        // Permissions pour les autres utilisateurs
        return match($action) {
            'view' => $this->userHasPermission($user, 'request.view_all'),
            'edit' => $this->userHasPermission($user, 'request.edit_all'),
            'assign' => $this->userHasPermission($user, 'request.assign'),
            'resolve' => $this->userHasPermission($user, 'request.resolve'),
            'moderate' => $this->userHasPermission($user, 'request.moderate'),
            default => false
        };
    }

    /**
     * Vérifier l'accès à un fichier
     */
    private function canAccessFile(User $user, $fileId, string $action): bool
    {
        $file = $this->entityManager->getRepository(\App\Entity\File::class)->find($fileId);

        if (!$file) {
            return false;
        }

        // Fichiers publics accessibles à tous
        if ($file->isPublic() && $action === 'view') {
            return true;
        }

        // Le propriétaire peut accéder à ses fichiers
        if ($file->getUser()?->getId() === $user->getId()) {
            return true;
        }

        // Permissions administratives
        return $this->userHasPermission($user, 'file.view_all');
    }

    /**
     * Vérifier l'accès à l'administration
     */
    private function canAccessAdmin(User $user, string $action): bool
    {
        return match($action) {
            'access' => $this->userHasPermission($user, 'admin.access'),
            'configure' => $this->userHasPermission($user, 'system.configure'),
            'maintenance' => $this->userHasPermission($user, 'system.maintenance'),
            default => false
        };
    }

    /**
     * Obtenir toutes les permissions d'un utilisateur
     */
    public function getUserPermissions(User $user): array
    {
        $permissions = [];
        $userRoles = $user->getRoles();

        foreach ($userRoles as $role) {
            if (isset(self::ROLE_PERMISSIONS[$role])) {
                $permissions = array_merge($permissions, self::ROLE_PERMISSIONS[$role]);
            }
        }

        return array_unique($permissions);
    }

    /**
     * Vérifier si un utilisateur peut être promu à un rôle
     */
    public function canPromoteToRole(User $promoter, string $targetRole): bool
    {
        // Seuls les admins peuvent gérer les rôles
        if (!$this->userHasPermission($promoter, 'user.manage_roles')) {
            return false;
        }

        // Les super admins peuvent tout faire
        if (in_array('ROLE_SUPER_ADMIN', $promoter->getRoles())) {
            return true;
        }

        // Les admins ne peuvent pas créer d'autres super admins
        if ($targetRole === 'ROLE_SUPER_ADMIN') {
            return false;
        }

        return true;
    }

    /**
     * Assigner un rôle à un utilisateur
     */
    public function assignRole(User $user, string $role): bool
    {
        try {
            $currentUser = $this->security->getUser();

            if (!$currentUser instanceof User) {
                throw new AccessDeniedException('Utilisateur non authentifié');
            }

            if (!$this->canPromoteToRole($currentUser, $role)) {
                throw new AccessDeniedException(
                    "Vous n'avez pas l'autorisation d'assigner le rôle {$role}"
                );
            }

            $roles = $user->getRoles();
            if (!in_array($role, $roles)) {
                $roles[] = $role;
                $user->setRoles($roles);
                $this->entityManager->flush();

                $this->logInfo('Role assigned', [
                    'target_user_id' => $user->getId(),
                    'assigned_role' => $role,
                    'assigned_by' => $currentUser->getId()
                ]);
            }

            return true;
        } catch (\Exception $e) {
            $this->logError('Role assignment failed', $e, [
                'target_user_id' => $user->getId(),
                'role' => $role
            ]);

            throw $e;
        }
    }

    /**
     * Retirer un rôle à un utilisateur
     */
    public function removeRole(User $user, string $role): bool
    {
        try {
            $currentUser = $this->security->getUser();

            if (!$currentUser instanceof User) {
                throw new AccessDeniedException('Utilisateur non authentifié');
            }

            if (!$this->userHasPermission($currentUser, 'user.manage_roles')) {
                throw new AccessDeniedException('Permission insuffisante');
            }

            // Empêcher la suppression du dernier ROLE_USER
            $roles = $user->getRoles();
            if ($role === 'ROLE_USER' && count($roles) === 1) {
                throw new \InvalidArgumentException(
                    'Impossible de supprimer le rôle ROLE_USER, c\'est le rôle minimal'
                );
            }

            $roles = array_filter($roles, fn($r) => $r !== $role);
            $user->setRoles($roles);
            $this->entityManager->flush();

            $this->logInfo('Role removed', [
                'target_user_id' => $user->getId(),
                'removed_role' => $role,
                'removed_by' => $currentUser->getId()
            ]);

            return true;
        } catch (\Exception $e) {
            $this->logError('Role removal failed', $e, [
                'target_user_id' => $user->getId(),
                'role' => $role
            ]);

            throw $e;
        }
    }

    /**
     * Vérifier les permissions en cascade selon la hiérarchie
     */
    public function checkHierarchicalPermission(string $permission): bool
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return false;
        }

        // Vérifier d'abord la permission directe
        if ($this->userHasPermission($user, $permission)) {
            return true;
        }

        // Vérifier les permissions héritées via la hiérarchie
        return $this->authorizationChecker->isGranted($permission);
    }

    /**
     * Logger les tentatives d'accès refusé
     */
    private function logAccessDenied(string $permission, ?object $subject): void
    {
        $user = $this->security->getUser();

        $this->logWarning('Access denied', [
            'user_id' => $user?->getId(),
            'permission' => $permission,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => method_exists($subject, 'getId') ? $subject->getId() : null,
            'user_roles' => $user instanceof User ? $user->getRoles() : []
        ]);
    }

    /**
     * Obtenir la liste des rôles disponibles
     */
    public function getAvailableRoles(): array
    {
        return [
            'ROLE_USER' => 'Utilisateur',
            'ROLE_MODERATOR' => 'Modérateur',
            'ROLE_SUPPORT' => 'Support',
            'ROLE_ANALYST' => 'Analyste',
            'ROLE_ADMIN' => 'Administrateur',
            'ROLE_SUPER_ADMIN' => 'Super Administrateur'
        ];
    }

    /**
     * Obtenir les permissions disponibles
     */
    public function getAvailablePermissions(): array
    {
        return [
            'profile.view' => 'Voir le profil',
            'profile.edit' => 'Modifier le profil',
            'request.create' => 'Créer une demande',
            'request.view_own' => 'Voir ses demandes',
            'request.view_all' => 'Voir toutes les demandes',
            'request.edit_own' => 'Modifier ses demandes',
            'request.assign' => 'Assigner les demandes',
            'request.resolve' => 'Résoudre les demandes',
            'user.view_list' => 'Voir la liste des utilisateurs',
            'user.view_details' => 'Voir les détails utilisateur',
            'user.edit' => 'Modifier les utilisateurs',
            'user.delete' => 'Supprimer les utilisateurs',
            'user.manage_roles' => 'Gérer les rôles',
            'user.moderate' => 'Modérer les utilisateurs',
            'user.impersonate' => 'Impersonaliser les utilisateurs',
            'file.upload' => 'Uploader des fichiers',
            'file.view_own' => 'Voir ses fichiers',
            'file.view_all' => 'Voir tous les fichiers',
            'analytics.view' => 'Voir les analytics',
            'report.generate' => 'Générer des rapports',
            'system.configure' => 'Configurer le système',
            'system.maintenance' => 'Maintenance système'
        ];
    }
}
```

## Voters Personnalisés

### UserVoter

```php
<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

final class UserVoter extends Voter
{
    public const VIEW = 'USER_VIEW';
    public const EDIT = 'USER_EDIT';
    public const DELETE = 'USER_DELETE';
    public const MODERATE = 'USER_MODERATE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE, self::MODERATE])
            && $subject instanceof User;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof UserInterface) {
            return false;
        }

        /** @var User $targetUser */
        $targetUser = $subject;

        return match($attribute) {
            self::VIEW => $this->canView($user, $targetUser),
            self::EDIT => $this->canEdit($user, $targetUser),
            self::DELETE => $this->canDelete($user, $targetUser),
            self::MODERATE => $this->canModerate($user, $targetUser),
            default => false
        };
    }

    private function canView(UserInterface $user, User $targetUser): bool
    {
        // Un utilisateur peut voir son propre profil
        if ($user->getUserIdentifier() === $targetUser->getEmail()) {
            return true;
        }

        // Les modérateurs et admins peuvent voir les autres utilisateurs
        return $this->hasRole($user, ['ROLE_MODERATOR', 'ROLE_ADMIN']);
    }

    private function canEdit(UserInterface $user, User $targetUser): bool
    {
        // Un utilisateur peut modifier son propre profil
        if ($user->getUserIdentifier() === $targetUser->getEmail()) {
            return true;
        }

        // Seuls les admins peuvent modifier les autres utilisateurs
        return $this->hasRole($user, ['ROLE_ADMIN']);
    }

    private function canDelete(UserInterface $user, User $targetUser): bool
    {
        // Impossible de se supprimer soi-même
        if ($user->getUserIdentifier() === $targetUser->getEmail()) {
            return false;
        }

        // Seuls les admins peuvent supprimer
        if (!$this->hasRole($user, ['ROLE_ADMIN'])) {
            return false;
        }

        // Un admin ne peut pas supprimer un super admin
        if (in_array('ROLE_SUPER_ADMIN', $targetUser->getRoles())) {
            return $this->hasRole($user, ['ROLE_SUPER_ADMIN']);
        }

        return true;
    }

    private function canModerate(UserInterface $user, User $targetUser): bool
    {
        // Les modérateurs peuvent modérer les utilisateurs normaux
        if ($this->hasRole($user, ['ROLE_MODERATOR'])) {
            return !$this->hasRole($targetUser, ['ROLE_ADMIN', 'ROLE_MODERATOR']);
        }

        // Les admins peuvent modérer tous sauf les super admins
        if ($this->hasRole($user, ['ROLE_ADMIN'])) {
            return !$this->hasRole($targetUser, ['ROLE_SUPER_ADMIN']);
        }

        return false;
    }

    private function hasRole(UserInterface $user, array $roles): bool
    {
        if (!$user instanceof User) {
            return false;
        }

        return !empty(array_intersect($roles, $user->getRoles()));
    }
}
```

### RequestVoter

```php
<?php

namespace App\Security\Voter;

use App\Entity\Request;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

final class RequestVoter extends Voter
{
    public const VIEW = 'REQUEST_VIEW';
    public const EDIT = 'REQUEST_EDIT';
    public const DELETE = 'REQUEST_DELETE';
    public const ASSIGN = 'REQUEST_ASSIGN';
    public const RESOLVE = 'REQUEST_RESOLVE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE, self::ASSIGN, self::RESOLVE])
            && $subject instanceof Request;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var Request $request */
        $request = $subject;

        return match($attribute) {
            self::VIEW => $this->canView($user, $request),
            self::EDIT => $this->canEdit($user, $request),
            self::DELETE => $this->canDelete($user, $request),
            self::ASSIGN => $this->canAssign($user, $request),
            self::RESOLVE => $this->canResolve($user, $request),
            default => false
        };
    }

    private function canView(User $user, Request $request): bool
    {
        // Le propriétaire peut voir sa demande
        if ($request->getUser()?->getId() === $user->getId()) {
            return true;
        }

        // Support et admins peuvent voir toutes les demandes
        return $this->hasRole($user, ['ROLE_SUPPORT', 'ROLE_ADMIN']);
    }

    private function canEdit(User $user, Request $request): bool
    {
        // Le propriétaire peut modifier sa demande si elle n'est pas fermée
        if ($request->getUser()?->getId() === $user->getId()) {
            return !in_array($request->getStatus(), ['resolved', 'closed']);
        }

        // Support et admins peuvent modifier les demandes
        return $this->hasRole($user, ['ROLE_SUPPORT', 'ROLE_ADMIN']);
    }

    private function canDelete(User $user, Request $request): bool
    {
        // Le propriétaire peut supprimer sa demande si elle est en attente
        if ($request->getUser()?->getId() === $user->getId()) {
            return $request->getStatus() === 'pending';
        }

        // Seuls les admins peuvent supprimer les demandes des autres
        return $this->hasRole($user, ['ROLE_ADMIN']);
    }

    private function canAssign(User $user, Request $request): bool
    {
        // Seuls support et admins peuvent assigner
        return $this->hasRole($user, ['ROLE_SUPPORT', 'ROLE_ADMIN']);
    }

    private function canResolve(User $user, Request $request): bool
    {
        // Support et admins peuvent résoudre
        if ($this->hasRole($user, ['ROLE_SUPPORT', 'ROLE_ADMIN'])) {
            return true;
        }

        // L'utilisateur assigné peut résoudre
        return $request->getAssignedTo() === $user->getUsername();
    }

    private function hasRole(User $user, array $roles): bool
    {
        return !empty(array_intersect($roles, $user->getRoles()));
    }
}
```

## Contrôle d'Accès dans les Contrôleurs

### Exemples d'utilisation

```php
<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\AuthorizationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/users')]
#[IsGranted('ROLE_ADMIN')]
final class UserManagementController extends AbstractController
{
    public function __construct(
        private AuthorizationService $authorizationService
    ) {}

    #[Route('/', name: 'admin_users_list')]
    public function list(): Response
    {
        // Vérification automatique via IsGranted sur la classe
        return $this->render('admin/users/list.html.twig');
    }

    #[Route('/{id}/edit', name: 'admin_users_edit')]
    public function edit(User $user): Response
    {
        // Vérification avec voter personnalisé
        $this->denyAccessUnlessGranted('USER_EDIT', $user);

        return $this->render('admin/users/edit.html.twig', [
            'user' => $user
        ]);
    }

    #[Route('/{id}/delete', name: 'admin_users_delete')]
    public function delete(User $user): Response
    {
        // Vérification avec voter et permission
        $this->denyAccessUnlessGranted('USER_DELETE', $user);
        $this->authorizationService->denyAccessUnlessGranted('user.delete');

        // Logique de suppression...

        return $this->redirectToRoute('admin_users_list');
    }

    #[Route('/{id}/roles', name: 'admin_users_manage_roles')]
    public function manageRoles(User $user): Response
    {
        // Vérification de permission spécifique
        $this->authorizationService->denyAccessUnlessGranted('user.manage_roles');

        return $this->render('admin/users/roles.html.twig', [
            'user' => $user,
            'available_roles' => $this->authorizationService->getAvailableRoles(),
            'can_promote_super_admin' => $this->authorizationService
                ->canPromoteToRole($this->getUser(), 'ROLE_SUPER_ADMIN')
        ]);
    }
}
```

## Contrôle d'Accès dans les Templates

### Extensions Twig pour les autorisations

```php
<?php

namespace App\Twig;

use App\Service\AuthorizationService;
use Symfony\Component\Security\Core\Security;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

final class AuthorizationExtension extends AbstractExtension
{
    public function __construct(
        private AuthorizationService $authorizationService,
        private Security $security
    ) {}

    public function getFunctions(): array
    {
        return [
            new TwigFunction('has_permission', [$this, 'hasPermission']),
            new TwigFunction('can_access_resource', [$this, 'canAccessResource']),
            new TwigFunction('user_permissions', [$this, 'getUserPermissions']),
            new TwigFunction('available_roles', [$this, 'getAvailableRoles']),
        ];
    }

    public function hasPermission(string $permission): bool
    {
        return $this->authorizationService->hasPermission($permission);
    }

    public function canAccessResource(string $resourceType, $resourceId, string $action = 'view'): bool
    {
        return $this->authorizationService->canAccessResource($resourceType, $resourceId, $action);
    }

    public function getUserPermissions(): array
    {
        $user = $this->security->getUser();
        return $user ? $this->authorizationService->getUserPermissions($user) : [];
    }

    public function getAvailableRoles(): array
    {
        return $this->authorizationService->getAvailableRoles();
    }
}
```

### Utilisation dans les templates

```twig
{# templates/admin/users/list.html.twig #}
<div class="user-actions">
    {% if has_permission('user.edit') %}
        <a href="{{ path('admin_users_edit', {id: user.id}) }}" class="btn btn-primary">
            Modifier
        </a>
    {% endif %}

    {% if has_permission('user.delete') and is_granted('USER_DELETE', user) %}
        <button class="btn btn-danger" onclick="deleteUser({{ user.id }})">
            Supprimer
        </button>
    {% endif %}

    {% if has_permission('user.manage_roles') %}
        <a href="{{ path('admin_users_manage_roles', {id: user.id}) }}" class="btn btn-info">
            Gérer les rôles
        </a>
    {% endif %}
</div>

{# Affichage conditionnel selon les permissions #}
{% if can_access_resource('user', user.id, 'view') %}
    <div class="user-details">
        <h3>{{ user.username }}</h3>
        <p>Email: {{ user.email }}</p>

        {% if has_permission('user.view_details') %}
            <p>Dernière connexion: {{ user.lastLoginAt|date }}</p>
            <p>Rôles: {{ user.roles|join(', ') }}</p>
        {% endif %}
    </div>
{% endif %}

{# Menu de navigation adaptatif #}
<nav class="admin-nav">
    {% if has_permission('user.view_list') %}
        <a href="{{ path('admin_users_list') }}">Utilisateurs</a>
    {% endif %}

    {% if has_permission('request.view_all') %}
        <a href="{{ path('admin_requests_list') }}">Demandes</a>
    {% endif %}

    {% if has_permission('analytics.view') %}
        <a href="{{ path('admin_analytics') }}">Analytics</a>
    {% endif %}

    {% if has_permission('system.configure') %}
        <a href="{{ path('admin_settings') }}">Configuration</a>
    {% endif %}
</nav>
```

## Middleware de Contrôle d'Accès

### AccessControlMiddleware

```php
<?php

namespace App\EventListener;

use App\Service\AuthorizationService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Psr\Log\LoggerInterface;

final class AccessControlListener implements EventSubscriberInterface
{
    public function __construct(
        private AuthorizationService $authorizationService,
        private LoggerInterface $logger
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::CONTROLLER => 'onKernelController'
        ];
    }

    public function onKernelController(ControllerEvent $event): void
    {
        $controller = $event->getController();
        $request = $event->getRequest();

        // Vérifications personnalisées pour certaines routes
        $route = $request->attributes->get('_route');

        if (str_starts_with($route, 'admin_')) {
            $this->checkAdminAccess($request);
        }

        if (str_starts_with($route, 'api_')) {
            $this->checkApiAccess($request);
        }
    }

    private function checkAdminAccess($request): void
    {
        if (!$this->authorizationService->hasPermission('admin.access')) {
            $this->logger->warning('Unauthorized admin access attempt', [
                'route' => $request->attributes->get('_route'),
                'ip' => $request->getClientIp()
            ]);

            throw new AccessDeniedException('Accès administrateur requis');
        }
    }

    private function checkApiAccess($request): void
    {
        // Vérifications spécifiques pour l'API
        $route = $request->attributes->get('_route');

        if (str_contains($route, 'admin')) {
            $this->checkAdminAccess($request);
        }
    }
}
```

Ce système d'autorisation complet permet un contrôle d'accès granulaire et sécurisé, avec une séparation claire entre les rôles, permissions et ressources, tout en conservant la flexibilité nécessaire pour des besoins d'autorisation complexes.
