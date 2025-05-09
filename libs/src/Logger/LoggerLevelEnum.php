<?php

namespace Fagathe\Libs\Logger;

enum LoggerLevelEnum: string
{
    case Debug = 'debug';
    case Info = 'info';
    case Notice = 'notice';
    case Warning = 'warning';
    case Error = 'error';
}
