<?php

namespace Fagathe\Libs\JSON;

use Fagathe\Libs\JSON\JsonFileException;
use Symfony\Component\Filesystem\Filesystem;

class JsonFileManager
{
    private Filesystem $filesystem;

    public function __construct(private string $filePath) {
        $this->filesystem = new Filesystem();
        $this->init();
    }

    private function init(): void
    {
        if (!defined('JSON_DATA_DIR')) {
            throw new JsonFileException("La constante `JSON_DATA_DIR` n'est pas définie.");
        }
        $this->filePath = JSON_DATA_DIR . $this->filePath;

        if (!$this->filesystem->exists($this->filePath)) {
            $this->filesystem->mkdir(dirname($this->filePath), 0755);
            $this->filesystem->touch($this->filePath);
        }
        
        if (!is_writable($this->filePath)) {
            throw new JsonFileException("Le fichier JSON n'est pas accessible en écriture : {$this->filePath}");
        }
    }

    /**
     * Reads and decodes the JSON content from the file.
     *
     * This method reads the JSON file specified by `$filePath` and decodes
     * its content into an associative array. If the file does not exist
     * or the JSON content is invalid, an exception is thrown.
     *
     * @throws JsonFileException If the file does not exist or the JSON content is invalid.
     *
     * @return array|null The decoded JSON data as an associative array.
     */
    public function read(): ?array
    {
        if (!$this->filesystem->exists($this->filePath)) {
            throw new JsonFileException("Le fichier JSON n'existe pas : {$this->filePath}");
        }

        $content = $this->filesystem->readFile($this->filePath);
        $data = json_decode($content, true);

        if ($data !== null && json_last_error() !== JSON_ERROR_NONE) {
            throw new JsonFileException("Erreur de décodage JSON : " . json_last_error_msg());
        }

        return $data;
    }

    public function write(array $data = []): void
    {
        $jsonData = json_encode($data, JSON_UNESCAPED_UNICODE);

        if ($jsonData === false) {
            throw new JsonFileException("Erreur d'encodage des données JSON : " . json_last_error_msg());
        }

        if ($this->filesystem->dumpFile($this->filePath, $jsonData) === false) {
            throw new JsonFileException("Échec de l'écriture dans le fichier JSON : {$this->filePath}");
        }
    }
}
