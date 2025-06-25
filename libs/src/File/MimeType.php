<?php

namespace Fagathe\Libs\File;

final class MimeType
{

    public const ARCHIVE_MIMES = ['application/x-bzip', 'application/x-7z-compressed', 'application/zip', 'application/x-bzip2', 'application/x-rar-compressed', 'application/x-tar'];
    public const AUDIO_MIMES = ['audio/aac', 'audio/x-wav', 'audio/webm', 'audio/x-mpeg-3', 'audio/mpeg3', 'audio/3gpp', 'audio/3gpp2', 'audio/ogg', 'audio/midi'];
    public const CODE_MIMES = ['text/css', 'text/html',];
    public const IMAGE_MIMES = ['image/bmp', 'image/webp', 'image/svg+xml', 'image/tiff', 'image/png', 'image/gif', 'image/x-icon', 'image/jpeg'];
    public const PDF_MIMES = ['application/pdf'];
    public const PRESENTATION_MIMES = ['application/vnd.oasis.opendocument.presentation', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    public const TABLEUR_MIMES = ['application/vnd.oasis.opendocument.spreadsheet'];
    public const TRAITEMENT_DE_TEXTE_MIMES = ['text/csv'];
    public const TEXTE_MIMES = ['application/vnd.oasis.opendocument.text'];
    public const VIDEO_MIMES = ['video/mpeg', 'video/x-msvideo', 'video/quicktime', 'video/msvideo', 'video/webm', 'video/x-msvideo', 'video/mp4', 'video/3gpp', 'video/3gpp2', 'video/ogg'];

    public static function guessMimetype(string $filePath): bool
    {
        return mime_content_type($filePath);
    }

    public static function isArchive(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::ARCHIVE_MIMES, true);
    }

    public static function isAudio(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::AUDIO_MIMES, true);
    }

    public static function isCode(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::CODE_MIMES, true);
    }

    public static function isImage(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::IMAGE_MIMES, true);
    }

    public static function isPdf(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::PDF_MIMES, true);
    }

    public static function isPresentation(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::PRESENTATION_MIMES, true);
    }

    public static function isTableur(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::TABLEUR_MIMES, true);
    }

    public static function isTraitementDeTexte(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::TRAITEMENT_DE_TEXTE_MIMES, true);
    }

    public static function isTexte(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::TEXTE_MIMES, true);
    }

    public static function isVideo(string $filePath): bool
    {
        return in_array(self::guessMimetype($filePath), self::VIDEO_MIMES, true);
    }

    public static function isSupported(string $filePath): bool
    {
        return self::isArchive($filePath) || self::isAudio($filePath) || self::isCode($filePath) || self::isImage($filePath) || self::isPdf($filePath) || self::isPresentation($filePath) || self::isTableur($filePath) || self::isTraitementDeTexte($filePath) || self::isTexte($filePath) || self::isVideo($filePath);
    }

    public static function isNotSupported(string $filePath): bool
    {
        return !self::isSupported($filePath);
    }

    public static function getSupportedMimetypes(): array
    {
        return array_merge(
            self::ARCHIVE_MIMES,
            self::AUDIO_MIMES,
            self::CODE_MIMES,
            self::IMAGE_MIMES,
            self::PDF_MIMES,
            self::PRESENTATION_MIMES,
            self::TABLEUR_MIMES,
            self::TRAITEMENT_DE_TEXTE_MIMES,
            self::TEXTE_MIMES,
            self::VIDEO_MIMES
        );
    }
}
