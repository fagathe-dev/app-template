<?php

namespace Admin\Service;

use DateTimeImmutable;
use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Helpers\DateTimeTrait;
use Fagathe\Libs\Logger\JsonLogService;
use Fagathe\Libs\Logger\Log;
use Iterator;
use phpDocumentor\Reflection\PseudoTypes\True_;
use Symfony\Component\Filesystem\Exception\IOExceptionInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class LogService
{
    use DateTimeTrait;
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
        $files = $this->logFiles();
        $daysToKeep = 30; // Nombre de jours de conservation des logs

        // 3. Spécifier le dossier à explorer
        $this->finder->in(LOG_DIR);

        // 1. Définir la date limite (aujourd'hui moins $daysToKeep jours), réglée à 00:00:00
        $thresholdDate = ($this->now())
            ->modify("-{$daysToKeep} days")
            ->setTime(0, 0, 0); // <-- C'est ici que tu définis l'heure à minuit (00:00:00)

        echo 'Debut du nettoyage de fichiers de log ' . "\n\r";
        echo 'Date limite de conservation : ' . $thresholdDate->format('d-m-Y') . "\n\r";
        echo '-------------------------------------   ' . "\n\r";

        foreach ($files as $file) {
            $file_name = $file->getRelativePathname();
            $file_path = $file->getRealPath();
            preg_match('/(\d{2}-\d{2}-\d{4})/', $file_name, $matches);
            $date = $matches[1] ?? null;

            $fileDate = DateTimeImmutable::createFromFormat('d-m-Y', $date)
                ->setTime(0, 0, 0); // <-- Régle aussi la date du fichier à minuit

            if ($fileDate < $thresholdDate) {
                if ($this->filesystem->exists($file_path)) {
                    $this->filesystem->remove($file_path);
                    echo 'Suppression du fichier ' . $file_path . "\n\r";
                }
            }
        }

        if (!$this->filesystem->exists(LOG_DIR)) {
            echo 'Le répertoire de base \"' . LOG_DIR . '\" n\'existe pas.';
            return;
        }

        try {
            $finder = new Finder;
            $folders = $finder->directories()
                ->in(LOG_DIR)
                ->sort(
                    fn(\SplFileInfo $a, \SplFileInfo $b) =>  substr_count($b->getPathname(), DIRECTORY_SEPARATOR) <=> substr_count($a->getPathname(), DIRECTORY_SEPARATOR)
                )
                ->ignoreDotFiles(true);

            foreach ($folders as $k => $dir) {
                $dirPath = $dir->getPathname();

                $this->isFolderEmptyRecursive($dirPath, true);
            }
            if (count($this->foldersToDelete) > 0) {
                echo 'Suppression dossier ...' . "\n\r";
                echo 'Dossier à supprimer : ' . join(' - ', $this->foldersToDelete) . "\n\r";;
                foreach ($this->foldersToDelete as  $folder) {
                    try {
                        if ($this->filesystem->exists($folder)) {
                            $this->filesystem->remove($folder);
                            echo "Dossier supprimé : '$folder' \n\r";
                        }
                    } catch (IOExceptionInterface $e) {
                        echo "Erreur lors de la suppression du dossier '$dirPath' : " . $e->getMessage() . "\n\r";
                    }
                }
            } else {
                echo 'Pas de dossier a supprimer' . "\n\r";
            }
        } catch (IOExceptionInterface $e) {
            echo 'Erreur lors de l\'exploration du répertoire ' . LOG_DIR . ' : ' . $e->getMessage() . "\n\r";
        }

        $this->foldersToDelete = [];

        echo 'Fin du nettoyage de fichiers de log ' . "\n\r";
        echo '-------------------------------------   ' . "\n\r";
    }

    /**
     * Vérifie si un dossier est vide de tout contenu (fichiers ou sous-dossiers),
     * y compris dans ses sous-dossiers (vérification récursive).
     *
     * @param string $directoryPath Le chemin absolu ou relatif du dossier à vérifier.
     * @param bool $ignoreDotFiles Si vrai, ignore les fichiers et dossiers cachés (commençant par un point).
     * @return bool Vrai si le dossier est entièrement vide de contenu (ou n'existe pas), faux sinon.
     */
    private function isFolderEmptyRecursive(string $directoryPath, bool $ignoreDotFiles = true): bool
    {
        // Si le dossier n'existe pas, il est considéré comme vide de contenu
        if (!$this->filesystem->exists($directoryPath)) {
            return true;
        }

        $finder = (new Finder())->in($directoryPath)->ignoreDotFiles(true);

        try {
            // --- NOUVELLE LOGIQUE DE VÉRIFICATION ---
            // On veut vérifier la présence de deux types d'éléments :
            // 1. Des fichiers '.json' (partout dans l'arborescence)
            // 2. Des sous-dossiers (partout dans l'arborescence)

            // Compter les fichiers .json
            $jsonFilesCount = (clone $finder) // Cloner pour ne pas modifier l'objet Finder original pour la prochaine recherche
                ->files()
                ->name('*.json') // Cherche spécifiquement les fichiers .json
                ->count();

            // Si pas de fichiers .json, vérifier la présence de dossiers
            $directories = (clone $finder)
                ->directories(); // Cherche spécifiquement les dossiers

            $directoriesCount = $directories->count();

            if ($directoriesCount > 0) {
                foreach ($directories as $key => $dir) {
                    $dirPath = $dir->getPathname();
                    $this->isFolderEmptyRecursive($dirPath, true);
                }
            }

            if ($directoriesCount === 0 && $jsonFilesCount === 0) {
                $this->addFolderToDelete($directoryPath);
            }

            echo 'dossier : ' . $directoryPath . ', count json files : ' . $jsonFilesCount . ' count dir folders : ' . $directoriesCount . "\n\r";
            // Si aucun fichier .json ET aucun dossier n'est trouvé, alors le dossier est vide (selon ta définition)
            return $directoriesCount === 0 && $jsonFilesCount === 0;
        } catch (IOExceptionInterface $e) {
            echo "Erreur d'accès au dossier '$directoryPath' lors de la vérification : " . $e->getMessage();
            return false; // Impossible de déterminer si vide
        }
    }

    private function addFolderToDelete(string $folder): void
    {
        if (!in_array($folder, $this->foldersToDelete)) {
            array_push($this->foldersToDelete, $folder);
        }
        dump($this->foldersToDelete);
    }


    /**
     * @return array
     */
    public function getLogFiles(): array
    {
        $breadcrumb = $this->breadcrumb();
        $foundFiles = $this->logFiles();

        $files = [];

        foreach ($foundFiles as $k => $file) {
            $file_name = $file->getRelativePathname();
            preg_match('/(\d{2}-\d{2}-\d{4})/', $file_name, $matches);
            $date = $matches[1] ?? null;
            $file_name = str_replace('.json', '', $file_name);
            $file_name = str_replace($date, '', $file_name);
            if (empty($files[$date])) {
                $files[$date] = [];
            }

            if (str_ends_with($file_name, '-')) {
                $file_name = substr($file_name, 0, -1);
            }

            if (str_contains($file_name, DIRECTORY_SEPARATOR)) {
                $parts = explode(DIRECTORY_SEPARATOR, $file_name);

                $filePath = match (count($parts)) {
                    1 => $parts[0],
                    2 => [$parts[0] => $parts[1]],
                    default => [$parts[0] => [$parts[1] => $parts[2]]],
                };

                $files[$date] = [
                    ...$files[$date],
                    ...$filePath,
                ];
            } else {
                $files[$date] = [
                    ...$files[$date],
                    $file_name,
                ];
            }
        }

        // Utilisation de uksort pour trier par les clés (dates)
        uksort($files, function ($dateA, $dateB) {
            // Convertir les chaînes de caractères JJ-MM-AAAA en objets DateTime pour une comparaison fiable
            $dateTimeA = DateTimeImmutable::createFromFormat('d-m-Y', $dateA);
            $dateTimeB = DateTimeImmutable::createFromFormat('d-m-Y', $dateB);

            // Gérer les erreurs de format (si une date n'est pas valide)
            if ($dateTimeA === false || $dateTimeB === false) {
                return 0; // Traiter comme égales si une erreur survient
            }

            // Comparer les objets DateTime pour un tri descendant (plus récent d'abord)
            if ($dateTimeA == $dateTimeB) {
                return 0; // Les dates sont égales
            }
            // L'inverse de la comparaison précédente : -1 si B est plus ancien que A (donc A doit venir avant), 1 si A est plus ancien
            return ($dateTimeA > $dateTimeB) ? -1 : 1;
        });

        return compact('files', 'breadcrumb');
    }

    public function getFileLogs(string $filename, string $date): array
    {
        $filePath = str_replace('_', '/', $filename) . '-' . $date;
        $logs = null;

        $breadcrumb = $this->breadcrumb([
            new BreadcrumbItem(
                join(' > ', explode('_', $filename)),
                $this->urlGenerator->generate('admin_log_show', ['date' => $date, 'logFile' => $filename]),
            ),
        ]);

        if (!file_exists(LOG_DIR . $filePath . '.json')) {
            return compact('logs');
        }

        $logService = new JsonLogService($filePath);
        $data = $logService->findAll();
        $logs = [];
        foreach ($data as $k => $log) {
            $objLog = new Log;
            $objLog->setId($log['id'])
                ->setLevel($log['level'])
                ->setContent($log['content'])
                ->setContext($log['context'])
                ->setTimestamp($log['timestamp'])
                ->setOrigin($log['origin']);

            array_push($logs, $objLog);
        }
        $explodedFileName = explode('_', $filename);
        $filename = end($explodedFileName);

        return compact('logs', 'filename', 'date', 'breadcrumb');
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
