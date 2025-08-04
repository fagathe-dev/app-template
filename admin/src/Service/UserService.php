<?php

namespace Admin\Service;

use Admin\Service\UserEmailService;
use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserRequestService;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Helpers\Request\ResponseTrait;
use Fagathe\Libs\Helpers\Token\Token;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Fagathe\Libs\Utils\UserRequestEnum;
use Knp\Component\Pager\Pagination\PaginationInterface;
use Knp\Component\Pager\PaginatorInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class UserService
{

    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'admin/service/user';

    private Finder $finder;

    public function __construct(
        private readonly UrlGeneratorInterface $urlGenerator,
        private readonly UserRepository $repository,
        private readonly Security $security,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
        private readonly PaginatorInterface $paginator,
        private readonly UserRequestService $userRequestService,
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly UserEmailService $userEmailService,

    ) {
        $this->finder = new Finder();
    }


    /**
     * @param User $user
     * 
     * @return void
     */
    public function create(User $user)
    {
        $password = (new Token)->generate(30);
        $user = $this->hashPassword($user->setPassword($password));
        $this->save($user, true);

        $this->userRequestService->create(
            user: $user,
            type: UserRequestEnum::ACCOUNT_ADMIN_CREATION_REQUEST,
            data: [
                'password' => $password,
            ],
        );
    }

    /**
     * @param Request $request
     * @param User $user
     * 
     * @return object
     */
    public function update(Request $request, User $user): object
    {
        $payload = json_decode($request->getContent(), true);
        $action = ($payload['q'] ?? null) ?? $request->request->get('q', null) ?? $request->request->get('q', null);

        if (!$action) {
            $this->generateLog(
                ['message' => 'No action specified for user update', 'data' => $payload],
                ['action' => __METHOD__, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Error
            );

            // If no action is specified, return a bad request response
            // This is to ensure that the user is aware that an action must be specified
            return $this->sendViolations(
                ['message' => 'Aucune action sur l\'utilisateur.'],
            );
        }

        try {
            // Handle the action based on the request
            // This is a switch-case or match-case structure to handle different actions
            /**
             * @var object $response
             * @throws \Exception
             */
            $response = match ($action) {
                'update-user-infos' => $this->updateUserInfo($request, $user),
                // 'generate-api-token' => $this->userRequestService->generateApiToken($user),
                // 'reset-password' => $this->userRequestService->changePassword($request, $user),
                'change-role' => $this->updateUserRoles($payload, $user),
                // 'toggle-active' => $this->userRequestService->toggleActive($user),
                default => null,
            };
        } catch (\Throwable $th) {
            $this->generateLog(
                ['exception' => $th->getMessage(), 'data' => $payload],
                ['action' => __METHOD__ . ' ' . $action, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Error
            );

            return $this->sendViolations(
                violations: ['exception' => 'Une erreur est survenue lors de la mise à jour de l\'utilisateur.'],
            );
        }

        $this->generateLog(
            ['message' => 'User updated successfully', 'data' => $payload],
            ['action' => __METHOD__ . ' ' . $action, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
            LoggerLevelEnum::Debug
        );

        return $response;
    }

    private function updateUserRoles(array $payload, User $user): object
    {
        $role = $payload['role'] ?? null;
        if ($role !== null) {
            
            if (is_string($role)) {
                $role = RoleEnum::tryFrom($role);
            }
            
            
            if ($role instanceof RoleEnum && in_array($role, RoleEnum::cases())) {
                $user->setRoles([$role->value]);
                $this->save($user);
                
                $this->generateLog(
                    content: [
                        'message' => 'Le role de l\'utilisateur `' . $user->getUserIdentifier() . '` a été mis à jour, nouveau rôle ' . RoleEnum::matchLabel($role),
                        'data' => compact('user'),
                    ],
                    context: ['action' => __METHOD__, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
                    level: LoggerLevelEnum::Debug
                );

                // Envoie d'un email de notification du changement de rôle
                $this->userEmailService->sendChangeRoleEmail($user);

                return $this->sendJson(
                    data: [
                        'message' => 'Le rôle de l\'utilisateur a été mis à jour avec succès.',
                        'user' => $user,
                    ],
                );
            }

            $this->generateLog(
                content: [
                    'message' => 'Le rôle envoyé est invalide pour l\'utilisateur `' . $user->getUserIdentifier() . '`',
                    'data' => compact('role'),
                ],
                context: ['action' => __METHOD__, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
                level: LoggerLevelEnum::Error
            );
            return $this->sendViolations(
                violations: ['roles' => 'Le rôle envoyé est invalide.']
            );
        }

        $this->generateLog(
            content: [
                'message' => 'Aucun rôle envoyé pour l\'utilisateur `' . $user->getUserIdentifier() . '`',
                'data' => compact('role'),
            ],
            context: ['action' => __METHOD__, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
            level: LoggerLevelEnum::Error
        );
        return $this->sendViolations(
            violations: ['roles' => 'Aucun rôle envoyé pour l\'utilisateur `' . $user->getUserIdentifier() . '`',]
        );
    }

    /**
     * @param Request $request
     * @param User $user
     * 
     * @return object
     */
    private function updateUserInfo(Request $request, User $user): object
    {
        $data = $request->getContent();
        $user = $this->serializer->deserialize($data, User::class, 'json', [
            'object_to_populate' => $user,
        ]);

        $errors = $this->validator->validate($user);

        if (count($errors) > 0) {

            $this->generateLog(
                ['exception' => 'Validation errors occurred', 'data' => $this->filterViolations($errors)],
                ['action' => __METHOD__, 'uid' => $this->getUser()?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Error
            );

            return $this->sendViolations($errors);
        }

        $this->save($user);

        return $this->sendJson(
            data: [
                'message' => 'L\'utilisateur `' . $user->getUserIdentifier() . '` a été mis à jour avec succès.',
                'user' => $user,
            ],
        );
    }

    /**
     * @param User $user
     * 
     * @return array
     */
    public function edit(User $user): array
    {
        $breadcrumb = $this->breadcrumb([
            new BreadcrumbItem('Éditer un utilisateur', $this->urlGenerator->generate('admin_user_edit', ['id' => $user->getId()]))
        ]);
        $userRoles = RoleEnum::choices(boolFlip: false);

        return compact('user', 'breadcrumb', 'userRoles');
    }

    /**
     * @param  mixed $request
     * @return PaginationInterface
     */
    public function getUsers(Request $request): PaginationInterface
    {

        $data = $this->repository->findAll(); #findUsersAdmin();
        $page = $request->query->getInt('page', 1);
        $nbItems = $request->query->getInt('nbItems', 10);

        return $this->paginator->paginate(
            $data,
            /* query NOT result */
            $page,
            /*page number*/
            $nbItems, /*limit per page*/
        );
    }

    /**
     * @param Request $request
     * 
     * @return array
     */
    public function index(Request $request): array
    {
        $breadcrumb = $this->breadcrumb();
        $paginatedUsers = $this->getUsers($request);

        return compact('paginatedUsers', 'breadcrumb');
    }

    /**
     * @return User|null
     */
    private function getUser(): ?User
    {
        $user = $this->security->getUser();

        if ($user instanceof User) {
            return $user;
        }

        return null;
    }

    /**
     * @param User $user
     * 
     * @return User
     */
    private function hashPassword(User $user): User
    {
        return $user->setPassword($this->passwordHasher->hashPassword($user,  $user->getPassword()));
    }

    /**
     * @param User $user
     * @param bool $boolCreate
     * 
     * @return bool
     */
    private function save(User $user, bool $boolCreate = false): bool
    {
        $now = $this->now();
        if ($boolCreate) {
            $user->setRegisteredAt($now)
                ->setIdentifier($user->getEmail())
            ;
            $user = $this->hashPassword($user);
        } else {
            $user->setUpdatedAt($now);
        }

        $username = $user?->getUserIdentifier() ?? 'anonymous';
        $creator = $this->getUser()?->getUserIdentifier();

        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();

            $result = true;
        } catch (\Throwable $th) {
            $this->generateLog(
                ['exception' => $th->getMessage()],
                ['action' => __METHOD__, 'uid' => $creator],
                LoggerLevelEnum::Error,
            );

            return false;
        }

        $message =  'L\' utilisateur `' . $username . '` a été ' . ($boolCreate ? 'crée' : 'mis à jour') . ' par ' . $creator;

        $this->generateLog(
            ['message' => $message],
            ['action' => __METHOD__, 'uid' => $creator ?? 'anonymous'],
            LoggerLevelEnum::Debug,
        );

        return $result;
    }

    /**
     * @param BreadcrumbItem[] $items 
     * 
     * @return Breadcrumb
     */
    public function breadcrumb(array $items = []): Breadcrumb
    {
        $breadcrumb = new Breadcrumb([
            new BreadcrumbItem(
                'Liste des utilisateurs',
                $this->urlGenerator->generate('admin_user_index'),
            ),
            ...$items
        ]);

        return $breadcrumb;
    }

    /**
     * @param User $user
     * 
     * @return void
     */
    public function delete(User $user): void
    {
        $creator = $this->getUser()?->getUserIdentifier() ?? 'anonymous';

        try {
            $this->entityManager->remove($user);
            $this->entityManager->flush();
        } catch (\Throwable $th) {
            $this->generateLog(
                ['exception' => $th->getMessage()],
                ['action' => __METHOD__, 'uid' => $creator],
                LoggerLevelEnum::Error,
            );
            return;
        }

        $message = 'L\'utilisateur `' . $user->getUserIdentifier() . '` a été supprimé par ' . $creator;

        $this->generateLog(
            ['message' => $message],
            ['action' => __METHOD__, 'uid' => $creator],
            LoggerLevelEnum::Debug,
        );
    }


    /**
     * @param array $content
     * @param array $context
     * @param LoggerLevelEnum $level
     * 
     * @return void
     */
    private function generateLog(array $content, array $context = [], LoggerLevelEnum $level = LoggerLevelEnum::Error): void
    {
        $logger = new Logger(static::LOG_FILE);
        $logger->log($level, $content, $context);
    }
}
