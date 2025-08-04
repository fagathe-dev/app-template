import { SnackBarOptions, SnackBarStatus, SnackBarTextColor } from '../types/ui';

/**
 * SnackBar component for displaying temporary notification messages
 * Provides a more prominent notification system compared to alerts
 */
class SnackBar {
  // Constants for default configuration
  private static readonly DEFAULT_STATUS: SnackBarStatus = 'info';
  private static readonly DEFAULT_OPTIONS: Required<SnackBarOptions> = {
    duration: 10000,
    header: '',
    autoHide: true,
  };

  private static readonly STATUS_MAPPING: Record<SnackBarStatus, SnackBarStatus> = {
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    info: 'primary',
    primary: 'primary',
  };

  // DOM elements
  private readonly snackBarContainer: HTMLDivElement;
  private content: HTMLDivElement | null = null;

  // Configuration
  private readonly status: SnackBarStatus;
  private readonly message: string;
  private readonly options: Required<SnackBarOptions>;

  /**
   * Creates a new SnackBar instance
   * @param message - The text content to display
   * @param status - The notification status type
   * @param options - Configuration options for the snackbar
   */
  constructor(message: string, status: SnackBarStatus = SnackBar.DEFAULT_STATUS, options: SnackBarOptions = {}) {
    this.message = message;
    this.status = this.mapStatus(status);
    this.options = { ...SnackBar.DEFAULT_OPTIONS, ...options };

    this.snackBarContainer = this.getOrCreateContainer();
    this.render();
  }

  /**
   * Maps the input status to the appropriate Bootstrap status
   */
  private mapStatus(status: SnackBarStatus): SnackBarStatus {
    return SnackBar.STATUS_MAPPING[status] || SnackBar.DEFAULT_STATUS;
  }

  /**
   * Determines the appropriate text color based on the status
   */
  private getTextColor(): SnackBarTextColor {
    return this.status === 'warning' ? 'dark' : 'white';
  }

  /**
   * Gets existing snackbar container or creates a new one
   */
  private getOrCreateContainer(): HTMLDivElement {
    let container = document.querySelector('.snackbar') as HTMLDivElement;

    if (!container) {
      container = this.createContainer();
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Creates a new snackbar container with proper attributes
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'snackbar';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    return container;
  }

  /**
   * Creates the snackbar content element
   */
  private createContent(): void {
    this.content = document.createElement('div');
    this.content.className = this.buildContentClasses();
    this.content.setAttribute('role', 'alert');
    this.content.innerHTML = this.buildContentHTML();

    this.attachDismissHandler();
  }

  /**
   * Builds the CSS classes for the content element
   */
  private buildContentClasses(): string {
    return [
      'alert',
      'alert-dismissible',
      `bg-${this.status}`,
      `border-${this.status}`,
      `text-${this.getTextColor()}`,
      'shadow',
      'mb-2',
    ].join(' ');
  }

  /**
   * Builds the HTML content for the snackbar
   */
  private buildContentHTML(): string {
    const header = this.options.header ? `<strong>${this.escapeHtml(this.options.header)}</strong><br>` : '';

    const message = this.escapeHtml(this.message);

    return `
      ${header}${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  }

  /**
   * Escapes HTML characters to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Attaches the dismiss handler to the close button
   */
  private attachDismissHandler(): void {
    const closeButton = this.content?.querySelector('.btn-close');
    closeButton?.addEventListener('click', () => this.dismiss());
  }

  /**
   * Sets up auto-hide functionality if enabled
   */
  private setupAutoHide(): void {
    if (this.options.autoHide && this.options.duration > 0) {
      setTimeout(() => this.dismiss(), this.options.duration);
    }
  }

  /**
   * Dismisses the snackbar and removes it from the DOM
   */
  private dismiss(): void {
    if (this.content) {
      this.content.remove();
      this.content = null;
    }
  }

  /**
   * Renders the snackbar to the DOM
   */
  private render(): void {
    this.createContent();

    if (this.content) {
      this.snackBarContainer.insertAdjacentElement('afterbegin', this.content);
      this.setupAutoHide();
    }
  }

  /**
   * Gets the current options configuration
   */
  public getOptions(): Required<SnackBarOptions> {
    return { ...this.options };
  }
}

export { SnackBar };
