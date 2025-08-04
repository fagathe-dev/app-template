<?php

namespace Admin\Service;

use DateTimeImmutable;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Logger\JsonLogService;
use Fagathe\Libs\Logger\Log;
use Iterator;
use Symfony\Component\Filesystem\Exception\IOExceptionInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\SplFileInfo;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class LogService
{
    use DateTimeTrait;

    private const DAYS_TO_KEEP = 30;
    private const DATE_FORMAT = 'd-m-Y';
    private const DATE_PATTERN = '/(\d{2}-\d{2}-\d{4})/';
    private const NEWLINE = "\n\r";

    private Finder $finder;
    private Filesystem $filesystem;
    private array $foldersToDelete = [];

    public function __construct(
        private KernelInterface $kernel,
        private readonly UrlGeneratorInterface $urlGenerator
    ) {
        $this->finder = new Finder;
        $this->filesystem = new Filesystem;
    }

    private function logFiles(): Iterator
    {
        return $this->finder->files()
            ->in(LOG_DIR)
            ->name('*.json')
            ->sortByName()
            ->getIterator();
    }

    public function deleteOldFiles(): void
    {
        if (!$this->filesystem->exists(LOG_DIR)) {
            echo 'Le répertoire de base "' . LOG_DIR . '" n\'existe pas.' . self::NEWLINE;
            return;
        }

        $this->deleteOldLogFiles();
        $this->deleteEmptyDirectories();

        $this->foldersToDelete = [];
        echo 'Fin du nettoyage de fichiers de log' . self::NEWLINE;
        echo '-------------------------------------' . self::NEWLINE;
    }

    private function deleteOldLogFiles(): void
    {
        $files = $this->logFiles();
        $thresholdDate = $this->now()
            ->modify('-' . self::DAYS_TO_KEEP . ' days')
            ->setTime(0, 0, 0);

        echo 'Debut du nettoyage de fichiers de log' . self::NEWLINE;
        echo 'Date limite de conservation : ' . $thresholdDate->format(self::DATE_FORMAT) . self::NEWLINE;
        echo '-------------------------------------' . self::NEWLINE;

        foreach ($files as $file) {
            $this->deleteFileIfOld($file, $thresholdDate);
        }
    }

    private function deleteFileIfOld(SplFileInfo $file, DateTimeImmutable $thresholdDate): void
    {
        $fileName = $file->getRelativePathname();
        preg_match(self::DATE_PATTERN, $fileName, $matches);
        $dateString = $matches[1] ?? null;

        if (!$dateString) {
            return;
        }

        $fileDate = DateTimeImmutable::createFromFormat(self::DATE_FORMAT, $dateString);
        if ($fileDate === false) {
            return;
        }

        $fileDate = $fileDate->setTime(0, 0, 0);

        if ($fileDate < $thresholdDate) {
            $filePath = $file->getRealPath();
            if ($this->filesystem->exists($filePath)) {
                try {
                    $this->filesystem->remove($filePath);
                    echo 'Suppression du fichier ' . $filePath . self::NEWLINE;
                } catch (IOExceptionInterface $e) {
                    echo 'Erreur lors de la suppression du fichier ' . $filePath . ' : ' . $e->getMessage() . self::NEWLINE;
                }
            }
        }
    }

    private function deleteEmptyDirectories(): void
    {
        try {
            $finder = new Finder();
            $folders = $finder->directories()
                ->in(LOG_DIR)
                ->sort(
                    fn(\SplFileInfo $a, \SplFileInfo $b) =>
                    substr_count($b->getPathname(), DIRECTORY_SEPARATOR) <=> substr_count($a->getPathname(), DIRECTORY_SEPARATOR)
                )
                ->ignoreDotFiles(true);

            foreach ($folders as $dir) {
                $this->isFolderEmptyRecursive($dir->getPathname(), true);
            }

            $this->removeFoldersToDelete();
        } catch (IOExceptionInterface $e) {
            echo 'Erreur lors de l\'exploration du répertoire ' . LOG_DIR . ' : ' . $e->getMessage() . self::NEWLINE;
        }
    }

    private function removeFoldersToDelete(): void
    {
        if (empty($this->foldersToDelete)) {
            echo 'Pas de dossier à supprimer' . self::NEWLINE;
            return;
        }

        echo 'Suppression dossier...' . self::NEWLINE;
        echo 'Dossier à supprimer : ' . implode(' - ', $this->foldersToDelete) . self::NEWLINE;

        foreach ($this->foldersToDelete as $folder) {
            try {
                if ($this->filesystem->exists($folder)) {
                    $this->filesystem->remove($folder);
                    echo "Dossier supprimé : '$folder'" . self::NEWLINE;
                }
            } catch (IOExceptionInterface $e) {
                echo "Erreur lors de la suppression du dossier '$folder' : " . $e->getMessage() . self::NEWLINE;
            }
        }
    }

    /**
     * Vérifie si un dossier est vide de tout contenu (fichiers JSON ou sous-dossiers),
     * y compris dans ses sous-dossiers (vérification récursive).
     */
    private function isFolderEmptyRecursive(string $directoryPath, bool $ignoreDotFiles = true): bool
    {
        if (!$this->filesystem->exists($directoryPath)) {
            return true;
        }

        try {
            $finder = (new Finder())->in($directoryPath)->ignoreDotFiles($ignoreDotFiles);

            // Compter les fichiers .json
            $jsonFilesCount = (clone $finder)
                ->files()
                ->name('*.json')
                ->count();

            // Compter les dossiers
            $directories = (clone $finder)->directories();
            $directoriesCount = $directories->count();

            // Vérifier récursivement les sous-dossiers
            if ($directoriesCount > 0) {
                foreach ($directories as $dir) {
                    $this->isFolderEmptyRecursive($dir->getPathname(), true);
                }
            }

            $isEmpty = $directoriesCount === 0 && $jsonFilesCount === 0;

            if ($isEmpty) {
                $this->addFolderToDelete($directoryPath);
            }

            echo sprintf(
                'dossier : %s, count json files : %d count dir folders : %d%s',
                $directoryPath,
                $jsonFilesCount,
                $directoriesCount,
                self::NEWLINE
            );

            return $isEmpty;
        } catch (IOExceptionInterface $e) {
            echo "Erreur d'accès au dossier '$directoryPath' lors de la vérification : " . $e->getMessage() . self::NEWLINE;
            return false;
        }
    }

    private function addFolderToDelete(string $folder): void
    {
        if (!in_array($folder, $this->foldersToDelete, true)) {
            $this->foldersToDelete[] = $folder;
        }
    }


    public function getLogFiles(): array
    {
        $breadcrumb = $this->breadcrumb();
        $foundFiles = $this->logFiles();
        $files = [];

        foreach ($foundFiles as $file) {
            $this->processLogFile($file, $files);
        }

        $this->sortFilesByDate($files);

        return compact('files', 'breadcrumb');
    }

    private function processLogFile(SplFileInfo $file, array &$files): void
    {
        $fileName = $file->getRelativePathname();
        preg_match(self::DATE_PATTERN, $fileName, $matches);
        $date = $matches[1] ?? null;

        if (!$date) {
            return;
        }

        $cleanFileName = str_replace(['.json', $date], '', $fileName);

        if (!isset($files[$date])) {
            $files[$date] = [];
        }

        if (str_ends_with($cleanFileName, '-')) {
            $cleanFileName = substr($cleanFileName, 0, -1);
        }

        if (str_contains($cleanFileName, DIRECTORY_SEPARATOR)) {
            $filePath = $this->buildFilePathArray($cleanFileName);
            $files[$date] = [...$files[$date], ...$filePath];
        } else {
            $files[$date] = [...$files[$date], $cleanFileName];
        }
    }

    private function buildFilePathArray(string $fileName): array
    {
        $parts = explode(DIRECTORY_SEPARATOR, $fileName);

        return match (count($parts)) {
            1 => [$parts[0]],
            2 => [$parts[0] => $parts[1]],
            default => [$parts[0] => [$parts[1] => $parts[2]]],
        };
    }

    private function sortFilesByDate(array &$files): void
    {
        uksort($files, function (string $dateA, string $dateB): int {
            $dateTimeA = DateTimeImmutable::createFromFormat(self::DATE_FORMAT, $dateA);
            $dateTimeB = DateTimeImmutable::createFromFormat(self::DATE_FORMAT, $dateB);

            if ($dateTimeA === false || $dateTimeB === false) {
                return 0;
            }

            return $dateTimeB <=> $dateTimeA; // Tri descendant (plus récent d'abord)
        });
    }

    public function getFileLogs(string $filename, string $date): array
    {
        $filePath = str_replace('_', '/', $filename) . '-' . $date;
        $logs = null;

        $breadcrumb = $this->breadcrumb([
            new BreadcrumbItem(
                implode(' > ', explode('_', $filename)),
                $this->urlGenerator->generate('admin_log_show', ['date' => $date, 'logFile' => $filename]),
            ),
        ]);

        $fullPath = LOG_DIR . $filePath . '.json';
        if (!file_exists($fullPath)) {
            return compact('logs', 'breadcrumb');
        }

        $logs = $this->buildLogObjects($filePath);
        $filename = $this->extractFilename($filename);

        return compact('logs', 'filename', 'date', 'breadcrumb');
    }

    private function buildLogObjects(string $filePath): array
    {
        $logService = new JsonLogService($filePath);
        $data = $logService->findAll();
        $logs = [];

        foreach ($data as $logData) {
            $log = new Log();
            $log->setId($logData['id'])
                ->setLevel($logData['level'])
                ->setContent($logData['content'])
                ->setContext($logData['context'])
                ->setTimestamp($logData['timestamp'])
                ->setOrigin($logData['origin']);

            $logs[] = $log;
        }

        return $logs;
    }

    private function extractFilename(string $filename): string
    {
        $parts = explode('_', $filename);
        return end($parts);
    }

    /**
     * @param BreadcrumbItem[] $items 
     * 
     * @return Breadcrumb
     */
    private function breadcrumb(array $items = []): Breadcrumb
    {
        $breadcrumb = new Breadcrumb([
            new BreadcrumbItem(
                'Liste des logs',
                $this->urlGenerator->generate('admin_log_index'),
            ),
            ...$items
        ]);

        return $breadcrumb;
    }
}
