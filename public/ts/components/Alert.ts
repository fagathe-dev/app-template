import { AlertStatus } from '../types/ui';

export interface AlertOptions {
  containerId?: string; // ID of the container where the alert will be displayed
  duration?: number; // Display duration in milliseconds (optional)
  dismissible?: boolean; // Allow user to close the alert (optional)
}

class Alert {
  private static readonly DEFAULT_TYPE: AlertStatus = 'info';
  private static readonly DEFAULT_CONTAINER_ID = 'alert-container';
  private static readonly DEFAULT_OPTIONS: AlertOptions = {
    containerId: Alert.DEFAULT_CONTAINER_ID,
    dismissible: false,
  };

  private alertContainer: HTMLDivElement | null = null;
  private options: AlertOptions;
  private alert: HTMLDivElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private dismissTimeout: number | null = null;

  private readonly type: AlertStatus;
  private readonly message: string;

  constructor(message: string, type: AlertStatus = Alert.DEFAULT_TYPE, options: AlertOptions = {}) {
    this.message = message;
    this.type = type;
    this.options = { ...Alert.DEFAULT_OPTIONS, ...options };
    this.init();
    this.render();
  }

  private init(): void {
    this.alertContainer = document.getElementById(
      this.options.containerId || Alert.DEFAULT_CONTAINER_ID
    ) as HTMLDivElement;

    if (!this.alertContainer) {
      this.alertContainer = document.createElement('div');
      this.alertContainer.id = this.options.containerId || Alert.DEFAULT_CONTAINER_ID;
      document.body.appendChild(this.alertContainer);
    }

    if (this.options.duration) {
      this.options.duration = this.options.duration * 1000;
    }
  }

  public dismiss = (e?: Event): void => {
    if (e) {
      e.preventDefault();
    }
    if (this.dismissTimeout) {
      window.clearTimeout(this.dismissTimeout);
    }
    
    this.alert?.remove();
  };

  private setUpAlert(): void {
    this.alert = document.createElement('div');
    this.alert.className = `alert alert-${this.type} alert-borderless shadow fade show${
      this.options.dismissible ? ' alert-dismissible' : ''
    }`;
    this.alert.role = 'alert';
    this.alert.innerHTML = `<small>${this.message}</small>`;

    if (this.options.dismissible) {
      this.closeButton = document.createElement('button');
      this.closeButton.className = 'btn-close';
      this.closeButton.setAttribute('data-bs-dismiss', 'alert');
      this.closeButton.setAttribute('aria-label', 'Close');
      this.closeButton.addEventListener('click', this.dismiss);

      this.alert.insertAdjacentElement('beforeend', this.closeButton);
    }
  }

  private render(): void {
    this.setUpAlert();
    this.alertContainer?.insertAdjacentElement('afterbegin', this.alert as HTMLDivElement);
    if (this.options.duration && this.options.duration > 0) {
      this.dismissTimeout = window.setTimeout(() => this.dismiss(), this.options.duration);
    }
  }
}

/**
 * Usage Examples:
 *
 * // Basic info alert
 * new Alert('Operation completed successfully');
 *
 * // Success alert with options
 * new Alert('Data saved successfully!', 'success', {
 *   containerId: 'custom-container',
 *   duration: 5000,
 *   dismissible: true
 * });
 *
 * // Warning alert with auto-dismiss
 * new Alert('Please check your input', 'warning', {
 *   duration: 3000
 * });
 *
 * // Error alert with custom container
 * new Alert('An error occurred while processing your request', 'danger', {
 *   containerId: 'error-container',
 *   dismissible: true
 * });
 *
 * Note: AlertStatus types available: 'info' | 'success' | 'warning' | 'danger'
 */

export { Alert };
