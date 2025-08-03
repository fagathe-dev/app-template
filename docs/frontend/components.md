# Composants Frontend

## Vue d'ensemble

Ce document présente les composants frontend réutilisables de l'application, leur structure, leurs propriétés et leur utilisation. Chaque composant suit une architecture modulaire avec TypeScript et SCSS.

## Système de Composants

### Hiérarchie des composants

```
Components/
├── Base/                    # Composants de base
│   ├── Component           # Classe de base abstraite
│   └── EventEmitter        # Gestionnaire d'événements
├── UI/                     # Composants d'interface utilisateur
│   ├── Button              # Boutons et actions
│   ├── Modal               # Modales et overlays
│   ├── Dropdown            # Menus déroulants
│   ├── Tooltip             # Info-bulles
│   ├── Alert               # Messages d'alerte
│   ├── Loader              # Indicateurs de chargement
│   ├── Pagination          # Navigation par pages
│   └── Tabs                # Onglets
├── Forms/                  # Composants de formulaires
│   ├── FormValidator       # Validation de formulaires
│   ├── InputField          # Champs de saisie
│   ├── FileUpload          # Upload de fichiers
│   ├── DatePicker          # Sélecteur de date
│   └── AutoComplete        # Autocomplétion
├── Data/                   # Composants de données
│   ├── DataTable           # Tableaux de données
│   ├── Chart               # Graphiques
│   ├── Filter              # Filtres de données
│   └── Search              # Recherche
└── Layout/                 # Composants de mise en page
    ├── Sidebar             # Barre latérale
    ├── Header              # En-tête
    ├── Footer              # Pied de page
    └── Navigation          # Navigation
```

## Composants UI de Base

### Composant Button

```typescript
// assets/ts/components/ui/Button.ts
import { Component } from '../base/Component';

interface ButtonOptions {
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  loading: boolean;
  icon?: string;
  iconPosition: 'left' | 'right';
  loadingText?: string;
  ripple: boolean;
}

export class Button extends Component {
  private originalText: string;
  private originalHTML: string;
  private isLoading = false;

  protected getDefaultOptions(): ButtonOptions {
    return {
      variant: 'primary',
      size: 'md',
      disabled: false,
      loading: false,
      iconPosition: 'left',
      ripple: true,
    };
  }

  protected init(): void {
    super.init();
    this.originalText = this.element.textContent || '';
    this.originalHTML = this.element.innerHTML;
    this.applyInitialState();
  }

  protected bindEvents(): void {
    this.addEventListener('click', this.handleClick.bind(this));

    if (this.options.ripple) {
      this.addEventListener('click', this.createRipple.bind(this));
    }
  }

  private handleClick(event: MouseEvent): void {
    if (this.options.disabled || this.isLoading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.emit('button:click', { originalEvent: event });
  }

  private createRipple(event: MouseEvent): void {
    const button = this.element;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  private applyInitialState(): void {
    this.element.classList.add('btn');
    this.updateVariant();
    this.updateSize();
    this.updateDisabledState();

    if (this.options.loading) {
      this.setLoading(true);
    }
  }

  public setVariant(variant: ButtonOptions['variant']): void {
    // Supprimer les anciennes classes de variant
    this.element.classList.remove(
      'btn-primary',
      'btn-secondary',
      'btn-success',
      'btn-danger',
      'btn-warning',
      'btn-info',
      'btn-light',
      'btn-dark'
    );

    this.options.variant = variant;
    this.updateVariant();
  }

  private updateVariant(): void {
    this.element.classList.add(`btn-${this.options.variant}`);
  }

  public setSize(size: ButtonOptions['size']): void {
    this.element.classList.remove('btn-sm', 'btn-lg');
    this.options.size = size;
    this.updateSize();
  }

  private updateSize(): void {
    if (this.options.size !== 'md') {
      this.element.classList.add(`btn-${this.options.size}`);
    }
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.updateDisabledState();
  }

  private updateDisabledState(): void {
    if (this.options.disabled) {
      this.element.setAttribute('disabled', 'disabled');
      this.element.classList.add('disabled');
    } else {
      this.element.removeAttribute('disabled');
      this.element.classList.remove('disabled');
    }
  }

  public setLoading(loading: boolean): void {
    this.isLoading = loading;

    if (loading) {
      this.showLoadingState();
    } else {
      this.hideLoadingState();
    }
  }

  private showLoadingState(): void {
    const loadingHTML = `
            <span class="btn-spinner spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ${this.options.loadingText || 'Chargement...'}
        `;

    this.element.innerHTML = loadingHTML;
    this.element.classList.add('loading');
    this.setDisabled(true);
  }

  private hideLoadingState(): void {
    this.element.innerHTML = this.originalHTML;
    this.element.classList.remove('loading');
    this.setDisabled(this.options.disabled);
  }

  public setText(text: string): void {
    if (!this.isLoading) {
      this.element.textContent = text;
      this.originalText = text;
    }
  }

  public setIcon(icon: string, position: 'left' | 'right' = 'left'): void {
    if (this.isLoading) return;

    // Supprimer l'icône existante
    const existingIcon = this.element.querySelector('.btn-icon');
    if (existingIcon) {
      existingIcon.remove();
    }

    if (icon) {
      const iconElement = document.createElement('i');
      iconElement.className = `btn-icon ${icon}`;

      if (position === 'left') {
        iconElement.classList.add('me-2');
        this.element.prepend(iconElement);
      } else {
        iconElement.classList.add('ms-2');
        this.element.append(iconElement);
      }
    }
  }
}
```

