var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/components/Alert.ts
var _Alert = class _Alert {
  /**
   * Creates a new Alert instance
   * @param message - The text content to display
   * @param type - The alert status type (info, success, warning, danger)
   * @param options - Configuration options for the alert
   */
  constructor(message, type = _Alert.DEFAULT_TYPE, options = {}) {
    // DOM elements
    __publicField(this, "alertContainer", null);
    __publicField(this, "alert", null);
    __publicField(this, "closeButton", null);
    // State management
    __publicField(this, "dismissTimeout", null);
    __publicField(this, "options");
    __publicField(this, "type");
    __publicField(this, "message");
    /**
     * Dismisses the alert and cleans up resources
     */
    __publicField(this, "dismiss", (event) => {
      event?.preventDefault();
      this.clearDismissTimeout();
      this.removeAlert();
    });
    this.message = message;
    this.type = type;
    this.options = { ..._Alert.DEFAULT_OPTIONS, ...options };
    this.initialize();
    this.render();
  }
  /**
   * Initializes the alert container and processes options
   */
  initialize() {
    this.setupContainer();
    this.processDuration();
  }
  /**
   * Sets up or finds the alert container in the DOM
   */
  setupContainer() {
    this.alertContainer = document.getElementById(this.options.containerId);
    if (!this.alertContainer) {
      this.alertContainer = this.createContainer();
      document.body.appendChild(this.alertContainer);
    }
  }
  /**
   * Creates a new container element for alerts
   */
  createContainer() {
    const container = document.createElement("div");
    container.id = this.options.containerId;
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    return container;
  }
  /**
   * Converts duration from seconds to milliseconds if needed
   */
  processDuration() {
    if (this.options.duration > 0 && this.options.duration < 100) {
      this.options.duration = this.options.duration * 1e3;
    }
  }
  /**
   * Clears the auto-dismiss timeout if it exists
   */
  clearDismissTimeout() {
    if (this.dismissTimeout) {
      window.clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
  }
  /**
   * Removes the alert element from the DOM
   */
  removeAlert() {
    if (this.alert) {
      this.alert.remove();
      this.alert = null;
    }
  }
  /**
   * Creates and configures the alert element
   */
  createAlert() {
    this.alert = document.createElement("div");
    this.alert.className = this.buildAlertClasses();
    this.alert.setAttribute("role", "alert");
    this.alert.innerHTML = `<small>${this.escapeHtml(this.message)}</small>`;
    if (this.options.dismissible) {
      this.attachDismissButton();
    }
  }
  /**
   * Builds the CSS classes for the alert element
   */
  buildAlertClasses() {
    const classes = ["alert", `alert-${this.type}`, "alert-borderless", "shadow", "fade", "show"];
    if (this.options.dismissible) {
      classes.push("alert-dismissible");
    }
    return classes.join(" ");
  }
  /**
   * Creates and attaches the dismiss button to the alert
   */
  attachDismissButton() {
    this.closeButton = document.createElement("button");
    this.closeButton.type = "button";
    this.closeButton.className = "btn-close";
    this.closeButton.setAttribute("data-bs-dismiss", "alert");
    this.closeButton.setAttribute("aria-label", "Close");
    this.closeButton.addEventListener("click", this.dismiss);
    this.alert?.appendChild(this.closeButton);
  }
  /**
   * Escapes HTML characters to prevent XSS attacks
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * Sets up auto-dismiss functionality if duration is specified
   */
  setupAutoDismiss() {
    if (this.options.duration > 0) {
      this.dismissTimeout = window.setTimeout(() => this.dismiss(), this.options.duration);
    }
  }
  /**
   * Renders the alert to the DOM
   */
  render() {
    this.createAlert();
    if (this.alert && this.alertContainer) {
      this.alertContainer.insertAdjacentElement("afterbegin", this.alert);
      this.setupAutoDismiss();
    }
  }
};
// Constants for default configuration
__publicField(_Alert, "DEFAULT_TYPE", "info");
__publicField(_Alert, "DEFAULT_CONTAINER_ID", "alert-container");
__publicField(_Alert, "DEFAULT_OPTIONS", {
  containerId: _Alert.DEFAULT_CONTAINER_ID,
  duration: 0,
  // 0 means no auto-dismiss
  dismissible: false
});
var Alert = _Alert;
export {
  Alert
};
