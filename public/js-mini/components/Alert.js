var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value })
    : (obj[key] = value);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);

// public/ts/components/Alert.ts
var _Alert = class _Alert {
  constructor(message, type = _Alert.DEFAULT_TYPE, options = {}) {
    __publicField(this, 'alertContainer', null);
    __publicField(this, 'options');
    __publicField(this, 'alert', null);
    __publicField(this, 'closeButton', null);
    __publicField(this, 'dismissTimeout', null);
    __publicField(this, 'type');
    __publicField(this, 'message');
    __publicField(this, 'dismiss', (e) => {
      if (e) {
        e.preventDefault();
      }
      if (this.dismissTimeout) {
        window.clearTimeout(this.dismissTimeout);
      }
      this.alert?.remove();
    });
    this.message = message;
    this.type = type;
    this.options = { ..._Alert.DEFAULT_OPTIONS, ...options };
    this.init();
    this.render();
  }
  init() {
    this.alertContainer = document.getElementById(this.options.containerId || _Alert.DEFAULT_CONTAINER_ID);
    if (!this.alertContainer) {
      this.alertContainer = document.createElement('div');
      this.alertContainer.id = this.options.containerId || _Alert.DEFAULT_CONTAINER_ID;
      document.body.appendChild(this.alertContainer);
    }
    if (this.options.duration) {
      this.options.duration = this.options.duration * 1e3;
    }
  }
  setUpAlert() {
    this.alert = document.createElement('div');
    this.alert.className = `alert alert-${this.type} alert-borderless shadow fade show${this.options.dismissible ? ' alert-dismissible' : ''}`;
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
  render() {
    this.setUpAlert();
    this.alertContainer?.insertAdjacentElement('afterbegin', this.alert);
    if (this.options.duration && this.options.duration > 0) {
      this.dismissTimeout = window.setTimeout(() => this.dismiss(), this.options.duration);
    }
  }
};
__publicField(_Alert, 'DEFAULT_TYPE', 'info');
__publicField(_Alert, 'DEFAULT_CONTAINER_ID', 'alert-container');
__publicField(_Alert, 'DEFAULT_OPTIONS', {
  containerId: _Alert.DEFAULT_CONTAINER_ID,
  dismissible: false,
});
var Alert = _Alert;
export { Alert };
