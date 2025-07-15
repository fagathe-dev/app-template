import { AlertStatus } from '../types/ui';

class Alert {
  alertContainer: HTMLDivElement | null = null;
  type: AlertStatus;
  message: string;
  alert: HTMLDivElement | null = null;
  closeButton: HTMLButtonElement | null = null;

  constructor(message: string, type: AlertStatus = 'info') {
    this.message = message;
    this.type = type;
    this.init();
    this.render();
  }

  init() {
    this.alertContainer = document.getElementById('alert-container') as HTMLDivElement;
    if (!this.alertContainer) {
      this.alertContainer = document.createElement('div');
      this.alertContainer.id = 'alert-container';
      document.body.appendChild(this.alertContainer);
    }
  }

  hide(e): void {
    e.preventDefault();
    this.alert?.remove();
  }

  setUpAlert() {
    this.alert = document.createElement('div');
    this.alert.className = `alert alert-${this.type}  alert-dismissible alert-borderless shadow fade show`;
    this.alert.role = 'alert';
    this.alert.innerHTML = `<small>${this.message}</small>`;

    this.closeButton = document.createElement('button');
    this.closeButton.className = 'btn-close';
    this.closeButton.setAttribute('data-bs-dismiss', 'alert');
    this.closeButton.setAttribute('aria-label', 'Close');
    this.closeButton.addEventListener('click', (e) => this.hide(e));

    this.alert.insertAdjacentElement('beforeend', this.closeButton);
  }

  render(): void {
    this.setUpAlert();

    this.alertContainer?.insertAdjacentElement('afterbegin', this.alert as HTMLDivElement);
  }
}

export { Alert };