<?php

namespace Fagathe\Libs\Utils;

enum UserRequestStatusEnum: string
{
    case STATUS_PENDING = 'pending';
    case STATUS_ACCEPTED = 'accepted';
    case STATUS_REJECTED = 'rejected';
    case STATUS_EXPIRED = 'expired';
    case STATUS_CANCELED = 'canceled';
}
