<?php
namespace Fagathe\Libs\Logger;

use Fagathe\Libs\JSON\JsonService;

class JsonLogService extends JsonService
{
    public function __construct(private string $filePath)
    {
        parent::__construct($filePath, [
            'JSON_DIR' => defined('LOG_DIR') ? LOG_DIR : '/logs/',
        ]);
    }
}
