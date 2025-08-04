<?php

namespace Admin\Service;

use App\Entity\User;
use App\Entity\UserRequest;
use App\Repository\UserRepository;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Helpers\Token\Token;
use Fagathe\Libs\Logger\Logger;
use Fagathe\Libs\Logger\LoggerLevelEnum;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Fagathe\Libs\Utils\Mailer\MailerService;
use Fagathe\Libs\Utils\UserRequestEnum;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class UserEmailService
{
    private const LOG_FILE = 'service/user-email-service';
    use DateTimeTrait;


    public function __construct(
        private UserRepository $userRepository,
        private MailerService $mailer,
        private UrlGeneratorInterface $urlGenerator,
    ) {}

    /**
     * Sends a verification email to the user.
     *
     * @param User $user
     * 
     * @return void
     */
    public function sendChangeRoleEmail(User $user): void
    {
        try {
            $userName = trim($user->getFirstname() . ' ' . $user->getLastname()) ?: $user->getUsername();
            
            // Send email to the user
            $this->mailer->sendEmail(
                recepient: [$userName => $user->getEmail()],
                subject: 'Modification de votre rôle',
                template: 'admin/user/change-role',
                context: [
                    'user' => [
                        'name' => $userName,
                        'email' => $user->getEmail(),
                        'username' => $user->getUsername(),
                        'roles' => RoleEnum::matchLabel($user->getRoles()[0] ?? 'ROLE_USER'),
                    ],
                    'app_link' => $this->urlGenerator->generate(
                        name: 'app_home_index',
                        referenceType: UrlGeneratorInterface::ABSOLUTE_URL
                    ),
                ]
            );

            $this->generateLog(
                content: ['message' => 'Change role email sent successfully', 'user' => $user->getUserIdentifier()],
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
