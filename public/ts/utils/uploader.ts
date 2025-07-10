import { Key } from 'readline';

// TypeScript file for file uploader
window.sessionStorage.removeItem('previewSelector');

interface UploaderOptionsInterface {
  multiple?: boolean;
  fileType?:
    | 'VIDEO'
    | 'AUDIO'
    | 'IMAGE'
    | 'PDF'
    | 'ARCHIVE'
    | 'CODE'
    | 'DOCUMENT'
    | 'PRESENTATION'
    | 'SPREADSHEET'
    | 'TEXT'
    | '*';
  previewSelector?: string;
  preview?: boolean;
  maxFileSize?: string;
  maxFiles?: number;
}

type UploaderErrorType = 'file' | 'fileType' | 'fileSize' | 'fileCount';

interface UploaderInterface {
  element: string;
  options: UploaderOptionsInterface;
  errors?: Record<UploaderErrorType, string>;
}

interface FileTypeInterface {
  extensions: Array<string>;
  mimeTypes: Array<string>;
}

const formatFileSize = (bytes: number): string => {
  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(2)} MB`;
};

const parseSize = (size: string): number => {
  const unit: string = size.slice(-1).toUpperCase();
  const value: number = parseFloat(size.slice(0, -1));

  switch (unit) {
    case 'K':
      return value / 1024; // Convert KB to MB
    case 'M':
      return value; // MB
    case 'G':
      return value * 1024; // Convert GB to MB
    default:
      throw new Error('Invalid size format');
  }
};

const isFileSizeValid = (fileSizeBytes: number, maxSize: string): boolean => {
  const fileSizeMB: number = fileSizeBytes / (1024 * 1024);
  const maxSizeMB: number = parseSize(maxSize);

  return fileSizeMB <= maxSizeMB;
};

class FileType {
  ARCHIVE: FileTypeInterface = {
    extensions: ['zip', 'rar', '7z'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
  };
  AUDIO: FileTypeInterface = {
    extensions: ['mp3', 'wav', 'ogg', 'weba'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  };
  CODE = {
    extensions: [
      'html',
      'css',
      'js',
      'json',
      'ts',
      'jsx',
      'tsx',
      'php',
      'py',
      'java',
      'c',
      'cpp',
      'cs',
      'go',
      'rb',
      'rs',
      'yaml',
      'yml',
    ],
    mimeTypes: [
      'text/html',
      'text/css',
      'text/javascript',
      'text/typescript',
      'text/jsx',
      'application/json',
      'text/tsx',
      'text/php',
      'text/x-python',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/x-csharp',
      'text/x-go',
      'text/x-ruby',
      'text/rust',
      'application/yaml',
    ],
  };
  DOCUMENT: FileTypeInterface = {
    extensions: ['doc', 'docx'],
    mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  };
  IMAGE: FileTypeInterface = {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon'],
  };
  PDF: FileTypeInterface = {
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
  };
  PRESENTATION: FileTypeInterface = {
    extensions: ['ppt', 'pptx', 'odp', 'otp'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.presentation',
      'application/vnd.oasis.opendocument.presentation-template',
    ],
  };
  SPREADSHEET: FileTypeInterface = {
    extensions: ['xls', 'xlsx', 'ods', 'ots'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.spreadsheet-template',
    ],
  };
  TEXT: FileTypeInterface = {
    extensions: ['txt', 'odt', 'md', 'markdown', 'mdown', 'markdn', 'csv'],
    mimeTypes: ['text/plain', 'application/vnd.oasis.opendocument.text', 'text/markdown', 'text/csv'],
  };
  VIDEO: FileTypeInterface = {
    extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
  };
}

class AudioPreviewer {
  previewSelector: string;
  file: File;
  previewContainer?: HTMLAudioElement | HTMLDivElement;
  container?: HTMLElement;
  CLASS = 'audio-preview';
  NOT_SUPPORTTED_FORMATS: Array<string> = [];
  constructor(previewSelector: string, file: File, container?: HTMLElement) {
    this.previewSelector = previewSelector;
    this.file = file;
    this.container = container;
    this.setUpPreviewContainer();
    this.render();
  }

  init() {
    this.setUpPreviewContainer();
  }

  setUpPreviewContainer() {
    const url = URL.createObjectURL(this.file);
    let previewContainer: HTMLAudioElement | HTMLDivElement | null = null;
    const fileExtension: string = this.file.name.split('.').pop() ?? '';

    if (this.NOT_SUPPORTTED_FORMATS.includes(fileExtension)) {
      console.warn('Audio format not supported');
      previewContainer = (this.container as HTMLElement).querySelector(
        `div${this.previewSelector}`
      ) as HTMLDivElement | null;
      if (previewContainer === null) {
        previewContainer = document.createElement('div') as HTMLDivElement;
        previewContainer.classList.add('audio-preview');
      }
      if (this.previewSelector.startsWith('#')) {
        previewContainer.id = this.previewSelector.replace('#', '');
      }
      previewContainer.innerHTML = `
        Votre navigateur ne permet pas de lire les audios au format ".${fileExtension}". Mais vous pouvez toujours
        <a href="${url}">la télécharger</a> !
      `;
    } else {
      previewContainer = (this.container as HTMLElement).querySelector(
        `audio${this.previewSelector}`
      ) as HTMLAudioElement | null;
      if (previewContainer === null) {
        previewContainer = document.createElement('audio') as HTMLAudioElement;
        if (this.previewSelector.startsWith('#')) {
          previewContainer.id = this.previewSelector.replace('#', '');
        }
        if (this.previewSelector.startsWith('.')) {
          previewContainer.classList.add(this.previewSelector.replace('.', ''));
        }
        (this.container as HTMLElement).insertAdjacentElement('beforeend', previewContainer);
      }

      const source = document.createElement('source');
      source.src = url;
      source.type = this.file.type;

      previewContainer.appendChild(source);
      previewContainer.controls = true;
      previewContainer.autoplay = false;
    }
    this.previewContainer = previewContainer;
    this.previewContainer.onload = () => {
      URL.revokeObjectURL(url);
    };
  }

  render() {
    (this.container as HTMLElement).insertAdjacentElement('beforeend', this.previewContainer as HTMLElement);
  }
}

class ImagePreviewer {
  previewSelector: string;
  file: File;
  previewContainer?: HTMLImageElement;
  container?: HTMLElement;
  CLASS = 'image-preview';
  constructor(previewSelector: string, file: File, container?: HTMLElement) {
    this.previewSelector = previewSelector;
    this.file = file;
    this.container = container;
    this.setUpPreviewContainer();
    this.render();
  }

  init() {
    this.setUpPreviewContainer();
  }

  setUpPreviewContainer() {
    let previewContainer = (this.container as HTMLElement).querySelector(
      this.previewSelector
    ) as HTMLImageElement | null;
    if (previewContainer === null) {
      previewContainer = document.createElement('img');
      if (this.previewSelector.startsWith('#')) {
        previewContainer.id = this.previewSelector.replace('#', '');
      } else if (this.previewSelector.startsWith('.')) {
        previewContainer.classList.add(this.previewSelector.replace('.', ''));
      }

      (this.container as HTMLElement).insertAdjacentElement('beforeend', previewContainer);
    }
    this.previewContainer = previewContainer;
  }

  render() {
    const url = URL.createObjectURL(this.file);
    (this.previewContainer as HTMLImageElement).src = url;
    (this.previewContainer as HTMLImageElement).alt = `Preview ${this.file.name}`;
    (this.previewContainer as HTMLImageElement).title = `Preview ${this.file.name}`;

    (this.previewContainer as HTMLImageElement).onload = () => URL.revokeObjectURL(url);
  }
}

class VideoPreviewer {
  previewSelector: string;
  file: File;
  previewContainer?: HTMLVideoElement | HTMLDivElement;
  container?: HTMLElement;
  CLASS = 'video-preview';
  NOT_SUPPORTTED_FORMATS: Array<string> = ['mov'];
  constructor(previewSelector: string, file: File, container?: HTMLElement) {
    this.previewSelector = previewSelector;
    this.file = file;
    this.container = container;
    this.setUpPreviewContainer();
    this.render();
  }

  init() {
    this.setUpPreviewContainer();
  }

  setUpPreviewContainer() {
    const url = URL.createObjectURL(this.file);
    let previewContainer: HTMLVideoElement | HTMLDivElement | null = null;
    const fileExtension: string = this.file.name.split('.').pop() ?? '';

    if (this.NOT_SUPPORTTED_FORMATS.includes(fileExtension)) {
      previewContainer = (this.container as HTMLElement).querySelector(
        `div${this.previewSelector}`
      ) as HTMLDivElement | null;
      if (previewContainer === null) {
        previewContainer = document.createElement('div') as HTMLDivElement;
        previewContainer.classList.add('video-preview');
      }
      if (this.previewSelector.startsWith('#')) {
        previewContainer.id = this.previewSelector.replace('#', '');
      }
      previewContainer.innerHTML = `
      Votre navigateur ne permet pas de lire les vidéos au format ".${fileExtension}". Mais vous pouvez toujours
      <a href="${url}">la télécharger</a> !
    `;
    } else {
      previewContainer = (this.container as HTMLElement).querySelector(
        `video${this.previewSelector}`
      ) as HTMLVideoElement | null;
      if (previewContainer === null) {
        previewContainer = document.createElement('video') as HTMLVideoElement;
        if (this.previewSelector.startsWith('#')) {
          previewContainer.id = this.previewSelector.replace('#', '');
        }
        if (this.previewSelector.startsWith('.')) {
          previewContainer.classList.add(this.previewSelector.replace('.', ''));
        }
        (this.container as HTMLElement).insertAdjacentElement('beforeend', previewContainer);
      }

      const source = document.createElement('source');
      source.src = url;
      source.type = this.file.type;
      previewContainer.appendChild(source);
      previewContainer.controls = false;
      previewContainer.autoplay = true;
    }
    this.previewContainer = previewContainer;
    this.previewContainer.onload = () => {
      URL.revokeObjectURL(url);
    };
  }

  render() {
    (this.container as HTMLElement).insertAdjacentElement('beforeend', this.previewContainer as HTMLElement);
  }
}

class PDFPreviewer {
  previewSelector: string;
  file: File;
  previewContainer?: HTMLIFrameElement;
  container?: HTMLElement;
  CLASS = 'video-preview';
  constructor(previewSelector: string, file: File, container?: HTMLElement) {
    this.previewSelector = previewSelector;
    this.file = file;
    this.container = container;
    this.setUpPreviewContainer();
    this.render();
  }

  init() {
    this.setUpPreviewContainer();
  }

  setUpPreviewContainer() {
    let previewContainer = (this.container as HTMLElement).querySelector(
      this.previewSelector
    ) as HTMLIFrameElement | null;
    if (previewContainer === null) {
      previewContainer = document.createElement('iframe') as HTMLIFrameElement;
      if (this.previewSelector.startsWith('#')) {
        previewContainer.id = this.previewSelector.replace('#', '');
      } else if (this.previewSelector.startsWith('.')) {
        previewContainer.classList.add(this.previewSelector.replace('.', ''));
      }

      (this.container as HTMLElement).insertAdjacentElement('beforeend', previewContainer);
    }
    this.previewContainer = previewContainer;
  }

  render() {
    const url = URL.createObjectURL(this.file);
    const content = `Votre navigateur ne prends pas en charge les iframes. Cliquez <a href=${url}>ici</a> pour télécharger le fichier PDF.`;
    (this.previewContainer as HTMLIFrameElement).src = url;
    (this.previewContainer as HTMLIFrameElement).style.border = 'none';
    (this.previewContainer as HTMLIFrameElement).width = '100%';
    (this.previewContainer as HTMLIFrameElement).height = '600';
    (this.previewContainer as HTMLIFrameElement).innerHTML = content;

    (this.previewContainer as HTMLIFrameElement).onload = () => URL.revokeObjectURL(url);
  }
}

interface FileTypeCheckerInterface {
  success: boolean;
  message?: string;
}

class Uploader {
  element: string;
  options: UploaderOptionsInterface;
  errors: Record<UploaderErrorType, string>;

  constructor(element: string, options: UploaderOptionsInterface) {
    this.element = element;
    this.options = options;
    this.errors = { file: '', fileType: '', fileSize: '', fileCount: '' };
    this.init();
  }

  widgetSelector(): void {
    let widgetSelector: string =
      this.options?.previewSelector ?? window.sessionStorage.getItem('previewSelector') ?? '';

    if (widgetSelector === '' && this.options.preview === true) {
      // @ts-ignore
      const selector = Str.random(10);
      window.sessionStorage.setItem('previewSelector', selector);
      widgetSelector = `#${selector}`;
    }

    this.options.previewSelector = widgetSelector;
  }

  setUpOptions(): void {
    const defaultOptions: UploaderOptionsInterface = {
      multiple: false,
      fileType: '*',
      previewSelector: undefined,
      preview: false,
      maxFileSize: '10M',
      maxFiles: 1,
    };
    this.options = { ...defaultOptions, ...this.options };
  }

  getErrorsContainer(): HTMLElement | undefined {
    const parent = this.getElementContainer();
    let errorContainer: HTMLElement = parent.querySelector('.invalid-feedback') as HTMLElement;

    if ((errorContainer === undefined || errorContainer === null) && this.hasErrors()) {
      errorContainer = document.createElement('small');
      errorContainer.classList.add('invalid-feedback');
    }

    return errorContainer;
  }

  checkFileType(file: File): void {
    const fileExtension: string = file.name.split('.').pop() ?? '';
    const fileMimeType: string = file.type;
    let acceptedFileTypes: Array<string> = [];
    let acceptedFileExtensions: Array<string> = [];
    const objFileType: FileType = new FileType();

    switch (this.options.fileType) {
      case '*':
        acceptedFileTypes = [
          ...objFileType.ARCHIVE.mimeTypes,
          ...objFileType.AUDIO.mimeTypes,
          ...objFileType.CODE.mimeTypes,
          ...objFileType.DOCUMENT.mimeTypes,
          ...objFileType.IMAGE.mimeTypes,
          ...objFileType.PDF.mimeTypes,
          ...objFileType.PRESENTATION.mimeTypes,
          ...objFileType.SPREADSHEET.mimeTypes,
          ...objFileType.TEXT.mimeTypes,
          ...objFileType.VIDEO.mimeTypes,
        ];
        acceptedFileExtensions = [
          ...objFileType.ARCHIVE.extensions,
          ...objFileType.AUDIO.extensions,
          ...objFileType.CODE.extensions,
          ...objFileType.DOCUMENT.extensions,
          ...objFileType.IMAGE.extensions,
          ...objFileType.PDF.extensions,
          ...objFileType.PRESENTATION.extensions,
          ...objFileType.SPREADSHEET.extensions,
          ...objFileType.TEXT.extensions,
          ...objFileType.VIDEO.extensions,
        ];
        break;
      case 'ARCHIVE':
        acceptedFileTypes = objFileType.ARCHIVE.mimeTypes;
        acceptedFileExtensions = objFileType.ARCHIVE.extensions;
        break;
      case 'AUDIO':
        acceptedFileTypes = objFileType.AUDIO.mimeTypes;
        acceptedFileExtensions = objFileType.AUDIO.extensions;
        break;
      case 'CODE':
        acceptedFileTypes = objFileType.CODE.mimeTypes;
        acceptedFileExtensions = objFileType.CODE.extensions;
        break;
      case 'DOCUMENT':
        acceptedFileTypes = objFileType.DOCUMENT.mimeTypes;
        acceptedFileExtensions = objFileType.DOCUMENT.extensions;
        break;
      case 'IMAGE':
        acceptedFileTypes = objFileType.IMAGE.mimeTypes;
        acceptedFileExtensions = objFileType.IMAGE.extensions;
        break;
      case 'PDF':
        acceptedFileTypes = objFileType.PDF.mimeTypes;
        acceptedFileExtensions = objFileType.PDF.extensions;
        break;
      case 'PRESENTATION':
        acceptedFileTypes = objFileType.PRESENTATION.mimeTypes;
        acceptedFileExtensions = objFileType.PRESENTATION.extensions;
        break;
      case 'SPREADSHEET':
        acceptedFileTypes = objFileType.SPREADSHEET.mimeTypes;
        acceptedFileExtensions = objFileType.SPREADSHEET.extensions;
        break;
      case 'TEXT':
        acceptedFileTypes = objFileType.TEXT.mimeTypes;
        acceptedFileExtensions = objFileType.TEXT.extensions;
        break;
      case 'VIDEO':
        acceptedFileTypes = objFileType.VIDEO.mimeTypes;
        acceptedFileExtensions = objFileType.VIDEO.extensions;
        break;
      default:
        this.errors.fileType = 'Invalid file type';
        break;
    }

    if (
      acceptedFileTypes.includes(fileMimeType) === false ||
      acceptedFileExtensions.includes(fileExtension) === false
    ) {
      this.errors.fileType = 'File type is not supported';

      return;
    } else {
      if (this.errors.fileType as UploaderErrorType) {
        //@ts-ignore
        delete this.errors.fileType;
      }
    }
  }

  checkFileSize(file: File): void {
    const fileSizeBytes: number = file.size;
    const maxSize: string = this.options.maxFileSize ?? '20M';

    if (isFileSizeValid(fileSizeBytes, maxSize) === false) {
      this.errors.fileSize = `File size exceeds the limit of ${maxSize}B`;
    } else {
      if (this.errors.fileSize) {
        //@ts-ignore
        delete this.errors.fileSize;
      }
    }
  }

  hasErrors(): boolean {
    for (const error in this.errors) {
      if (this.errors[error as UploaderErrorType] === '') {
        delete this.errors[error as UploaderErrorType];
      }
    }
    return Object.keys(this.errors).length > 0;
  }

  handlePreview(file: File): void {
    if (this.options.preview === false) {
      return;
    }
    if (this.options.fileType === 'IMAGE') {
      new ImagePreviewer(this.options.previewSelector as string, file, this.getElementContainer() as HTMLElement);
    }
    if (this.options.fileType === 'AUDIO') {
      new AudioPreviewer(this.options.previewSelector as string, file, this.getElementContainer() as HTMLElement);
    }
    if (this.options.fileType === 'VIDEO' && window.innerWidth > 768) {
      new VideoPreviewer(this.options.previewSelector as string, file, this.getElementContainer() as HTMLElement);
    }
    if (this.options.fileType === 'PDF' && window.innerWidth > 768) {
      new PDFPreviewer(this.options.previewSelector as string, file, this.getElementContainer() as HTMLElement);
    }
    this.widgetSelector();
  }

  handleErrors(): void {
    const errorContainer = this.getErrorsContainer();
    const container = this.getElementContainer();
    if (this.hasErrors() === false) {
      errorContainer && errorContainer.remove();
      //@ts-ignore
      ($(this.element) as HTMLInputElement).classList.remove('is-invalid');
      return;
    }

    let errorText: string = '';

    for (const error in this.errors) {
      if (this.errors[error as UploaderErrorType] !== '') {
        errorText += `${this.errors[error as UploaderErrorType]}. `;
      }
    }

    (errorContainer as HTMLElement).innerHTML = errorText;
    //@ts-ignore
    ($(this.element) as HTMLInputElement).classList.add('is-invalid');
    container.insertAdjacentElement('beforeend', errorContainer as HTMLElement);
  }

  handleFileChange(event: Event): void {
    const fileList: Array<File> = Array.from((event.target as HTMLInputElement).files as FileList);

    if (fileList.length === 0) {
      this.errors.fileCount = 'No file selected';
    } else if (fileList.length > 1) {
      this.errors.fileCount = 'Multiple files selection is not supported. Please select only one file';
    } else {
      if (this.errors.hasOwnProperty('fileCount')) {
        //@ts-ignore
        delete this.errors.fileCount;
      }
      fileList.forEach((file: File, i) => {
        this.checkFileType(file);
        this.checkFileSize(file);
      });
    }

    this.handleErrors();
    if (this.hasErrors() === false) {
      fileList.forEach((file: File, i) => {
        this.handlePreview(file);
      });
    } else {
      if (this.options.preview === true) {
        const container = this.getElementContainer();
        const previewContainer = container.querySelector(this.options.previewSelector as string);
        previewContainer && previewContainer.remove();
      }
    }
  }

  getElementContainer(): HTMLElement {
    // @ts-ignore
    const parentElement: HTMLElement = ($(this.element) as HTMLInputElement).parentElement as HTMLElement;

    return parentElement;
  }

  init() {
    this.setUpOptions();
    this.errors = { file: '', fileType: '', fileSize: '', fileCount: '' }; // Initialiser les erreurs avant de traiter les fichiers
    // @ts-ignore
    ($(this.element) as HTMLInputElement).addEventListener('change', this.handleFileChange.bind(this));
  }
}
