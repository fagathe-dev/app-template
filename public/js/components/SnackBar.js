var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/components/SnackBar.ts
var _SnackBar = class _SnackBar {
  /**
   * Creates a new SnackBar instance
   * @param message - The text content to display
   * @param status - The notification status type
   * @param options - Configuration options for the snackbar
   */
  constructor(message, status = _SnackBar.DEFAULT_STATUS, options = {}) {
    // DOM elements
    __publicField(this, "snackBarContainer");
    __publicField(this, "content", null);
    // Configuration
    __publicField(this, "status");
    __publicField(this, "message");
    __publicField(this, "options");
    this.message = message;
    this.status = this.mapStatus(status);
    this.options = { ..._SnackBar.DEFAULT_OPTIONS, ...options };
    this.snackBarContainer = this.getOrCreateContainer();
    this.render();
  }
  /**
   * Maps the input status to the appropriate Bootstrap status
   */
  mapStatus(status) {
    return _SnackBar.STATUS_MAPPING[status] || _SnackBar.DEFAULT_STATUS;
  }
  /**
   * Determines the appropriate text color based on the status
   */
  getTextColor() {
    return this.status === "warning" ? "dark" : "white";
  }
  /**
   * Gets existing snackbar container or creates a new one
   */
  getOrCreateContainer() {
    let container = document.querySelector(".snackbar");
    if (!container) {
      container = this.createContainer();
      document.body.appendChild(container);
    }
    return container;
  }
  /**
   * Creates a new snackbar container with proper attributes
   */
  createContainer() {
    const container = document.createElement("div");
    container.className = "snackbar";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    return container;
  }
  /**
   * Creates the snackbar content element
   */
  createContent() {
    this.content = document.createElement("div");
    this.content.className = this.buildContentClasses();
    this.content.setAttribute("role", "alert");
    this.content.innerHTML = this.buildContentHTML();
    this.attachDismissHandler();
  }
  /**
   * Builds the CSS classes for the content element
   */
  buildContentClasses() {
    return [
      "alert",
      "alert-dismissible",
      `bg-${this.status}`,
      `border-${this.status}`,
      `text-${this.getTextColor()}`,
      "shadow",
      "mb-2"
    ].join(" ");
  }
  /**
   * Builds the HTML content for the snackbar
   */
  buildContentHTML() {
    const header = this.options.header ? `<strong>${this.escapeHtml(this.options.header)}</strong><br>` : "";
    const message = this.escapeHtml(this.message);
    return `
      ${header}${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
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
   * Attaches the dismiss handler to the close button
   */
  attachDismissHandler() {
    const closeButton = this.content?.querySelector(".btn-close");
    closeButton?.addEventListener("click", () => this.dismiss());
  }
  /**
   * Sets up auto-hide functionality if enabled
   */
  setupAutoHide() {
    if (this.options.autoHide && this.options.duration > 0) {
      setTimeout(() => this.dismiss(), this.options.duration);
    }
  }
  /**
   * Dismisses the snackbar and removes it from the DOM
   */
  dismiss() {
    if (this.content) {
      this.content.remove();
      this.content = null;
    }
  }
  /**
   * Renders the snackbar to the DOM
   */
  render() {
    this.createContent();
    if (this.content) {
      this.snackBarContainer.insertAdjacentElement("afterbegin", this.content);
      this.setupAutoHide();
    }
  }
  /**
   * Gets the current options configuration
   */
  getOptions() {
    return { ...this.options };
  }
};
// Constants for default configuration
__publicField(_SnackBar, "DEFAULT_STATUS", "info");
__publicField(_SnackBar, "DEFAULT_OPTIONS", {
  duration: 1e4,
  header: "",
  autoHide: true
});
__publicField(_SnackBar, "STATUS_MAPPING", {
  success: "success",
  danger: "danger",
  warning: "warning",
  info: "primary",
  primary: "primary"
});
var SnackBar = _SnackBar;
export {
  SnackBar
};
