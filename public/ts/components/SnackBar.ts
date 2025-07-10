import { SnackBarOptions, SnackBarStatus, SnackBarTextColor } from "../types/snackbar";

class SnackBar {
  content: HTMLDivElement | null = null;
  snackBar: HTMLDivElement | null = null;
  dismissButton = document.createElement('button');

  status: SnackBarStatus;
  message: string;
  options: SnackBarOptions;

  constructor(message: string, status: SnackBarStatus = 'info', options: SnackBarOptions) {
    this.message = message;
    this.status = this.getStatusMapping(status);
    this.options = options;
    this.setUpOptions();
    this.render();
  }

  setUpOptions() {
    const defaultOptions: SnackBarOptions = {
      duration: 10000,
      header: undefined,
      autoHide: true,
    };

    this.options = { ...defaultOptions, ...this.options };
  }

  getOptions() {
    return this.options;
  }

  getStatusMapping = (status: SnackBarStatus): SnackBarStatus => {
    const mapping = {
      success: 'success',
      danger: 'danger',
      warning: 'warning',
      info: 'primary',
      primary: 'primary',
    };

    return mapping[status] as SnackBarStatus;
  };

  getTextColor(): SnackBarTextColor {
    let color: SnackBarTextColor;

    switch (this.status) {
      case 'warning':
        color = 'dark';
        break;

      default:
        color = 'white';
        break;
    }

    return color;
  }

  setUpSnackbar() {
    this.snackBar = document.body.querySelector('.snackbar') as HTMLDivElement;
    if (this.snackBar === null || this.snackBar === undefined) {
      this.snackBar = document.createElement('div');
      this.snackBar.classList.add('snackbar');
    }
    document.body.insertAdjacentElement('beforeend', this.snackBar);
  }

  autoHide() {
    if (this.options.duration !== undefined) {
      setTimeout(() => this.content?.remove(), this.options.duration);
    }
  }

  setUpContent() {
    this.content = document.createElement('div');
    this.content.classList.add(
      'alert',
      'alert-dismissible',
      `bg-${this.status}`,
      `border-${this.status}`,
      `text-${this.getTextColor()}`,
      'shadow'
    );
    this.content.innerHTML = `
      ${this.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    this.snackBar?.insertAdjacentElement('afterbegin', this.content);
  }

  render() {
    this.setUpSnackbar();
    this.setUpContent();
    if (this.options.autoHide) {
      this.autoHide();
    }
  }
}

export { SnackBar };
