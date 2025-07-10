var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/utils/uploader.ts
window.sessionStorage.removeItem("previewSelector");
var formatFileSize = (bytes) => {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(2)} MB`;
};
var parseSize = (size) => {
  const unit = size.slice(-1).toUpperCase();
  const value = parseFloat(size.slice(0, -1));
  switch (unit) {
    case "K":
      return value / 1024;
    // Convert KB to MB
    case "M":
      return value;
    // MB
    case "G":
      return value * 1024;
    // Convert GB to MB
    default:
      throw new Error("Invalid size format");
  }
};
var isFileSizeValid = (fileSizeBytes, maxSize) => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  const maxSizeMB = parseSize(maxSize);
  return fileSizeMB <= maxSizeMB;
};
var FileType = class {
  constructor() {
    __publicField(this, "ARCHIVE", {
      extensions: ["zip", "rar", "7z"],
      mimeTypes: ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"]
    });
    __publicField(this, "AUDIO", {
      extensions: ["mp3", "wav", "ogg", "weba"],
      mimeTypes: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"]
    });
    __publicField(this, "CODE", {
      extensions: [
        "html",
        "css",
        "js",
        "json",
        "ts",
        "jsx",
        "tsx",
        "php",
        "py",
        "java",
        "c",
        "cpp",
        "cs",
        "go",
        "rb",
        "rs",
        "yaml",
        "yml"
      ],
      mimeTypes: [
        "text/html",
        "text/css",
        "text/javascript",
        "text/typescript",
        "text/jsx",
        "application/json",
        "text/tsx",
        "text/php",
        "text/x-python",
        "text/x-java",
        "text/x-c",
        "text/x-c++",
        "text/x-csharp",
        "text/x-go",
        "text/x-ruby",
        "text/rust",
        "application/yaml"
      ]
    });
    __publicField(this, "DOCUMENT", {
      extensions: ["doc", "docx"],
      mimeTypes: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    });
    __publicField(this, "IMAGE", {
      extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"],
      mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/x-icon"]
    });
    __publicField(this, "PDF", {
      extensions: ["pdf"],
      mimeTypes: ["application/pdf"]
    });
    __publicField(this, "PRESENTATION", {
      extensions: ["ppt", "pptx", "odp", "otp"],
      mimeTypes: [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.oasis.opendocument.presentation",
        "application/vnd.oasis.opendocument.presentation-template"
      ]
    });
    __publicField(this, "SPREADSHEET", {
      extensions: ["xls", "xlsx", "ods", "ots"],
      mimeTypes: [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.oasis.opendocument.spreadsheet",
        "application/vnd.oasis.opendocument.spreadsheet-template"
      ]
    });
    __publicField(this, "TEXT", {
      extensions: ["txt", "odt", "md", "markdown", "mdown", "markdn", "csv"],
      mimeTypes: ["text/plain", "application/vnd.oasis.opendocument.text", "text/markdown", "text/csv"]
    });
    __publicField(this, "VIDEO", {
      extensions: ["mp4", "webm", "ogg", "mov", "avi"],
      mimeTypes: ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"]
    });
  }
};
var AudioPreviewer = class {
  constructor(previewSelector, file, container) {
    __publicField(this, "previewSelector");
    __publicField(this, "file");
    __publicField(this, "previewContainer");
    __publicField(this, "container");
    __publicField(this, "CLASS", "audio-preview");
    __publicField(this, "NOT_SUPPORTTED_FORMATS", []);
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
    let previewContainer = null;
    const fileExtension = this.file.name.split(".").pop() ?? "";
    if (this.NOT_SUPPORTTED_FORMATS.includes(fileExtension)) {
      console.warn("Audio format not supported");
      previewContainer = this.container.querySelector(
        `div${this.previewSelector}`
      );
      if (previewContainer === null) {
        previewContainer = document.createElement("div");
        previewContainer.classList.add("audio-preview");
      }
      if (this.previewSelector.startsWith("#")) {
        previewContainer.id = this.previewSelector.replace("#", "");
      }
      previewContainer.innerHTML = `
        Votre navigateur ne permet pas de lire les audios au format ".${fileExtension}". Mais vous pouvez toujours
        <a href="${url}">la t\xE9l\xE9charger</a> !
      `;
    } else {
      previewContainer = this.container.querySelector(
        `audio${this.previewSelector}`
      );
      if (previewContainer === null) {
        previewContainer = document.createElement("audio");
        if (this.previewSelector.startsWith("#")) {
          previewContainer.id = this.previewSelector.replace("#", "");
        }
        if (this.previewSelector.startsWith(".")) {
          previewContainer.classList.add(this.previewSelector.replace(".", ""));
        }
        this.container.insertAdjacentElement("beforeend", previewContainer);
      }
      const source = document.createElement("source");
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
    this.container.insertAdjacentElement("beforeend", this.previewContainer);
  }
};
var ImagePreviewer = class {
  constructor(previewSelector, file, container) {
    __publicField(this, "previewSelector");
    __publicField(this, "file");
    __publicField(this, "previewContainer");
    __publicField(this, "container");
    __publicField(this, "CLASS", "image-preview");
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
    let previewContainer = this.container.querySelector(
      this.previewSelector
    );
    if (previewContainer === null) {
      previewContainer = document.createElement("img");
      if (this.previewSelector.startsWith("#")) {
        previewContainer.id = this.previewSelector.replace("#", "");
      } else if (this.previewSelector.startsWith(".")) {
        previewContainer.classList.add(this.previewSelector.replace(".", ""));
      }
      this.container.insertAdjacentElement("beforeend", previewContainer);
    }
    this.previewContainer = previewContainer;
  }
  render() {
    const url = URL.createObjectURL(this.file);
    this.previewContainer.src = url;
    this.previewContainer.alt = `Preview ${this.file.name}`;
    this.previewContainer.title = `Preview ${this.file.name}`;
    this.previewContainer.onload = () => URL.revokeObjectURL(url);
  }
};
var VideoPreviewer = class {
  constructor(previewSelector, file, container) {
    __publicField(this, "previewSelector");
    __publicField(this, "file");
    __publicField(this, "previewContainer");
    __publicField(this, "container");
    __publicField(this, "CLASS", "video-preview");
    __publicField(this, "NOT_SUPPORTTED_FORMATS", ["mov"]);
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
    let previewContainer = null;
    const fileExtension = this.file.name.split(".").pop() ?? "";
    if (this.NOT_SUPPORTTED_FORMATS.includes(fileExtension)) {
      previewContainer = this.container.querySelector(
        `div${this.previewSelector}`
      );
      if (previewContainer === null) {
        previewContainer = document.createElement("div");
        previewContainer.classList.add("video-preview");
      }
      if (this.previewSelector.startsWith("#")) {
        previewContainer.id = this.previewSelector.replace("#", "");
      }
      previewContainer.innerHTML = `
      Votre navigateur ne permet pas de lire les vid\xE9os au format ".${fileExtension}". Mais vous pouvez toujours
      <a href="${url}">la t\xE9l\xE9charger</a> !
    `;
    } else {
      previewContainer = this.container.querySelector(
        `video${this.previewSelector}`
      );
      if (previewContainer === null) {
        previewContainer = document.createElement("video");
        if (this.previewSelector.startsWith("#")) {
          previewContainer.id = this.previewSelector.replace("#", "");
        }
        if (this.previewSelector.startsWith(".")) {
          previewContainer.classList.add(this.previewSelector.replace(".", ""));
        }
        this.container.insertAdjacentElement("beforeend", previewContainer);
      }
      const source = document.createElement("source");
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
    this.container.insertAdjacentElement("beforeend", this.previewContainer);
  }
};
var PDFPreviewer = class {
  constructor(previewSelector, file, container) {
    __publicField(this, "previewSelector");
    __publicField(this, "file");
    __publicField(this, "previewContainer");
    __publicField(this, "container");
    __publicField(this, "CLASS", "video-preview");
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
    let previewContainer = this.container.querySelector(
      this.previewSelector
    );
    if (previewContainer === null) {
      previewContainer = document.createElement("iframe");
      if (this.previewSelector.startsWith("#")) {
        previewContainer.id = this.previewSelector.replace("#", "");
      } else if (this.previewSelector.startsWith(".")) {
        previewContainer.classList.add(this.previewSelector.replace(".", ""));
      }
      this.container.insertAdjacentElement("beforeend", previewContainer);
    }
    this.previewContainer = previewContainer;
  }
  render() {
    const url = URL.createObjectURL(this.file);
    const content = `Votre navigateur ne prends pas en charge les iframes. Cliquez <a href=${url}>ici</a> pour t\xE9l\xE9charger le fichier PDF.`;
    this.previewContainer.src = url;
    this.previewContainer.style.border = "none";
    this.previewContainer.width = "100%";
    this.previewContainer.height = "600";
    this.previewContainer.innerHTML = content;
    this.previewContainer.onload = () => URL.revokeObjectURL(url);
  }
};
var Uploader = class {
  constructor(element, options) {
    __publicField(this, "element");
    __publicField(this, "options");
    __publicField(this, "errors");
    this.element = element;
    this.options = options;
    this.errors = { file: "", fileType: "", fileSize: "", fileCount: "" };
    this.init();
  }
  widgetSelector() {
    let widgetSelector = this.options?.previewSelector ?? window.sessionStorage.getItem("previewSelector") ?? "";
    if (widgetSelector === "" && this.options.preview === true) {
      const selector = Str.random(10);
      window.sessionStorage.setItem("previewSelector", selector);
      widgetSelector = `#${selector}`;
    }
    this.options.previewSelector = widgetSelector;
  }
  setUpOptions() {
    const defaultOptions = {
      multiple: false,
      fileType: "*",
      previewSelector: void 0,
      preview: false,
      maxFileSize: "10M",
      maxFiles: 1
    };
    this.options = { ...defaultOptions, ...this.options };
  }
  getErrorsContainer() {
    const parent = this.getElementContainer();
    let errorContainer = parent.querySelector(".invalid-feedback");
    if ((errorContainer === void 0 || errorContainer === null) && this.hasErrors()) {
      errorContainer = document.createElement("small");
      errorContainer.classList.add("invalid-feedback");
    }
    return errorContainer;
  }
  checkFileType(file) {
    const fileExtension = file.name.split(".").pop() ?? "";
    const fileMimeType = file.type;
    let acceptedFileTypes = [];
    let acceptedFileExtensions = [];
    const objFileType = new FileType();
    switch (this.options.fileType) {
      case "*":
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
          ...objFileType.VIDEO.mimeTypes
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
          ...objFileType.VIDEO.extensions
        ];
        break;
      case "ARCHIVE":
        acceptedFileTypes = objFileType.ARCHIVE.mimeTypes;
        acceptedFileExtensions = objFileType.ARCHIVE.extensions;
        break;
      case "AUDIO":
        acceptedFileTypes = objFileType.AUDIO.mimeTypes;
        acceptedFileExtensions = objFileType.AUDIO.extensions;
        break;
      case "CODE":
        acceptedFileTypes = objFileType.CODE.mimeTypes;
        acceptedFileExtensions = objFileType.CODE.extensions;
        break;
      case "DOCUMENT":
        acceptedFileTypes = objFileType.DOCUMENT.mimeTypes;
        acceptedFileExtensions = objFileType.DOCUMENT.extensions;
        break;
      case "IMAGE":
        acceptedFileTypes = objFileType.IMAGE.mimeTypes;
        acceptedFileExtensions = objFileType.IMAGE.extensions;
        break;
      case "PDF":
        acceptedFileTypes = objFileType.PDF.mimeTypes;
        acceptedFileExtensions = objFileType.PDF.extensions;
        break;
      case "PRESENTATION":
        acceptedFileTypes = objFileType.PRESENTATION.mimeTypes;
        acceptedFileExtensions = objFileType.PRESENTATION.extensions;
        break;
      case "SPREADSHEET":
        acceptedFileTypes = objFileType.SPREADSHEET.mimeTypes;
        acceptedFileExtensions = objFileType.SPREADSHEET.extensions;
        break;
      case "TEXT":
        acceptedFileTypes = objFileType.TEXT.mimeTypes;
        acceptedFileExtensions = objFileType.TEXT.extensions;
        break;
      case "VIDEO":
        acceptedFileTypes = objFileType.VIDEO.mimeTypes;
        acceptedFileExtensions = objFileType.VIDEO.extensions;
        break;
      default:
        this.errors.fileType = "Invalid file type";
        break;
    }
    if (acceptedFileTypes.includes(fileMimeType) === false || acceptedFileExtensions.includes(fileExtension) === false) {
      this.errors.fileType = "File type is not supported";
      return;
    } else {
      if (this.errors.fileType) {
        delete this.errors.fileType;
      }
    }
  }
  checkFileSize(file) {
    const fileSizeBytes = file.size;
    const maxSize = this.options.maxFileSize ?? "20M";
    if (isFileSizeValid(fileSizeBytes, maxSize) === false) {
      this.errors.fileSize = `File size exceeds the limit of ${maxSize}B`;
    } else {
      if (this.errors.fileSize) {
        delete this.errors.fileSize;
      }
    }
  }
  hasErrors() {
    for (const error in this.errors) {
      if (this.errors[error] === "") {
        delete this.errors[error];
      }
    }
    return Object.keys(this.errors).length > 0;
  }
  handlePreview(file) {
    if (this.options.preview === false) {
      return;
    }
    if (this.options.fileType === "IMAGE") {
      new ImagePreviewer(this.options.previewSelector, file, this.getElementContainer());
    }
    if (this.options.fileType === "AUDIO") {
      new AudioPreviewer(this.options.previewSelector, file, this.getElementContainer());
    }
    if (this.options.fileType === "VIDEO" && window.innerWidth > 768) {
      new VideoPreviewer(this.options.previewSelector, file, this.getElementContainer());
    }
    if (this.options.fileType === "PDF" && window.innerWidth > 768) {
      new PDFPreviewer(this.options.previewSelector, file, this.getElementContainer());
    }
    this.widgetSelector();
  }
  handleErrors() {
    const errorContainer = this.getErrorsContainer();
    const container = this.getElementContainer();
    if (this.hasErrors() === false) {
      errorContainer && errorContainer.remove();
      $(this.element).classList.remove("is-invalid");
      return;
    }
    let errorText = "";
    for (const error in this.errors) {
      if (this.errors[error] !== "") {
        errorText += `${this.errors[error]}. `;
      }
    }
    errorContainer.innerHTML = errorText;
    $(this.element).classList.add("is-invalid");
    container.insertAdjacentElement("beforeend", errorContainer);
  }
  handleFileChange(event) {
    const fileList = Array.from(event.target.files);
    if (fileList.length === 0) {
      this.errors.fileCount = "No file selected";
    } else if (fileList.length > 1) {
      this.errors.fileCount = "Multiple files selection is not supported. Please select only one file";
    } else {
      if (this.errors.hasOwnProperty("fileCount")) {
        delete this.errors.fileCount;
      }
      fileList.forEach((file, i) => {
        this.checkFileType(file);
        this.checkFileSize(file);
      });
    }
    this.handleErrors();
    if (this.hasErrors() === false) {
      fileList.forEach((file, i) => {
        this.handlePreview(file);
      });
    } else {
      if (this.options.preview === true) {
        const container = this.getElementContainer();
        const previewContainer = container.querySelector(this.options.previewSelector);
        previewContainer && previewContainer.remove();
      }
    }
  }
  getElementContainer() {
    const parentElement = $(this.element).parentElement;
    return parentElement;
  }
  init() {
    this.setUpOptions();
    this.errors = { file: "", fileType: "", fileSize: "", fileCount: "" };
    $(this.element).addEventListener("change", this.handleFileChange.bind(this));
  }
};
