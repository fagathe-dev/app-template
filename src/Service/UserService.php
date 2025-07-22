<?php

namespace App\Service;

use App\Entity\UserRequest;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Exception\ORMException;
use Exception;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Helpers\Request\NativeSession;
use Fagathe\Libs\Helpers\Request\ResponseTrait;
use Fagathe\Libs\Helpers\Token\Token;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Fagathe\Libs\Utils\Mailer\Email;
use Fagathe\Libs\Utils\Mailer\MailerService;
use Fagathe\Libs\Utils\UserRequestEnum;
use Fagathe\Phplib\Service\Breadcrumb\Breadcrumb;
use Fagathe\Phplib\Service\Breadcrumb\BreadcrumbItem;
use Knp\Component\Pager\Pagination\PaginationInterface;
use Knp\Component\Pager\PaginatorInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class UserService
{

    use ResponseTrait;
    use DateTimeTrait;

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
     * update
     *
     * @param  mixed $user
     * @return bool
     */
    public function update(User $user): bool
    {
        $user->setUpdatedAt($this->now());
        $result = $this->save($user);

        if ($result) {
            $this->addFlash('success', 'Utilisateur enregistré 🚀');
        } else {
            $this->addFlash('danger', 'Une erreur est survenue lors de l\'enregistrement de ce compte !');
        }

        return $result;
    }

    /**
     * hash
     *
     * @param  mixed $user
     * @return User
     */
    private function hash(User $user): User
    {
        return $user->setPassword(
            $this->hasher->hashPassword($user, $user->getPassword())
        );
    }

    /**
     * create
     *
     * @param  mixed $user
     * @return bool
     */
    public function create(User $user): bool
    {
        $user->setRegisteredAt($this->now())
            ->setIdentifier($user->getEmail());
        $this->hash($user);

        $result = $this->save($user);

        if ($result) {
            $this->addFlash('success', 'Utilisateur crée 🚀');
        } else {
            $this->addFlash('danger', 'Une erreur est survenue lors de l\'enregistrement de ce compte !');
        }

        return $result;
    }

    /**
     * save
     *
     * @param  User $user
     * @param bool $boolCreate
     * 
     * @return bool
     */
    public function save(User $user, bool $boolCreate = false): bool
    {
        $now = $this->now();
        if ($boolCreate) {
            $user->setRegisteredAt($now)
                ->setIdentifier($user->getEmail())
            ;
        } else {
            $user->setUpdatedAt($now);
        }

        $username = $user?->getUserIdentifier() ?? 'anonymous';
        $creator = $this->getUser()?->getUserIdentifier();

        try {
            $this->manager->persist($user);
            $this->manager->flush();

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
     * remove
     *
     * @param  User $object
     * @return object|bool
     */
    public function remove(User $user): bool|object
    {
        try {
            $this->manager->remove($user);
            $this->manager->flush();
            $this->generateLog(
                content: ['message' => sprintf('L\'utilisateur %s a été supprimé avec succès.', $user->getUsername())],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Info
            );
            return $this->sendNoContent();
        } catch (ORMException $e) {
            $this->generateLog(
                content: ['exception' => 'Une erreur est survenue lors de la suppression de votre compte :' . $e->getMessage()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            return false;
        } catch (Exception $e) {
            $this->generateLog(
                content: ['exception' => 'Une erreur est survenue lors de la suppression de votre compte :' . $e->getMessage()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            return false;
        }
    }

    /**
     * @param UserRequest $userRequest
     * 
     * @return bool
     */
    public function activate(UserRequest $userRequest): bool
    {
        $session = new NativeSession();
        $session->set(UserRequestService::VERIFICATION_REDIRECT_ROUTE_NAME, $this->urlGenerator->generate('auth_login'));
        dd($this->urlGenerator->generate('auth_login'));


        $user = $userRequest->getUser();
        $user->setActive(true)
            ->setUpdatedAt($this->now());
        return $this->save($user, false);
    }
    /**
     * @param string $plainPassword
     * @param User $user
     * 
     * @return bool
     */
    public function updatePassword(string $plainPassword, User $user): bool
    {
        $user->setPassword(
            $this->hasher->hashPassword($user, $plainPassword)
        );



        return $this->update($user);
    }

    /**
     * @param  mixed $request
     * @return PaginationInterface
     */
    public function getUsers(Request $request): PaginationInterface
    {

        $data = $this->repository->findAll(); #findUsersAdmin();
        $page = $request->query->getInt('page', 1);
        $nbItems = $request->query->getInt('nbItems', 15);

        return $this->paginator->paginate(
            $data,
            /* query NOT result */
            $page,
            /*page number*/
            $nbItems, /*limit per page*/
        );
    }

    /**
     * get logged User
     *
     * @return User
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
     * @param array $content
     * @param array $context
     * @param LoggerLevelEnum $level
     * 
     * @return void
     */
    private function generateLog(array $content, array $context = [], LoggerLevelEnum $level = LoggerLevelEnum::Error): void
    {
        $logger = new Logger(self::LOG_FILE);
        $logger->log($level, $content, $context);
    }
}
