<?php

namespace Admin\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserRequestService;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Helpers\DateTimeTrait;
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
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class UserService
{

    use DateTimeTrait;

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
