var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// public/ts/utils/form.ts
var _FormManager = class _FormManager {
  /**
   * Creates a new FormManager instance
   * @param config - Configuration object containing form and optional initial data
   */
  constructor({ form, initialData = {} }) {
    // Core properties
    __publicField(this, "form");
    __publicField(this, "initialData");
    this.form = form;
    this.initialData = initialData;
    this.initialize();
  }
  /**
   * Initializes the form with initial data if provided
   */
  initialize() {
    if (Object.keys(this.initialData).length > 0) {
      this.fillData(this.initialData);
    }
  }
  /**
   * Gets all form fields using the standard selector
   */
  getFormFields() {
    return this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
  }
  /**
   * Finds the appropriate container for a form field
   */
  getFieldContainer(field) {
    const fieldset = field.closest("fieldset");
    const div = field.closest("div");
    return fieldset || div;
  }
  /**
   * Resets validation state of a specific field
   * @param field - The form field element to reset
   */
  resetFieldState(field) {
    const container = this.getFieldContainer(field);
    const feedback = container?.querySelector(_FormManager.FEEDBACK_CLASSES);
    field.classList.remove(_FormManager.VALIDATION_CLASSES.VALID, _FormManager.VALIDATION_CLASSES.INVALID);
    feedback?.remove();
  }
  /**
   * Checks if a field name already exists in the data object
   */
  isFieldProcessed(fieldName, data) {
    return Object.prototype.hasOwnProperty.call(data, fieldName);
  }
  /**
   * Processes checkbox and radio input fields
   */
  processChoiceInputs(field, data) {
    const { name } = field;
    const checkedInputs = this.form.querySelectorAll(`input[name="${name}"]:checked`);
    const checkedValues = Array.from(checkedInputs).map((input) => input.value);
    if (checkedValues.length > 1) {
      data[name] = checkedValues;
    } else {
      data[name] = checkedValues[0] || null;
    }
  }
  /**
   * Processes standard input fields (text, number, date, etc.)
   */
  processStandardInputs(field, data) {
    const { name, value, type } = field;
    const supportedTypes = [
      _FormManager.INPUT_TYPES.TEXT,
      _FormManager.INPUT_TYPES.NUMBER,
      _FormManager.INPUT_TYPES.DATE,
      _FormManager.INPUT_TYPES.DATETIME,
      _FormManager.INPUT_TYPES.PASSWORD,
      _FormManager.INPUT_TYPES.HIDDEN,
      _FormManager.INPUT_TYPES.EMAIL,
      _FormManager.INPUT_TYPES.URL,
      _FormManager.INPUT_TYPES.TEL
    ];
    if (supportedTypes.includes(type)) {
      data[name] = value.trim() === "" ? null : value;
    }
  }
  /**
   * Extracts value from an input field based on its type
   */
  handleInputField(field, data) {
    const { type, name } = field;
    if (this.isFieldProcessed(name, data)) return;
    if (type === _FormManager.INPUT_TYPES.CHECKBOX || type === _FormManager.INPUT_TYPES.RADIO) {
      this.processChoiceInputs(field, data);
    } else {
      this.processStandardInputs(field, data);
    }
  }
  /**
   * Extracts value from a select field
   */
  handleSelectField(field, data) {
    const { name } = field;
    const selectedOptions = Array.from(field.options).filter((option) => option.selected);
    if (selectedOptions.length > 1) {
      data[name] = selectedOptions.map((option) => option.value);
    } else {
      data[name] = field.value || null;
    }
  }
  /**
   * Extracts value from a textarea field
   */
  handleTextareaField(field, data) {
    const { name, value } = field;
    data[name] = value.trim() === "" ? null : value;
  }
  /**
   * Extracts all form data into a structured object
   */
  getData() {
    const data = {};
    const fields = this.getFormFields();
    for (const field of fields) {
      const { tagName } = field;
      switch (tagName.toUpperCase()) {
        case "INPUT":
          this.handleInputField(field, data);
          break;
        case "SELECT":
          this.handleSelectField(field, data);
          break;
        case "TEXTAREA":
          this.handleTextareaField(field, data);
          break;
      }
    }
    return data;
  }
  /**
   * Sets value for checkbox and radio inputs
   */
  setChoiceInputValue(field, value) {
    if (Array.isArray(value)) {
      field.checked = value.includes(field.value);
    } else {
      field.checked = value === true || field.value === String(value);
    }
  }
  /**
   * Sets value for standard input fields
   */
  setStandardInputValue(field, value) {
    field.value = String(value || "");
  }
  /**
   * Sets value for an input field based on its type
   */
  fillInputField(field, value) {
    const { type } = field;
    if (type === _FormManager.INPUT_TYPES.CHECKBOX || type === _FormManager.INPUT_TYPES.RADIO) {
      this.setChoiceInputValue(field, value);
    } else {
      this.setStandardInputValue(field, value);
    }
  }
  /**
   * Sets value for a select field (single or multiple selection)
   */
  fillSelectField(field, value) {
    Array.from(field.options).forEach((option) => {
      option.selected = false;
    });
    if (Array.isArray(value)) {
      Array.from(field.options).forEach((option) => {
        option.selected = value.includes(option.value);
      });
    } else if (value !== null && value !== void 0 && value !== "") {
      const targetOption = Array.from(field.options).find((option) => option.value === String(value));
      if (targetOption) {
        targetOption.selected = true;
      }
    }
  }
  /**
   * Populates form fields with provided data
   */
  fillData(data) {
    const fields = this.getFormFields();
    for (const field of fields) {
      const { tagName } = field;
      const fieldName = field.name;
      if (!Object.prototype.hasOwnProperty.call(data, fieldName)) continue;
      const value = data[fieldName];
      this.resetFieldState(field);
      switch (tagName.toUpperCase()) {
        case "INPUT":
          this.fillInputField(field, value);
          break;
        case "SELECT":
          this.fillSelectField(field, value);
          break;
        case "TEXTAREA":
          field.value = String(value || "");
          break;
      }
    }
  }
  /**
   * Escapes HTML content to prevent XSS attacks
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * Creates and inserts an error message element
   */
  createErrorElement(container, errorMessage) {
    const errorElement = document.createElement("small");
    errorElement.innerHTML = this.escapeHtml(errorMessage);
    errorElement.className = "invalid-feedback";
    container.appendChild(errorElement);
  }
  /**
   * Applies validation styles for checkbox and radio groups
   */
  applyChoiceFieldValidation(field, isValid) {
    const fieldName = field.name;
    const relatedFields = this.form.querySelectorAll(`input[name="${fieldName}"]`);
    relatedFields.forEach((relatedField) => {
      relatedField.classList.toggle(_FormManager.VALIDATION_CLASSES.INVALID, !isValid);
      relatedField.classList.toggle(_FormManager.VALIDATION_CLASSES.VALID, isValid);
    });
  }
  /**
   * Applies validation styles for standard fields
   */
  applyStandardFieldValidation(field, isValid) {
    field.classList.toggle(_FormManager.VALIDATION_CLASSES.INVALID, !isValid);
    field.classList.toggle(_FormManager.VALIDATION_CLASSES.VALID, isValid);
  }
  /**
   * Displays or removes error message for a specific field
   */
  displayFieldError(field, container, existingError, errorMessage, isValid) {
    const isChoiceField = field.tagName === "INPUT" && ["checkbox", "radio"].includes(field.type);
    if (isChoiceField) {
      this.applyChoiceFieldValidation(field, isValid);
    } else {
      this.applyStandardFieldValidation(field, isValid);
    }
    if (!isValid && errorMessage && !existingError) {
      this.createErrorElement(container, errorMessage);
    } else if (isValid && existingError) {
      existingError.remove();
    }
  }
  /**
   * Handles form validation violations and displays appropriate feedback
   */
  handleViolations(violations) {
    const fields = this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
    for (const field of fields) {
      const fieldName = field.name;
      const container = this.getFieldContainer(field);
      const existingError = container?.querySelector(".invalid-feedback");
      const hasViolation = Object.prototype.hasOwnProperty.call(violations, fieldName);
      const errorMessage = hasViolation ? String(violations[fieldName]) : null;
      if (container) {
        this.displayFieldError(field, container, existingError, errorMessage, !hasViolation);
      }
    }
  }
  /**
   * Resets validation state of all form fields
   */
  resetFormFieldsState() {
    const fields = this.getFormFields();
    fields.forEach((field) => this.resetFieldState(field));
  }
  /**
   * Resets input field to its default state
   */
  resetInputField(field) {
    const { type } = field;
    if (type === _FormManager.INPUT_TYPES.CHECKBOX || type === _FormManager.INPUT_TYPES.RADIO) {
      field.checked = false;
    } else {
      field.value = "";
    }
  }
  /**
   * Resets select field to its default state
   */
  resetSelectField(field) {
    Array.from(field.options).forEach((option) => {
      option.selected = false;
    });
  }
  /**
   * Resets textarea field to its default state
   */
  resetTextareaField(field) {
    field.value = "";
  }
  /**
   * Resets form to its initial state
   */
  reset() {
    const fields = this.getFormFields();
    fields.forEach((field) => {
      const { tagName } = field;
      switch (tagName.toUpperCase()) {
        case "INPUT":
          this.resetInputField(field);
          break;
        case "SELECT":
          this.resetSelectField(field);
          break;
        case "TEXTAREA":
          this.resetTextareaField(field);
          break;
      }
    });
    this.resetFormFieldsState();
  }
  /**
   * Gets the current initial data
   */
  getInitialData() {
    return { ...this.initialData };
  }
  /**
   * Gets the form element
   */
  getForm() {
    return this.form;
  }
};
// Constants for field selection and validation
__publicField(_FormManager, "FORM_FIELD_SELECTOR", "input, select, textarea");
__publicField(_FormManager, "FEEDBACK_CLASSES", ".invalid-feedback, .valid-feedback");
__publicField(_FormManager, "VALIDATION_CLASSES", {
  VALID: "is-valid",
  INVALID: "is-invalid"
});
__publicField(_FormManager, "INPUT_TYPES", {
  CHECKBOX: "checkbox",
  RADIO: "radio",
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  DATETIME: "datetime",
  PASSWORD: "password",
  HIDDEN: "hidden",
  EMAIL: "email",
  URL: "url",
  TEL: "tel"
});
var FormManager = _FormManager;
export {
  FormManager
};
