<?php

use App\Kernel;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';
require_once './constants.php';
require_once './secret.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
} 

return function (array $context) {
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
