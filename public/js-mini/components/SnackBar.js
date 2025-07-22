var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/components/SnackBar.ts
var SnackBar = class {
  constructor(message, status = "info", options) {
    __publicField(this, "content", null);
    __publicField(this, "snackBar", null);
    __publicField(this, "dismissButton", document.createElement("button"));
    __publicField(this, "status");
    __publicField(this, "message");
    __publicField(this, "options");
    __publicField(this, "getStatusMapping", (status) => {
      const mapping = {
        success: "success",
        danger: "danger",
        warning: "warning",
        info: "primary",
        primary: "primary"
      };
      return mapping[status];
    });
    this.message = message;
    this.status = this.getStatusMapping(status);
    this.options = options;
    this.setUpOptions();
    this.render();
  }
  setUpOptions() {
    const defaultOptions = {
      duration: 1e4,
      header: void 0,
      autoHide: true
    };
    this.options = { ...defaultOptions, ...this.options };
  }
  getOptions() {
    return this.options;
  }
  getTextColor() {
    let color;
    switch (this.status) {
      case "warning":
        color = "dark";
        break;
      default:
        color = "white";
        break;
    }
    return color;
  }
  setUpSnackbar() {
    this.snackBar = document.body.querySelector(".snackbar");
    if (this.snackBar === null || this.snackBar === void 0) {
      this.snackBar = document.createElement("div");
      this.snackBar.classList.add("snackbar");
    }
    document.body.insertAdjacentElement("beforeend", this.snackBar);
  }
  autoHide() {
    if (this.options.duration !== void 0) {
      setTimeout(() => this.content?.remove(), this.options.duration);
    }
  }
  setUpContent() {
    this.content = document.createElement("div");
    this.content.classList.add(
      "alert",
      "alert-dismissible",
      `bg-${this.status}`,
      `border-${this.status}`,
      `text-${this.getTextColor()}`,
      "shadow"
    );
    this.content.innerHTML = `
      ${this.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    this.snackBar?.insertAdjacentElement("afterbegin", this.content);
  }
  render() {
    this.setUpSnackbar();
    this.setUpContent();
    if (this.options.autoHide) {
      this.autoHide();
    }
  }
};
export {
  SnackBar
};
