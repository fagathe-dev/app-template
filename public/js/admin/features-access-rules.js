var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/components/Alert.ts
var _Alert = class _Alert {
  constructor(message, type = _Alert.DEFAULT_TYPE, options = {}) {
    __publicField(this, "alertContainer", null);
    __publicField(this, "options");
    __publicField(this, "alert", null);
    __publicField(this, "closeButton", null);
    __publicField(this, "dismissTimeout", null);
    __publicField(this, "type");
    __publicField(this, "message");
    __publicField(this, "dismiss", (e) => {
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
    this.alertContainer = document.getElementById(
      this.options.containerId || _Alert.DEFAULT_CONTAINER_ID
    );
    if (!this.alertContainer) {
      this.alertContainer = document.createElement("div");
      this.alertContainer.id = this.options.containerId || _Alert.DEFAULT_CONTAINER_ID;
      document.body.appendChild(this.alertContainer);
    }
    if (this.options.duration) {
      this.options.duration = this.options.duration * 1e3;
    }
  }
  setUpAlert() {
    this.alert = document.createElement("div");
    this.alert.className = `alert alert-${this.type} alert-borderless shadow fade show${this.options.dismissible ? " alert-dismissible" : ""}`;
    this.alert.role = "alert";
    this.alert.innerHTML = `<small>${this.message}</small>`;
    if (this.options.dismissible) {
      this.closeButton = document.createElement("button");
      this.closeButton.className = "btn-close";
      this.closeButton.setAttribute("data-bs-dismiss", "alert");
      this.closeButton.setAttribute("aria-label", "Close");
      this.closeButton.addEventListener("click", this.dismiss);
      this.alert.insertAdjacentElement("beforeend", this.closeButton);
    }
  }
  render() {
    this.setUpAlert();
    this.alertContainer?.insertAdjacentElement("afterbegin", this.alert);
    if (this.options.duration && this.options.duration > 0) {
      this.dismissTimeout = window.setTimeout(() => this.dismiss(), this.options.duration);
    }
  }
};
__publicField(_Alert, "DEFAULT_TYPE", "info");
__publicField(_Alert, "DEFAULT_CONTAINER_ID", "alert-container");
__publicField(_Alert, "DEFAULT_OPTIONS", {
  containerId: _Alert.DEFAULT_CONTAINER_ID,
  dismissible: false
});
var Alert = _Alert;

// public/ts/utils/fetch.ts
var ApiError = class extends Error {
  constructor(status, statusText, message, response, data) {
    super(message);
    __publicField(this, "ok", false);
    __publicField(this, "headers");
    __publicField(this, "status");
    __publicField(this, "statusText");
    __publicField(this, "data");
    __publicField(this, "response");
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.headers = response.headers;
    this.data = data;
  }
};
var fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers
      }
    });
    const clonedResponse = response.clone();
    const contentType = response.headers.get("content-type");
    let data;
    let text;
    let blob;
    text = await clonedResponse.text();
    try {
      data = contentType?.includes("application/json") ? JSON.parse(text) : {};
    } catch (e) {
      data = {};
    }
    blob = await response.clone().blob();
    const fetchResponse = {
      ok: response.ok,
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
      data,
      text,
      blob
    };
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        typeof data === "object" && data && "message" in data ? String(data.message) : `Request failed with status ${response.status}`,
        response,
        data
      );
    }
    return fetchResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("throw ERROR");
      console.log(error);
      return error;
    }
    console.log("ICI");
    const errorResponse = new Response(null, { status: 0, statusText: "Network Error" });
    return new ApiError(
      0,
      "Network Error",
      error instanceof Error ? error.message : "Unknown error occurred",
      errorResponse,
      { message: "Network Error" }
    );
  }
};

// public/ts/admin/features-access-rules.ts
var deleteFeature = async (e) => {
  e.preventDefault();
  const targetElement = e.target;
  const url = targetElement.tagName !== "A" ? targetElement.closest("a[href]").href : targetElement.href;
  if (confirm("\xCAtes-vous s\xFBr de vouloir supprimer cette fonctionnalit\xE9 ?")) {
    try {
      const res = await fetchAPI(url, {
        method: "DELETE"
      });
      if (res.ok) {
        new Alert("La fonctionnalit\xE9 a \xE9t\xE9 supprim\xE9e avec succ\xE8s \u{1F680}", "success");
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
          window.location.reload();
        }, 5e3);
      } else {
        console.error("Erreur lors de la suppression de la fonctionnalit\xE9.");
        new Alert("Erreur lors de la suppression de la fonctionnalit\xE9.", "danger");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la fonctionnalit\xE9.");
      console.error("Erreur:", error);
    }
  }
};