### Composant Modal

```typescript
// assets/ts/components/ui/Modal.ts
import { Component } from '../base/Component';

interface ModalOptions {
  backdrop: boolean | 'static';
  keyboard: boolean;
  focus: boolean;
  closeOnBackdropClick: boolean;
  closeOnEscape: boolean;
  animation: boolean;
  size: 'sm' | 'md' | 'lg' | 'xl';
  centered: boolean;
  scrollable: boolean;
  fullscreen: boolean | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

export class Modal extends Component {
  private backdrop?: HTMLElement;
  private isOpen = false;
  private focusedElementBeforeOpen?: HTMLElement;

  protected getDefaultOptions(): ModalOptions {
    return {
      backdrop: true,
      keyboard: true,
      focus: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      animation: true,
      size: 'md',
      centered: false,
      scrollable: false,
      fullscreen: false,
    };
  }

  protected init(): void {
    super.init();
    this.setupModalStructure();
    this.applyConfiguration();
  }

  protected bindEvents(): void {
    // Boutons de fermeture
    this.querySelectorAll('[data-modal-close]').forEach((button) => {
      this.addEventListener('click', () => this.close(), button);
    });

    // Gestion clavier
    document.addEventListener('keydown', this.handleDocumentKeydown.bind(this));

    // Gestion focus trap
    this.addEventListener('keydown', this.handleFocusTrap.bind(this));
  }

  private setupModalStructure(): void {
    if (!this.element.classList.contains('modal')) {
      this.element.classList.add('modal');
    }

    // S'assurer que la structure modal-dialog existe
    let dialog = this.querySelector('.modal-dialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.className = 'modal-dialog';

      const content = document.createElement('div');
      content.className = 'modal-content';
      content.innerHTML = this.element.innerHTML;

      dialog.appendChild(content);
      this.element.innerHTML = '';
      this.element.appendChild(dialog);
    }
  }

  private applyConfiguration(): void {
    const dialog = this.querySelector('.modal-dialog')!;

    // Taille
    if (this.options.size !== 'md') {
      dialog.classList.add(`modal-${this.options.size}`);
    }

    // Centré
    if (this.options.centered) {
      dialog.classList.add('modal-dialog-centered');
    }

    // Scrollable
    if (this.options.scrollable) {
      dialog.classList.add('modal-dialog-scrollable');
    }

    // Fullscreen
    if (this.options.fullscreen) {
      if (typeof this.options.fullscreen === 'string') {
        dialog.classList.add(`modal-fullscreen-${this.options.fullscreen}-down`);
      } else {
        dialog.classList.add('modal-fullscreen');
      }
    }

    // Animation
    if (this.options.animation) {
      this.element.classList.add('fade');
    }
  }

  private handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen && this.options.closeOnEscape && this.options.keyboard) {
      this.close();
    }
  }

  private handleFocusTrap(event: KeyboardEvent): void {
    if (!this.isOpen || event.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        event.preventDefault();
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(this.element.querySelectorAll(selectors));
  }

  public open(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOpen) {
        resolve();
        return;
      }

      this.emit('modal:before-open');

      // Sauvegarder l'élément focusé
      this.focusedElementBeforeOpen = document.activeElement as HTMLElement;

      // Créer le backdrop
      if (this.options.backdrop) {
        this.createBackdrop();
      }

      // Empêcher le scroll du body
      document.body.classList.add('modal-open');

      // Afficher la modal
      this.element.style.display = 'block';
      this.element.setAttribute('aria-hidden', 'false');

      if (this.options.animation) {
        // Force reflow pour déclencher l'animation
        this.element.offsetHeight;
        this.element.classList.add('show');

        // Attendre la fin de l'animation
        setTimeout(() => {
          this.finalizeOpen();
          resolve();
        }, 150);
      } else {
        this.element.classList.add('show');
        this.finalizeOpen();
        resolve();
      }
    });
  }

  private finalizeOpen(): void {
    this.isOpen = true;

    // Gestion du focus
    if (this.options.focus) {
      this.setInitialFocus();
    }

    this.emit('modal:opened');
  }

  private setInitialFocus(): void {
    const autofocusElement = this.querySelector('[autofocus]') as HTMLElement;
    if (autofocusElement) {
      autofocusElement.focus();
      return;
    }

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      this.element.focus();
    }
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isOpen) {
        resolve();
        return;
      }

      this.emit('modal:before-close');

      if (this.options.animation) {
        this.element.classList.remove('show');

        setTimeout(() => {
          this.finalizeClose();
          resolve();
        }, 150);
      } else {
        this.element.classList.remove('show');
        this.finalizeClose();
        resolve();
      }
    });
  }

  private finalizeClose(): void {
    this.element.style.display = 'none';
    this.element.setAttribute('aria-hidden', 'true');

    // Supprimer le backdrop
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = undefined;
    }

    // Restaurer le scroll du body
    document.body.classList.remove('modal-open');

    // Restaurer le focus
    if (this.focusedElementBeforeOpen) {
      this.focusedElementBeforeOpen.focus();
      this.focusedElementBeforeOpen = undefined;
    }

    this.isOpen = false;
    this.emit('modal:closed');
  }

  private createBackdrop(): void {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';

    if (this.options.animation) {
      this.backdrop.classList.add('fade');
    }

    document.body.appendChild(this.backdrop);

    // Gestion du clic sur backdrop
    if (this.options.closeOnBackdropClick && this.options.backdrop !== 'static') {
      this.backdrop.addEventListener('click', () => this.close());
    }

    // Animation d'apparition
    if (this.options.animation) {
      setTimeout(() => {
        this.backdrop?.classList.add('show');
      }, 10);
    } else {
      this.backdrop.classList.add('show');
    }
  }

  public toggle(): Promise<void> {
    return this.isOpen ? this.close() : this.open();
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  // Méthodes pour modifier le contenu
  public setTitle(title: string): void {
    const titleElement = this.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  public setBody(content: string | HTMLElement): void {
    const bodyElement = this.querySelector('.modal-body');
    if (bodyElement) {
      if (typeof content === 'string') {
        bodyElement.innerHTML = content;
      } else {
        bodyElement.innerHTML = '';
        bodyElement.appendChild(content);
      }
    }
  }

  public setFooter(content: string | HTMLElement): void {
    let footerElement = this.querySelector('.modal-footer');

    if (!footerElement) {
      footerElement = document.createElement('div');
      footerElement.className = 'modal-footer';
      this.querySelector('.modal-content')?.appendChild(footerElement);
    }

    if (typeof content === 'string') {
      footerElement.innerHTML = content;
    } else {
      footerElement.innerHTML = '';
      footerElement.appendChild(content);
    }
  }
}
```

