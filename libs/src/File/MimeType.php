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
}
