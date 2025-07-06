<?php

namespace Admin\Service;

use Fagathe\Libs\Front\Breadcrumb\Breadcrumb;
use Fagathe\Libs\Front\Breadcrumb\BreadcrumbItem;
use Fagathe\Libs\Logger\JsonLogService;
use Fagathe\Libs\Logger\Log;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpKernel\KernelInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

final class LogService
{
    private Finder $finder;

    public function __construct(
        private KernelInterface $kernel,
        private readonly UrlGeneratorInterface $urlGenerator
    ) {
        $this->finder = new Finder();
    }

    /**
     * @return array
     */
    public function getLogFiles(): array
    {
        $breadcrumb = $this->breadcrumb();
        $foundFiles = $this->finder->files()
            ->in(LOG_DIR)
            ->name('*.json')
            ->sortByName()
            ->getIterator();

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

        $dates = array_keys($files);

        return compact('files', 'dates', 'breadcrumb');
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
