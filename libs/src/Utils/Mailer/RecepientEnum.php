<?php

namespace Fagathe\Libs\Utils\Mailer;

enum RecepientEnum: string
{
    case To = 'to';
    case Cc = 'cc';
    case Bcc = 'bcc';
}
