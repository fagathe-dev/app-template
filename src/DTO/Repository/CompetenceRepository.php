<?php

namespace App\DTO\Repository;

use App\DTO\CompetenceDTO;
use Fagathe\Libs\JSON\JsonService;

final class CompetenceRepository extends JsonService
{
    private const FILE_PATH = JSON_DATA_DIR . 'website/competences.json';
    public function __construct()
    {
        parent::__construct(static::FILE_PATH);
    }
}
