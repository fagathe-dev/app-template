<?php

namespace Fagathe\Libs\Logger;

use Exception;

class LoggerException extends Exception
{
    public function __construct($message, $code = 0, ?Exception $previous = null)
    {
        parent::__construct("[LOGGING ERROR] " . $message, $code, $previous);
    }
}
