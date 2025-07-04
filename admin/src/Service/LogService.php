<?php

namespace Admin\Service;

use Fagathe\Libs\Logger\JsonLogService;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpKernel\KernelInterface;

final class LogService
{
    private Finder $finder;

    public function __construct(private KernelInterface $kernel)
    {
        $this->finder = new Finder();
    }

    /**
     * @return array
     */
    public function getLogFiles(): array
    {
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
        
        return compact('files', 'dates');
    }
    
}
