<?php

namespace Admin\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Logger\JsonLogService;
use Fagathe\Libs\Logger\Log;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpKernel\KernelInterface;
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

    ) {
        $this->finder = new Finder();
    }


    public function add(User $user) {}

    private function getUser(): ?User
    {
        $user = $this->security->getUser();

        if ($user instanceof User) {
            return $user;
        }

        return null;
    }

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
    private function save(User $user, bool $boolCreate): bool
    {
        $now = $this->now();
        if ($boolCreate) {
            $user->setRegisteredAt($now)
                ->setActive(true)
                ->setIdentifier($user->getEmail())
            ;
            $user = $this->hashPassword($user);
        } else {
            $user->setUpdatedAt($now);
        }
        
        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();

            $result = true;
        } catch (\Throwable $th) {
            $this->generateLog(
                ['exception' => $th->getMessage()],
                ['action' => __METHOD__, 'uid' => $user?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Error,
            );
            $result = false;
        }
        
        if ($boolCreate) {
            $this->generateLog(
                ['message' => 'Un nouvel utilisateur à été crée par `' . $user->getUserIdentifier() . '`'],
                ['action' => __METHOD__, 'uid' => $user?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Debug,
            );
        } else {
            $this->generateLog(
                ['message' => 'Un nouvel utilisateur à été crée par `' . $user->getUserIdentifier() . '`'],
                ['action' => __METHOD__, 'uid' => $user?->getUserIdentifier() ?? 'anonymous'],
                LoggerLevelEnum::Debug,
            );
        }

        return $result;
    }

    /**
     * @param BreadcrumbItem[] $items 
     * 
     * @return Breadcrumb
     */
    private function breadcrumb(array $items = []): Breadcrumb
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
