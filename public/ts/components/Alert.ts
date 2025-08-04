import { AlertStatus } from '../types/ui';

/**
 * Configuration options for Alert component
 */
export interface AlertOptions {
  /** ID of the container where the alert will be displayed */
  containerId?: string;
  /** Display duration in milliseconds */
  duration?: number;
  /** Allow user to close the alert manually */
  dismissible?: boolean;
}

/**
 * Alert component for displaying notifications with various status types
 * Supports auto-dismiss, manual dismissal, and custom styling
 */
class Alert {
  // Constants for default configuration
  private static readonly DEFAULT_TYPE: AlertStatus = 'info';
  private static readonly DEFAULT_CONTAINER_ID = 'alert-container';
  private static readonly DEFAULT_OPTIONS: Required<AlertOptions> = {
    containerId: Alert.DEFAULT_CONTAINER_ID,
    duration: 0, // 0 means no auto-dismiss
    dismissible: false,
  };

  // DOM elements
  private alertContainer: HTMLDivElement | null = null;
  private alert: HTMLDivElement | null = null;
  private closeButton: HTMLButtonElement | null = null;

  // State management
  private dismissTimeout: number | null = null;
  private readonly options: Required<AlertOptions>;
  private readonly type: AlertStatus;
  private readonly message: string;

  /**
   * Creates a new Alert instance
   * @param message - The text content to display
   * @param type - The alert status type (info, success, warning, danger)
   * @param options - Configuration options for the alert
   */
  constructor(message: string, type: AlertStatus = Alert.DEFAULT_TYPE, options: AlertOptions = {}) {
    this.message = message;
    this.type = type;
    this.options = { ...Alert.DEFAULT_OPTIONS, ...options };

    this.initialize();
    this.render();
  }

  /**
   * Initializes the alert container and processes options
   */
  private initialize(): void {
    this.setupContainer();
    this.processDuration();
  }

  /**
   * Sets up or finds the alert container in the DOM
   */
  private setupContainer(): void {
    this.alertContainer = document.getElementById(this.options.containerId) as HTMLDivElement;

    if (!this.alertContainer) {
      this.alertContainer = this.createContainer();
      document.body.appendChild(this.alertContainer);
    }
  }

  /**
   * Creates a new container element for alerts
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = this.options.containerId;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    return container;
  }

  /**
   * Converts duration from seconds to milliseconds if needed
   */
  private processDuration(): void {
    // If duration is provided and seems to be in seconds (< 100), convert to milliseconds
    if (this.options.duration > 0 && this.options.duration < 100) {
      this.options.duration = this.options.duration * 1000;
    }
  }

  /**
   * Dismisses the alert and cleans up resources
   */
  public dismiss = (event?: Event): void => {
    event?.preventDefault();

    this.clearDismissTimeout();
    this.removeAlert();
  };

  /**
   * Clears the auto-dismiss timeout if it exists
   */
  private clearDismissTimeout(): void {
    if (this.dismissTimeout) {
      window.clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
  }

  /**
   * Removes the alert element from the DOM
   */
  private removeAlert(): void {
    if (this.alert) {
      this.alert.remove();
      this.alert = null;
    }
  }

  /**
   * Creates and configures the alert element
   */
  private createAlert(): void {
    this.alert = document.createElement('div');
    this.alert.className = this.buildAlertClasses();
    this.alert.setAttribute('role', 'alert');
    this.alert.innerHTML = `<small>${this.escapeHtml(this.message)}</small>`;

    if (this.options.dismissible) {
      this.attachDismissButton();
    }
  }

  /**
   * Builds the CSS classes for the alert element
   */
  private buildAlertClasses(): string {
    const classes = ['alert', `alert-${this.type}`, 'alert-borderless', 'shadow', 'fade', 'show'];

    if (this.options.dismissible) {
      classes.push('alert-dismissible');
    }

    return classes.join(' ');
  }

  /**
   * Creates and attaches the dismiss button to the alert
   */
  private attachDismissButton(): void {
    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'btn-close';
    this.closeButton.setAttribute('data-bs-dismiss', 'alert');
    this.closeButton.setAttribute('aria-label', 'Close');
    this.closeButton.addEventListener('click', this.dismiss);

    this.alert?.appendChild(this.closeButton);
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
   * Sets up auto-dismiss functionality if duration is specified
   */
  private setupAutoDismiss(): void {
    if (this.options.duration > 0) {
      this.dismissTimeout = window.setTimeout(() => this.dismiss(), this.options.duration);
    }
  }

  /**
   * Renders the alert to the DOM
   */
  private render(): void {
    this.createAlert();

    if (this.alert && this.alertContainer) {
      this.alertContainer.insertAdjacentElement('afterbegin', this.alert);
      this.setupAutoDismiss();
    }
  }
}

export { Alert };
