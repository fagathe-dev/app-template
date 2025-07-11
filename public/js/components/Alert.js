var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/components/Alert.ts
var Alert = class {
  constructor(message, type = "info") {
    __publicField(this, "alertContainer", null);
    __publicField(this, "type");
    __publicField(this, "message");
    __publicField(this, "alert", null);
    __publicField(this, "closeButton", null);
    this.message = message;
    this.type = type;
    this.init();
    this.render();
  }
  init() {
    this.alertContainer = document.getElementById("alert-container");
    if (!this.alertContainer) {
      this.alertContainer = document.createElement("div");
      this.alertContainer.id = "alert-container";
      document.body.appendChild(this.alertContainer);
    }
  }
  hide(e) {
    e.preventDefault();
    this.alert?.remove();
  }
  setUpAlert() {
    this.alert = document.createElement("div");
    this.alert.className = `alert alert-${this.type}  alert-dismissible alert-borderless shadow fade show`;
    this.alert.role = "alert";
    this.alert.innerHTML = `<small>${this.message}</small>`;
    this.closeButton = document.createElement("button");
    this.closeButton.className = "btn-close";
    this.closeButton.setAttribute("data-bs-dismiss", "alert");
    this.closeButton.setAttribute("aria-label", "Close");
    this.closeButton.addEventListener("click", (e) => this.hide(e));
    this.alert.insertAdjacentElement("beforeend", this.closeButton);
  }
  render() {
    this.setUpAlert();
    this.alertContainer?.insertAdjacentElement("afterbegin", this.alert);
  }
};
export {
  Alert
};
