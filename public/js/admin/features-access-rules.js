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

// public/ts/utils/fetch.ts
var fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
var fetchJSON = async (url, options = {}) => {
  try {
    const response = await fetchAPI(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
var fetchContent = async (url, options = {}) => {
  try {
    const response = await fetchAPI(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const fileContent = await response.text();
    return fileContent;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
var fetchBlob = async (url, options = {}) => {
  try {
    const response = await fetchAPI(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const fileContent = await response.blob();
    return fileContent;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

// public/ts/utils/url.ts
var _URLHandler = class _URLHandler {
};
/**
 * @description Get the current URL as an URL object
 * @returns {URL}
 */
__publicField(_URLHandler, "getObjectURL", () => {
  const url = window.location.href;
  return new URL(url);
});
/**
 * Get the URL base from the current URL or from a given URL
 *
 * @param {string} url
 * @returns {string}
 */
__publicField(_URLHandler, "getBaseURL", (url = void 0) => url === void 0 ? window.location.origin : new URL(url).origin);
/**
 * @description Get the URI path from the current URL or from a given URL
 *
 * @param {(string | undefined)} [url=undefined]
 * @returns {string}
 */
__publicField(_URLHandler, "getURI", (url = void 0) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  return `${objURL.pathname}${objURL.search}`;
});
/**
 * Get the URL path from the current URL
 *
 * @param {string} url
 * @returns {string}
 */
__publicField(_URLHandler, "getPathname", (url = void 0) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  return `${objURL.pathname}`;
});
/**
 * Get the URL parameters from the current URL
 *
 * @returns {URLSearchParams}
 */
__publicField(_URLHandler, "getURLParams", () => {
  const url = _URLHandler.getObjectURL();
  return url.searchParams;
});
__publicField(_URLHandler, "getAllURLParams", (url = void 0) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  const params = objURL.searchParams;
  const queries = {};
  for (const [key, value] of params.entries()) {
    queries[key] = value;
  }
  return queries;
});
/**
 * Description placeholder
 *
 * @param {Array<URLParam>} queries
 */
__publicField(_URLHandler, "urlPushState", (queries) => {
  let url = _URLHandler.getObjectURL();
  url = _URLHandler.deleteAllURLParams(url);
  window.history.pushState({}, "", _URLHandler.generateURLWithParams(url.href, queries));
});
/**
 * @param {string} key
 * @param {string} value
 * @returns {URL}
 * @description Delete a URL parameter to the current URL
 */
__publicField(_URLHandler, "deleteURLParams", (key) => {
  const url = _URLHandler.getObjectURL();
  const params = url.searchParams;
  if (params.has(key)) {
    params.delete(key);
  }
  return url;
});
/**
 * @param {string} key
 * @param {string} value
 * @returns {URL}
 * @description Delete all URL parameters to the current URL
 */
__publicField(_URLHandler, "deleteAllURLParams", (url) => {
  const objURL = url ?? _URLHandler.getObjectURL();
  const params = objURL.searchParams;
  for (const key of params.keys()) {
    params.delete(key);
  }
  return objURL;
});
/**
 * @param {string} url
 * @param {Array<URLParam>} queries
 * @returns {string}
 * @description Generate a URL with parameters
 */
__publicField(_URLHandler, "generateURLWithParams", (url = void 0, queries) => {
  const objURL = url === void 0 ? _URLHandler.getObjectURL() : new URL(url);
  const params = objURL.searchParams;
  queries.forEach((query) => {
    if (query.key !== "" && query.value !== "") {
      params.set(query.key, query.value);
    }
  });
  return objURL.href;
});
var URLHandler = _URLHandler;

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
        new Alert("La fonctionnalit\xE9 a \xE9t\xE9 supprim\xE9e avec succ\xE8s \u{1F680}");
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
          window.location.reload();
        }, 4e3);
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
var xyz = URLHandler.getAllURLParams();
