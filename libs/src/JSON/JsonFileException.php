<?php

namespace Fagathe\Libs\JSON;

use Exception;

class JsonFileException extends Exception
{
    public function __construct($message, $code = 0, ?Exception $previous = null)
    {
        parent::__construct("[JSON FILE ERROR] " . $message, $code, $previous);
    }
}
