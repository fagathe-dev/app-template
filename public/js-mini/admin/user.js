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
  setUpOptions(options) {
    this.options = { ..._Alert.DEFAULT_OPTIONS, ...options };
    if (this.options.duration && this.options.duration > 0) {
      this.dismissTimeout = window.setTimeout(() => this.dismiss(), this.options.duration);
    }
  }
  init() {
    this.setUpOptions(this.options);
    this.alertContainer = document.getElementById(this.options.containerId || _Alert.DEFAULT_CONTAINER_ID);
    if (!this.alertContainer) {
      this.alertContainer = document.createElement("div");
      this.alertContainer.id = this.options.containerId || _Alert.DEFAULT_CONTAINER_ID;
      document.body.appendChild(this.alertContainer);
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
  constructor(status, statusText, message, response) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.name = "ApiError";
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
        response
      );
    }
    return fetchResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      0,
      "Network Error",
      error instanceof Error ? error.message : "Unknown error occurred",
      new Response(null, { status: 0, statusText: "Network Error" })
    );
  }
};

// public/ts/utils/form.ts
var _FormManager = class _FormManager {
  constructor({ form, initialData }) {
    __publicField(this, "form");
    __publicField(this, "initialData");
    this.form = form;
    console.log("FormManager initialized with form:", this.form);
    this.initialData = initialData;
    this.init();
  }
  getData() {
    const fields = this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
    const data = {};
    for (const field of fields) {
      const { tagName, name } = field;
      switch (tagName) {
        case "INPUT":
          const { type, value } = field;
          if (data.hasOwnProperty(name)) {
            continue;
          } else {
            if (type === "checkbox" || type === "radio") {
              const choices2 = this.form.querySelectorAll(
                `input[name="${name}"]:checked`
              );
              if (Array.from(choices2).length > 1) {
                choices2.forEach((el) => {
                  if (!data.hasOwnProperty(name)) {
                    data[name] = [];
                  }
                  data[name].push(el.value);
                });
              } else {
                data[name] = this.form.querySelector(`input[name="${name}"]:checked`)?.value ?? null;
              }
            }
            if (type === "text" || type === "number" || type === "date" || type === "datetime" || type === "password" || type === "hidden") {
              data[name] = value === "" ? null : value;
            }
          }
          break;
        case "SELECT":
          const choices = this.form.querySelectorAll(`select[name="${name}"] option`);
          const selectedOptions = Array.from(choices).filter((option) => option.selected);
          if (selectedOptions.length > 1) {
            this.form.querySelectorAll(`select[name="${name}"] option`).forEach(
              (option) => {
                if (!data.hasOwnProperty(name)) {
                  data[name] = [];
                }
                option.selected && data[name].push(option.value);
              }
            );
          } else {
            data[name] = this.form.querySelector(`select[name="${name}"]`)?.value ?? null;
          }
          break;
        case "TEXTAREA":
          data[name] = field.value;
          break;
        default:
          break;
      }
    }
    return data;
  }
  fillData(data) {
    const fields = this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
    for (const field of fields) {
      const { tagName, name } = field;
      if (data.hasOwnProperty(name)) {
        const value = data[name];
        switch (tagName) {
          case "INPUT":
            const { type, value: choiceValue } = field;
            if (type === "checkbox" || type === "radio") {
              if (Array.isArray(value)) {
                value.forEach((v) => {
                  if (choiceValue === v) {
                    field.checked = true;
                  }
                });
              }
              if (value === false || value === null) {
                field.checked = false;
              }
              if (value === true) {
                field.checked = true;
              }
            }
            if (type === "text" || type === "number" || type === "date" || type === "datetime" || type === "password" || type === "hidden") {
              field.value = value;
            }
            break;
          case "SELECT":
            const { options } = field;
            if (Array.isArray(value)) {
              Array.from(options).forEach((opt) => {
                opt.selected = value.includes(opt.value);
              });
            } else if (value === null || value === "") {
              continue;
            } else {
              value;
              const option = Array.from(options).find((opt) => opt.value === value);
              option && (option.selected = true);
            }
            break;
          case "TEXTAREA":
            field.value = value;
            break;
          default:
            break;
        }
      } else {
        continue;
      }
    }
  }
  handleViolations(violations) {
    const fields = this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
    for (const field of fields) {
      const { tagName, name } = field;
      const container = field.closest("fieldset") || field.closest("div");
      let error = container.querySelector(".invalid-feedback");
      if (violations.hasOwnProperty(name)) {
        if (tagName === "INPUT" && field.type === "checkbox" || field.type === "radio") {
          const choices = this.form.querySelectorAll(`input[name="${name}"]`);
          choices.forEach((el) => {
            el.classList.add("is-invalid");
          });
        } else {
          field.classList.add("is-invalid");
        }
        if (error === null) {
          error = document.createElement("small");
          error.innerHTML = violations[name];
          error.classList.add("invalid-feedback");
          container.insertAdjacentElement("beforeend", error);
        }
      } else {
        field.classList.remove("is-invalid");
        field.classList.add("is-valid");
        if (error !== null) {
          error.remove();
        }
      }
    }
  }
  reset() {
    const fields = this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
    fields.forEach((field) => {
      const { tagName } = field;
      const container = field.closest("fieldset") || field.closest("div");
      const feedback = container.querySelector(".invalid-feedback, valid-feedback");
      if (tagName === "INPUT") {
        const { type } = field;
        if (type === "checkbox" || type === "radio") {
          field.checked = false;
        }
        if (type === "text" || type === "number" || type === "date" || type === "datetime" || type === "password" || type === "hidden") {
          field.value = "";
        }
      }
      if (tagName === "SELECT") {
        const { options } = field;
        Array.from(options).forEach((opt) => opt.selected = false);
      }
      if (tagName === "TEXTAREA") {
        field.value = "";
      }
      field.classList.remove("is-valid", "is-invalid");
      feedback && feedback.remove();
    });
  }
  init() {
    if (this.initialData) {
      this.fillData(this.initialData);
    }
  }
};
__publicField(_FormManager, "FORM_FIELD_SELECTOR", "input, select, textarea");
var FormManager = _FormManager;
var example = `
// Initialize form manager
const initialData: FormDataType = {
    transport: ['Train', 'Bus'],
    isActive: false,
    exampleSelect: '4',
    password: 'testPassword',
    dueDate: '2002-01-12',
    message: 'Example message'
};

const violations = {
    transport: 'This field is required',
    isActive: 'This field is required',
    message: 'This field is required',
    dueDate: 'This field is required'
};

const formManager = new FormManager({ 
    form: document.getElementById('formManagerId') as HTMLFormElement, 
    initialData 
});

// Handle form violations
formManager.handleViolations(violations);

// Reset form when needed
formManager.reset();
`;

// public/ts/admin/user.ts
var editForm = new FormManager({
  form: document.getElementById("editUserInfosForm")
});
var handleEditFormSubmit = async (e) => {
  e.preventDefault();
  const data = editForm.getData();
  const actionUrl = editForm.form.getAttribute("action");
  console.log({ actionUrl, data });
  try {
    const response = await fetchAPI(actionUrl, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (response.ok) {
      console.log("User created successfully:", response.data);
      const responseData = response.data;
      if (data?.message) {
        new Alert(responseData.message, "success", {
          duration: 5e3,
          dismissible: true
        });
      }
    } else {
      console.error("Error creating user:", response.data);
    }
  } catch (error) {
    console.error("Failed to create user:", error);
  }
};
new Alert("An error occurred while processing your request", "danger", {
  duration: 5e3,
  dismissible: true
});
editForm.form.addEventListener("submit", (e) => handleEditFormSubmit(e));
