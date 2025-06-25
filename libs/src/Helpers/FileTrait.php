<?php

namespace Fagathe\Libs\Helpers;

use Fagathe\Libs\File\FileTypeEnum;

trait FileTrait
{

    /**
     * @param string $fileType
     * 
     * @return string|null
     */
    public function getFileTypeIcon(string $fileType): ?string
    {
        return match ($fileType) {
            FileTypeEnum::Archive->value => 'ri-file-zip-fill text-warning',
            FileTypeEnum::Audio->value => 'ri-music-fill text-primary',
            FileTypeEnum::Code->value => 'ri-braces-fill text-secondary',
            FileTypeEnum::Image->value => 'ri-gallery-fill text-success',
            FileTypeEnum::PDF->value => 'ri-file-pdf-fill text-danger',
            FileTypeEnum::Presentation->value => 'ri-file-ppt-2-fill text-danger',
            FileTypeEnum::Tableur->value => 'ri-file-excel-2-fill text-success',
            FileTypeEnum::Texte->value => 'ri-file-text-fill text-secondary',
            FileTypeEnum::Traitement_De_Texte->value => 'ri-file-word-fill text-secondary',
            FileTypeEnum::Video->value => 'ri-movie-fill text-secondary',
            default => null
        };
    }

    /**
     * @param int $bytes
     * 
     * @return string
     */
    public function formatSize(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            $bytes = number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            $bytes = number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            $bytes = number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            $bytes = $bytes . ' B';
        } elseif ($bytes == 1) {
            $bytes = $bytes . ' B';
        } else {
            $bytes = '0 B';
        }

        return $bytes;
    }

    /**
     * @param string $fileType
     * 
     * @return bool
     */
    public function canPreview(string $fileType): bool
    {
        return in_array($fileType, [FileTypeEnum::Video->value, FileTypeEnum::Audio->value, FileTypeEnum::Image->value]);
    }
}
