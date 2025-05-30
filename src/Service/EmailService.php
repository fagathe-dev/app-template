<?php
namespace App\Service;

use Fagathe\Libs\Utils\Mailer\Email;

final class EmailService {

    public function __construct() {

    }

    public function index(): array {
        $emails = [
            new Email(
                name: 'AUTH_VERIFY_ACCOUNT',
                action: 'Vérification de compte',
                template: 'auth/verify-account',
                context: [
                    'user' => [
                        'name' => 'Frédérick',
                        'email' => 'example@email.com',
                        'username' => 'fagathe77',
                    ],
                    'activation_link' => 'https://example.com/activate?token=123456',
                ]
            ),
        ];

        return compact('emails');
    }
}