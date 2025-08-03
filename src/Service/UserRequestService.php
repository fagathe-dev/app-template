<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserRequest;
use App\Repository\UserRepository;
use App\Repository\UserRequestRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Helpers\Request\NativeSession;
use Fagathe\Libs\Helpers\Request\ResponseTrait;
use Fagathe\Libs\Helpers\Token\Token;
use Fagathe\Libs\Logger\Log;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Fagathe\Libs\Utils\Mailer\MailerService;
use Fagathe\Libs\Utils\UserRequestEnum;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class UserRequestService
{

    use DateTimeTrait, ResponseTrait;

    private const LOG_FILE = 'service/user-request';
    private NativeSession $session;
    public const VERIFICATION_REDIRECT_ROUTE_NAME = 'auth_verification_index';

    public function __construct(
        private readonly UrlGeneratorInterface $urlGenerator,
        private readonly UserRequestRepository $repository,
        private readonly UserRepository $userRepository,
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        private readonly MailerService $mailer,
        private readonly UserService $userService,
    ) {
        $this->session = new NativeSession();
    }

    /**
     * @param User $user
     * 
     * @return void
     */
    public function create(User $user, UserRequestEnum $type, string $expiredTime = '15 minutes', array $data = []): void
    {
        $token = (new Token)->generate(30);
        $userRequest = (new UserRequest())
            ->setUser($user)
            ->setType($type->value)
            ->setToken($token)
            ->setExpiredAt($this->now()->modify('+' . $expiredTime));

        $this->save($userRequest, true);

        $data = [...$data, ...compact('token')];

        // Send the email based on the request type
        match ($type) {
            UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST => $this->sendUserAccountActivationEmail($userRequest, $data),
            UserRequestEnum::ACCOUNT_ADMIN_CREATION_REQUEST => $this->sendUserCreationAdminEmail($userRequest, $data),
            default => null,
        };
    }


    /**
     * @param array $data
     * 
     * @return bool
     */
    public function userRequestVerificationEmail(array $data): bool
    {
        $email = $data['email'] ?? null;
        // Get the logged user
        $user = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user instanceof User) {
            $errorMsg = sprintf('Aucun utilisateur trouvé avec l\'adresse e-mail %s.', $email);
            $this->generateLog(
                content: ['message' => $errorMsg],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Info
            );
            $this->addFlash('danger', $errorMsg);

            return false;
        }

        $this->create($user, UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST);
        $this->addFlash('success', 'Un e-mail de vérification a été envoyé à l\'adresse saisie. Veuillez vérifier votre boîte e-mail.');

        return false;
    }

    /**
     * @param User $user
     * 
     * @return void
     */
    private function sendUserAccountActivationEmail(UserRequest $userRequest, array $data = []): void
    {
        $user = $userRequest->getUser();
        $token = $userRequest->getToken();

        try {
            $this->mailer->sendEmail(
                recepient: [$user->getUsername() => $user->getEmail()],
                subject: 'Vérification de votre compte ' . APP_NAME,
                template: 'auth/verify-account',
                context: [
                    'user' => [
                        'name' => $user->getUsername(),
                        'email' => $user->getEmail(),
                        'username' => $user->getUsername(),
                    ],
                    'activation_link' => $this->urlGenerator->generate(
                        'auth_request_verification_verify',
                        compact('token'),
                        UrlGeneratorInterface::ABSOLUTE_URL
                    ),
                ]
            );

            $this->generateLog(
                content: ['message' => 'Account activation email sent', 'user' => $user->getUserIdentifier()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Info
            );
        } catch (\Exception $e) {
            $this->generateLog(
                content: ['exception' => $e->getMessage(), 'user' => $user->getUserIdentifier()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw $e;
        }
    }

    /**
     * @param UserRequest $userRequest
     * @param array $data
     * 
     * @return void
     */
    private function sendUserCreationAdminEmail(UserRequest $userRequest, array $data): void
    {
        $user = $userRequest->getUser();

        try {
            $this->mailer->sendEmail(
                recepient: [$user->getUsername() => $user->getEmail()],
                subject: 'Création de votre compte ' . APP_NAME,
                template: 'admin/user/create-account',
                context: [
                    'user' => [
                        'name' => $user->getUsername(),
                        'email' => $user->getEmail(),
                        'username' => $user->getUsername(),
                        'password' => $data['password'] ?? 'N/A',
                    ],
                    'activation_link' => $this->urlGenerator->generate(
                        'auth_request_verification_verify',
                        ['token' => $userRequest->getToken()],
                        UrlGeneratorInterface::ABSOLUTE_URL
                    ),
                ]
            );

            $this->generateLog(
                content: ['message' => 'Admin creation email sent', 'user' => $user->getUserIdentifier()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Info
            );
        } catch (\Exception $e) {
            $this->generateLog(
                content: ['exception' => $e->getMessage(), 'user' => $user->getUserIdentifier()],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            throw $e;
        }
    }

    /**
     * @param UserRequest $userRequest
     * 
     * @return bool
     */
    public function save(UserRequest $userRequest, bool $boolCreate = false): bool
    {
        $now = $this->now();
        if ($boolCreate) {
            $userRequest->setCreatedAt($now)
                ->setIsOpen(true);
        } else {
            $userRequest->setUpdatedAt($now);
        }

        $user = $userRequest->getUser();
        $username = $user?->getUserIdentifier() ?? 'anonymous';
        $creator = $this->getUser()?->getUserIdentifier();

        try {
            $this->entityManager->persist($userRequest);
            $this->entityManager->flush();

            $message =  'La requête de l\'utilisateur pour `' . $username . '` de type `' . $userRequest->getType() . '` a été ' . ($boolCreate ? 'crée' : 'mis à jour') . ($boolCreate ? ' par ' . $creator . '.' : '.');

            $this->generateLog(
                ['message' => $message],
                ['action' => __METHOD__, 'uid' => $creator ?? 'anonymous'],
                LoggerLevelEnum::Debug,
            );

            $result = true;
        } catch (\Throwable $th) {
            $this->generateLog(
                ['exception' => $th->getMessage()],
                ['action' => __METHOD__, 'uid' => $creator],
                LoggerLevelEnum::Error,
            );

            return false;
        }

        return $result;
    }

    /**
     * @param string $token
     * 
     * @return bool
     */
    public function userRequestVerification(string $token): bool
    {
        // Find the user request by token
        $userRequest = $this->repository->findOneBy(['token' => $token]);
        $requestType = UserRequestEnum::tryFrom($userRequest?->getType());

        // Chack if the request type is valid
        if ($requestType === null || !$requestType->isValid()) {
            // Log and flash message for invalid request type
            $this->generateLog(
                content: ['message' => 'Type de demande invalide.', 'data' => ['type' => $userRequest?->getType()]],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Error
            );
            $this->addFlash('danger', 'Type de demande invalide.');

            return false;
        }


        if ($userRequest instanceof UserRequest && $userRequest->isOpen()) {

            // Activate the user account
            if (!$userRequest->getUser()) {
                $this->generateLog(
                    content: ['message' => 'Aucun utilisateur associé à cette demande d\'activation.'],
                    context: ['action' => __METHOD__],
                    level: LoggerLevelEnum::Info
                );
                $this->addFlash('danger', 'Aucun utilisateur associé à cette demande d\'activation.');

                return false;
            }

            if ($this->isDatePast($userRequest->getExpiredAt())) {
                $this->generateLog(
                    content: ['message' => 'La demande d\'activation a expiré.'],
                    context: ['action' => __METHOD__],
                    level: LoggerLevelEnum::Info
                );

                $link = $this->urlGenerator->generate(
                    'auth_verification_index',
                );

                $this->addFlash('warning', 'La demande d\'activation a expiré. Veuillez en faire une nouvelle en <a href="' . $link . '">cliquant ici</a>.');

                return false;
            }

            match ($userRequest->getType()) {
                UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value, UserRequestEnum::ACCOUNT_ADMIN_CREATION_REQUEST->value => $this->userService->activate($userRequest),
                default => false,
            };

            $this->closeUserRequest($userRequest);

            return true;
        }

        return false;
    }

    /**
     * @param UserRequest $userRequest
     * 
     * @return bool
     */
    private function closeUserRequest(UserRequest $userRequest): bool
    {
        $user = $userRequest->getUser();
        // Close the request
        $userRequest->setIsOpen(false)
            ->setUpdatedAt($this->now());
        $this->save($userRequest);

        $this->generateLog(
            content: ['message' => sprintf('Le compte utilisateur de `%s` a été activé avec succès.', $user->getUserIdentifier())],
            context: ['action' => __METHOD__],
            level: LoggerLevelEnum::Info
        );

        return true;
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
