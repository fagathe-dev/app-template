<?php

use App\Kernel;
use Fagathe\Libs\Helpers\Request\NativeSession;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';
require_once './constants.php';
require_once './secret.php';

return function (array $context) {
    (new NativeSession())->start(); // Start the session if not already started
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
