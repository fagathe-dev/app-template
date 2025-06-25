<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserRequest;
use App\Repository\UserRepository;
use App\Repository\UserRequestRepository;
use App\Service\UserService;
use Doctrine\ORM\EntityManagerInterface;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Helpers\Request\ResponseTrait;
use Fagathe\Libs\Helpers\Token\Token;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Fagathe\Libs\Utils\Mailer\Email;
use Fagathe\Libs\Utils\Mailer\MailerService;
use Fagathe\Libs\Utils\UserRequestEnum;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

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
        private UrlGeneratorInterface $urlGenerator,
        private EntityManagerInterface $manager
    ) {}

    /**
     * @param array $data
     * 
     * @return bool
     */
    public function verificationIndex(array $data): bool
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

        $this->sendVerificationEmail($user);
        $this->addFlash('success', 'Un e-mail de vérification a été envoyé à l\'adresse saisie. Veuillez vérifier votre boîte e-mail.');

        return false;
    }

    /**
     * @param string $token
     * 
     * @return bool
     */
    public function verificationUser(string $token): bool
    {
        // Find the user request by token
        $userRequest = $this->userRequestRepository->findOneBy(['token' => $token]);
        $this->addFlash('success', 'Compte activé avec succès 🚀');

        if ($userRequest instanceof UserRequest && $userRequest->getType() === UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value && $userRequest->isOpen()) {
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

            /**
             * @var User $user
             */
            $user = $userRequest->getUser();
            $user->setActive(true)
                ->setUpdatedAt($this->now());
            $this->userService->save($user);
            // Close the request
            $userRequest->setIsOpen(false)
                ->setUpdatedAt($this->now());
            $this->userService->save($user);

            $this->generateLog(
                content: ['message' => sprintf('Le compte utilisateur de %s a été activé avec succès.', $user->getUserIdentifier())],
                context: ['action' => __METHOD__],
                level: LoggerLevelEnum::Info
            );

            return true;
        }

        return false;
    }


    /**
     * @param User $user
     * 
     * @return bool
     */
    public function registration(User $user): bool
    {
        $user->setActive(false);

        // Check if the user already exists
        $result = $this->userService->create($user);
        $this->sendVerificationEmail($user);

        if ($result) {
            $this->addFlash('success', 'Compte créé avec succès 🚀');
        } else {
            $this->addFlash('danger', 'Une erreur est survenue lors de la création du compte !');
        }

        return $result;
    }

    /**
     * @param User $user
     * 
     * @return void
     */
    private function sendVerificationEmail(User $user): void
    {
        $request = new UserRequest;
        $request->setCreatedAt($this->now())
            ->setType(UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value)
            ->setIsOpen(true)
            ->setExpiredAt($this->now()->modify('+7 day'))
            ->setToken(Token::generate(50, unique: true))
        ;

        $user->addRequest($request);

        $this->userService->save($user);
        $userName = ($user->getFirstname() . ' ' . $user->getLastname()) === '' ? ($user->getFirstname() . ' ' . $user->getLastname()) : $user->getUsername();

        // Optionally, you can send a confirmation email here
        $email = new Email(
            name: 'AUTH_VERIFY_ACCOUNT',
            action: 'Vérification de compte',
            template: 'auth/verify-account',
            context: [
                'user' => [
                    'name' => $userName,
                    'email' => $user->getEmail(),
                    'username' => $user->getUsername(),
                ],
                'activation_link' => $this->urlGenerator->generate(
                    'auth_registration_verify',
                    ['token' => $request->getToken()],
                    UrlGeneratorInterface::ABSOLUTE_URL
                ),
            ]
        );

        $this->mailer->sendEmail(
            recepient: [$userName => $user->getEmail()],
            subject: 'Vérification de votre compte',
            template: $email->getTemplate(),
            context: $email->getContext()
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