## Composants de Formulaires

### Composant FileUpload

```typescript
// assets/ts/components/forms/FileUpload.ts
import { Component } from '../base/Component';

interface FileUploadOptions {
  multiple: boolean;
  accept: string[];
  maxSize: number; // en bytes
  maxFiles: number;
  dragAndDrop: boolean;
  previewImages: boolean;
  showProgress: boolean;
  uploadUrl?: string;
  autoUpload: boolean;
  headers?: Record<string, string>;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

export class FileUpload extends Component {
  private files: Map<string, UploadedFile> = new Map();
  private input?: HTMLInputElement;
  private dropZone?: HTMLElement;
  private preview?: HTMLElement;

  protected getDefaultOptions(): FileUploadOptions {
    return {
      multiple: false,
      accept: [],
      maxSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 1,
      dragAndDrop: true,
      previewImages: true,
      showProgress: true,
      autoUpload: false,
      headers: {},
    };
  }

  protected init(): void {
    super.init();
    this.createStructure();
    this.setupInput();
    this.setupDropZone();
  }

  protected bindEvents(): void {
    if (this.input) {
      this.input.addEventListener('change', this.handleFileSelect.bind(this));
    }

    if (this.dropZone && this.options.dragAndDrop) {
      this.setupDragAndDrop();
    }
  }

  private createStructure(): void {
    this.element.innerHTML = `
            <div class="file-upload-container">
                <div class="file-upload-dropzone" data-dropzone>
                    <div class="file-upload-icon">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <div class="file-upload-text">
                        <p class="file-upload-main">Cliquez pour sélectionner des fichiers</p>
                        <p class="file-upload-sub">ou glissez-déposez vos fichiers ici</p>
                    </div>
                    <input type="file" class="file-upload-input" hidden>
                </div>
                <div class="file-upload-preview" data-preview></div>
            </div>
        `;

    this.input = this.querySelector('.file-upload-input')!;
    this.dropZone = this.querySelector('[data-dropzone]')!;
    this.preview = this.querySelector('[data-preview]')!;
  }

  private setupInput(): void {
    if (!this.input) return;

    if (this.options.multiple) {
      this.input.setAttribute('multiple', '');
    }

    if (this.options.accept.length > 0) {
      this.input.setAttribute('accept', this.options.accept.join(','));
    }
  }

  private setupDropZone(): void {
    if (!this.dropZone) return;

    this.dropZone.addEventListener('click', () => {
      this.input?.click();
    });
  }

  private setupDragAndDrop(): void {
    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];

    events.forEach((eventName) => {
      this.dropZone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      this.dropZone?.addEventListener(eventName, () => {
        this.dropZone?.classList.add('file-upload-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      this.dropZone?.addEventListener(eventName, () => {
        this.dropZone?.classList.remove('file-upload-dragover');
      });
    });

    this.dropZone?.addEventListener('drop', (e) => {
      const files = Array.from((e as DragEvent).dataTransfer?.files || []);
      this.handleFiles(files);
    });
  }

  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);
  }

  private handleFiles(files: File[]): void {
    // Vérifier le nombre maximum de fichiers
    const totalFiles = this.files.size + files.length;
    if (totalFiles > this.options.maxFiles) {
      this.emit('file:error', {
        type: 'max_files_exceeded',
        message: `Maximum ${this.options.maxFiles} fichier(s) autorisé(s)`,
      });
      return;
    }

    // Traiter chaque fichier
    files.forEach((file) => {
      if (this.validateFile(file)) {
        this.addFile(file);
      }
    });
  }

  private validateFile(file: File): boolean {
    // Vérifier la taille
    if (file.size > this.options.maxSize) {
      this.emit('file:error', {
        type: 'file_too_large',
        file: file.name,
        message: `Le fichier ${file.name} est trop volumineux (max: ${this.formatFileSize(this.options.maxSize)})`,
      });
      return false;
    }

    // Vérifier le type
    if (this.options.accept.length > 0) {
      const isAccepted = this.options.accept.some((accept) => {
        if (accept.startsWith('.')) {
          return file.name.toLowerCase().endsWith(accept.toLowerCase());
        }
        return file.type.match(accept.replace('*', '.*'));
      });

      if (!isAccepted) {
        this.emit('file:error', {
          type: 'invalid_file_type',
          file: file.name,
          message: `Type de fichier non autorisé: ${file.name}`,
        });
        return false;
      }
    }

    return true;
  }

  private addFile(file: File): void {
    const fileData: UploadedFile = {
      file,
      id: this.generateFileId(),
      status: 'pending',
      progress: 0,
    };

    this.files.set(fileData.id, fileData);
    this.renderFilePreview(fileData);
    this.emit('file:added', { file: fileData });

    if (this.options.autoUpload && this.options.uploadUrl) {
      this.uploadFile(fileData.id);
    }
  }

  private renderFilePreview(fileData: UploadedFile): void {
    const previewElement = document.createElement('div');
    previewElement.className = 'file-upload-item';
    previewElement.setAttribute('data-file-id', fileData.id);

    let previewContent = '';

    // Aperçu d'image
    if (this.options.previewImages && fileData.file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = previewElement.querySelector('.file-preview-image') as HTMLImageElement;
        if (img && e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(fileData.file);

      previewContent = `
                <div class="file-preview">
                    <img class="file-preview-image" alt="${fileData.file.name}">
                </div>
            `;
    } else {
      previewContent = `
                <div class="file-preview">
                    <div class="file-icon">
                        <i class="fas fa-file"></i>
                    </div>
                </div>
            `;
    }

    previewElement.innerHTML = `
            ${previewContent}
            <div class="file-info">
                <div class="file-name" title="${fileData.file.name}">${fileData.file.name}</div>
                <div class="file-size">${this.formatFileSize(fileData.file.size)}</div>
                <div class="file-progress" style="display: ${this.options.showProgress ? 'block' : 'none'}">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${fileData.progress}%"></div>
                    </div>
                </div>
                <div class="file-status">${this.getStatusText(fileData.status)}</div>
            </div>
            <div class="file-actions">
                <button type="button" class="btn btn-sm btn-danger" data-action="remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    // Actions
    const removeBtn = previewElement.querySelector('[data-action="remove"]');
    removeBtn?.addEventListener('click', () => this.removeFile(fileData.id));

    this.preview?.appendChild(previewElement);
  }

  private generateFileId(): string {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getStatusText(status: UploadedFile['status']): string {
    const statusTexts = {
      pending: 'En attente',
      uploading: 'Upload en cours...',
      completed: 'Terminé',
      error: 'Erreur',
    };
    return statusTexts[status];
  }

  public async uploadFile(fileId: string): Promise<void> {
    const fileData = this.files.get(fileId);
    if (!fileData || !this.options.uploadUrl) return;

    fileData.status = 'uploading';
    this.updateFileStatus(fileData);

    const formData = new FormData();
    formData.append('file', fileData.file);

    try {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (this.options.showProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            fileData.progress = Math.round((e.loaded / e.total) * 100);
            this.updateFileProgress(fileData);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          fileData.status = 'completed';
          fileData.url = response.url;
          fileData.progress = 100;
          this.updateFileStatus(fileData);
          this.emit('file:uploaded', { file: fileData, response });
        } else {
          throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
        }
      });

      xhr.addEventListener('error', () => {
        fileData.status = 'error';
        fileData.error = 'Erreur réseau';
        this.updateFileStatus(fileData);
        this.emit('file:error', { file: fileData, error: fileData.error });
      });

      xhr.open('POST', this.options.uploadUrl);

      // Headers personnalisés
      Object.entries(this.options.headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);
    } catch (error) {
      fileData.status = 'error';
      fileData.error = error instanceof Error ? error.message : 'Erreur inconnue';
      this.updateFileStatus(fileData);
      this.emit('file:error', { file: fileData, error: fileData.error });
    }
  }

  private updateFileStatus(fileData: UploadedFile): void {
    const element = this.querySelector(`[data-file-id="${fileData.id}"]`);
    if (!element) return;

    const statusElement = element.querySelector('.file-status');
    if (statusElement) {
      statusElement.textContent = this.getStatusText(fileData.status);
    }

    element.classList.remove('status-pending', 'status-uploading', 'status-completed', 'status-error');
    element.classList.add(`status-${fileData.status}`);
  }

  private updateFileProgress(fileData: UploadedFile): void {
    const element = this.querySelector(`[data-file-id="${fileData.id}"]`);
    if (!element) return;

    const progressBar = element.querySelector('.progress-bar') as HTMLElement;
    if (progressBar) {
      progressBar.style.width = `${fileData.progress}%`;
    }
  }

  public removeFile(fileId: string): void {
    const fileData = this.files.get(fileId);
    if (!fileData) return;

    this.files.delete(fileId);

    const element = this.querySelector(`[data-file-id="${fileId}"]`);
    element?.remove();

    this.emit('file:removed', { file: fileData });
  }

  public getFiles(): UploadedFile[] {
    return Array.from(this.files.values());
  }

  public getCompletedFiles(): UploadedFile[] {
    return this.getFiles().filter((file) => file.status === 'completed');
  }

  public uploadAll(): void {
    this.files.forEach((file, id) => {
      if (file.status === 'pending') {
        this.uploadFile(id);
      }
    });
  }

  public clear(): void {
    this.files.clear();
    if (this.preview) {
      this.preview.innerHTML = '';
    }
  }
}
```

Cette architecture de composants offre une base solide et réutilisable pour développer une interface utilisateur riche et interactive, avec une attention particulière portée à l'accessibilité, l'UX et la maintenabilité du code.
