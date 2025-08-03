<?php

namespace Admin\Service;

use App\Entity\User;
use Fagathe\Libs\Security\Enum\RoleEnum;
use Fagathe\Libs\Utils\Mailer\Email;
use Fagathe\Libs\Utils\UserRequestEnum;

final class EmailService
{

    public function __construct() {}

    /**
     * @return array
     */
    public function index(): array
    {
        $user = new User();
        $user->setUsername('jdupont7')
            ->setEmail('jean.dupont@gmail.com')
            ->setPassword('password123')
            ->setRoles([RoleEnum::ROLE_ADMIN->value])
        ;
        $name = 'Jean';

        $emails = [
            new Email(
                name: UserRequestEnum::ACCOUNT_ACTIVATION_REQUEST->value,
                action: 'Vérification de compte',
                template: 'auth/verify-account',
                context: [
                    'user' => [
                        'name' => $name,
                        'username' => $user->getUsername(),
                        'email' => $user->getEmail(),
                    ],
                    'activation_link' => 'https://example.com/activate?token=123456',
                ]
            ),
            new Email(
                name: UserRequestEnum::ACCOUNT_ADMIN_CREATION_REQUEST->value,
                action: 'Validation de compte (compte crée par un administrateur)',
                template: 'admin/user/create-account',
                context: [
                    'user' => [
                        'name' => $name,
                        'username' => $user->getUsername(),
                        'email' => $user->getEmail(),
                        'password' => $user->getPassword(),
                    ],
                    'activation_link' => 'https://example.com/activate?token=123456',
                ],
            ),
            new Email(
                name: 'ROLE_CHANGE_NOTIFICATION',
                action: 'Notification de changement de rôle',
                template: 'admin/user/change-role',
                context: [
                    'user' => [
                        'name' => $name,
                        'email' => $user->getEmail(),
                        'username' => $user->getUsername(),
                        'roles' => RoleEnum::matchLabel($user->getRoles()[0] ?? 'ROLE_USER'),
                    ],
                    'app_link' => 'https://example.com/app',
                ]
            ),
        ];

        return compact('emails');
    }
}
