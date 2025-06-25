<?php

namespace Fagathe\Libs\Utils;

enum UserRequestEnum: string
{
    case ACCOUNT_ACTIVATION_REQUEST = 'account_activation_request';

    public function isValid(): bool
    {
        return in_array($this->value, self::cases(), true);
    }
}
