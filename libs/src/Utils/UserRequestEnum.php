<?php

namespace Fagathe\Libs\Utils;

enum UserRequestEnum: string
{
    case ACCOUNT_ACTIVATION_REQUEST = 'account_activation_request';
    case ACCOUNT_ADMIN_CREATION_REQUEST = 'account_admin_creation_request';

    public function isValid(): bool
    {
        return in_array($this, self::cases(), true);
    }
}
