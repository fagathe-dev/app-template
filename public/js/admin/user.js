var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value })
    : (obj[key] = value);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);

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
    __publicField(this, 'alertContainer', null);
    __publicField(this, 'alert', null);
    __publicField(this, 'closeButton', null);
    // State management
    __publicField(this, 'dismissTimeout', null);
    __publicField(this, 'options');
    __publicField(this, 'type');
    __publicField(this, 'message');
    /**
     * Dismisses the alert and cleans up resources
     */
    __publicField(this, 'dismiss', (event) => {
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
    const container = document.createElement('div');
    container.id = this.options.containerId;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
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
    this.alert = document.createElement('div');
    this.alert.className = this.buildAlertClasses();
    this.alert.setAttribute('role', 'alert');
    this.alert.innerHTML = `<small>${this.escapeHtml(this.message)}</small>`;
    if (this.options.dismissible) {
      this.attachDismissButton();
    }
  }
  /**
   * Builds the CSS classes for the alert element
   */
  buildAlertClasses() {
    const classes = ['alert', `alert-${this.type}`, 'alert-borderless', 'shadow', 'fade', 'show'];
    if (this.options.dismissible) {
      classes.push('alert-dismissible');
    }
    return classes.join(' ');
  }
  /**
   * Creates and attaches the dismiss button to the alert
   */
  attachDismissButton() {
    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'btn-close';
    this.closeButton.setAttribute('data-bs-dismiss', 'alert');
    this.closeButton.setAttribute('aria-label', 'Close');
    this.closeButton.addEventListener('click', this.dismiss);
    this.alert?.appendChild(this.closeButton);
  }
  /**
   * Escapes HTML characters to prevent XSS attacks
   */
  escapeHtml(text) {
    const div = document.createElement('div');
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
      this.alertContainer.insertAdjacentElement('afterbegin', this.alert);
      this.setupAutoDismiss();
    }
  }
};
// Constants for default configuration
__publicField(_Alert, 'DEFAULT_TYPE', 'info');
__publicField(_Alert, 'DEFAULT_CONTAINER_ID', 'alert-container');
__publicField(_Alert, 'DEFAULT_OPTIONS', {
  containerId: _Alert.DEFAULT_CONTAINER_ID,
  duration: 0,
  // 0 means no auto-dismiss
  dismissible: false,
});
var Alert = _Alert;

// public/ts/utils/fetch.ts
var ApiError = class extends Error {
  constructor(status, statusText, message, response, data) {
    super(message);
    __publicField(this, 'ok', false);
    __publicField(this, 'headers');
    __publicField(this, 'status');
    __publicField(this, 'statusText');
    __publicField(this, 'data');
    __publicField(this, 'response');
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.headers = response.headers;
    this.data = data;
  }
};
var fetchAPI = async (url, options = {}) => {
  try {
    const requestOptions = { ...options };
    if (
      requestOptions.body &&
      typeof requestOptions.body === 'object' &&
      !(requestOptions.body instanceof FormData) &&
      !(requestOptions.body instanceof URLSearchParams) &&
      !(requestOptions.body instanceof Blob) &&
      !(requestOptions.body instanceof ArrayBuffer) &&
      typeof requestOptions.body !== 'string'
    ) {
      requestOptions.body = JSON.stringify(requestOptions.body);
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      };
    }
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...requestOptions.headers,
      },
    });
    const clonedResponse = response.clone();
    const contentType = response.headers.get('content-type');
    let data;
    let text;
    let blob;
    text = await clonedResponse.text();
    try {
      data = contentType?.includes('application/json') ? JSON.parse(text) : {};
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
      blob,
    };
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        typeof data === 'object' && data && 'message' in data
          ? String(data.message)
          : `Request failed with status ${response.status}`,
        response,
        data
      );
    }
    return fetchResponse;
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn('throw ERROR');
      console.log(error);
      return error;
    }
    const errorResponse = new Response(null, { status: 0, statusText: 'Network Error' });
    return new ApiError(
      0,
      'Network Error',
      error instanceof Error ? error.message : 'Unknown error occurred',
      errorResponse,
      { message: 'Network Error' }
    );
  }
};
var fetchGET = async (url, options = {}) => {
  return fetchAPI(url, { ...options, method: 'GET' });
};
var fetchPOST = async (url, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: 'POST',
  };
  if (body !== void 0) {
    requestOptions.body = body;
  }
  return fetchAPI(url, requestOptions);
};
var fetchPUT = async (url, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: 'PUT',
  };
  if (body !== void 0) {
    requestOptions.body = body;
  }
  return fetchAPI(url, requestOptions);
};
var fetchPATCH = async (url, body, options = {}) => {
  const requestOptions = {
    ...options,
    method: 'PATCH',
  };
  if (body !== void 0) {
    requestOptions.body = body;
  }
  return fetchAPI(url, requestOptions);
};
var fetchDELETE = async (url, options = {}) => {
  return fetchAPI(url, { ...options, method: 'DELETE' });
};

// public/ts/utils/form.ts
var _FormManager = class _FormManager {
  /**
   * Creates a new FormManager instance
   * @param config - Configuration object containing form and optional initial data
   */
  constructor({ form, initialData = {} }) {
    // Core properties
    __publicField(this, 'form');
    __publicField(this, 'initialData');
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
    const fieldset = field.closest('fieldset');
    const div = field.closest('div');
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
      _FormManager.INPUT_TYPES.TEL,
    ];
    if (supportedTypes.includes(type)) {
      data[name] = value.trim() === '' ? null : value;
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
    data[name] = value.trim() === '' ? null : value;
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
        case 'INPUT':
          this.handleInputField(field, data);
          break;
        case 'SELECT':
          this.handleSelectField(field, data);
          break;
        case 'TEXTAREA':
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
    field.value = String(value || '');
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
    } else if (value !== null && value !== void 0 && value !== '') {
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
        case 'INPUT':
          this.fillInputField(field, value);
          break;
        case 'SELECT':
          this.fillSelectField(field, value);
          break;
        case 'TEXTAREA':
          field.value = String(value || '');
          break;
      }
    }
  }
  /**
   * Escapes HTML content to prevent XSS attacks
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * Creates and inserts an error message element
   */
  createErrorElement(container, errorMessage) {
    const errorElement = document.createElement('small');
    errorElement.innerHTML = this.escapeHtml(errorMessage);
    errorElement.className = 'invalid-feedback';
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
    const isChoiceField = field.tagName === 'INPUT' && ['checkbox', 'radio'].includes(field.type);
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
      const existingError = container?.querySelector('.invalid-feedback');
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
      field.value = '';
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
    field.value = '';
  }
  /**
   * Resets form to its initial state
   */
  reset() {
    const fields = this.getFormFields();
    fields.forEach((field) => {
      const { tagName } = field;
      switch (tagName.toUpperCase()) {
        case 'INPUT':
          this.resetInputField(field);
          break;
        case 'SELECT':
          this.resetSelectField(field);
          break;
        case 'TEXTAREA':
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
__publicField(_FormManager, 'FORM_FIELD_SELECTOR', 'input, select, textarea');
__publicField(_FormManager, 'FEEDBACK_CLASSES', '.invalid-feedback, .valid-feedback');
__publicField(_FormManager, 'VALIDATION_CLASSES', {
  VALID: 'is-valid',
  INVALID: 'is-invalid',
});
__publicField(_FormManager, 'INPUT_TYPES', {
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  DATETIME: 'datetime',
  PASSWORD: 'password',
  HIDDEN: 'hidden',
  EMAIL: 'email',
  URL: 'url',
  TEL: 'tel',
});
var FormManager = _FormManager;

// public/ts/admin/user.ts
var editForm = new FormManager({
  form: document.getElementById('editUserInfosForm'),
});
var handleEditFormSubmit = async (e) => {
  e.preventDefault();
  const data = editForm.getData();
  const actionUrl = editForm.getForm().getAttribute('action');
  try {
    const response = await fetchPOST(actionUrl, data);
    if (response.ok) {
      const responseData = response.data;
      if (responseData?.message) {
        new Alert(responseData.message, 'success', {
          containerId: 'editUserInfosForm',
          duration: 5e3,
          dismissible: true,
        });
      }
    } else {
      if (response.status === 400) {
        const responseData = response.data;
        if (responseData.violations) {
          responseData.violations.message
            ? (new Alert(responseData.violations.message, 'danger', {
                containerId: 'editUserInfosForm',
                dismissible: true,
              }),
              delete responseData.violations.message)
            : editForm.handleViolations(responseData.violations);
        }
      }
    }
  } catch (error) {
    console.error('Failed to create user : ', error);
  }
};
var handleChangeRole = async (e) => {
  e.preventDefault();
  const target = e.target;
  const url = target.getAttribute('data-href');
  const q = target.getAttribute('data-action');
  const role = target.value;
  const data = { role, q };
  try {
    const response = await fetchPOST(url, data);
    if (response.ok) {
      new Alert('Le r\xF4le a \xE9t\xE9 modifi\xE9 avec succ\xE8s \u{1F680}', 'success', {
        containerId: 'editUserInfosAlert',
        duration: 5e3,
        dismissible: true,
      });
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 5e3);
    } else {
      console.error('Erreur lors de la modification du r\xF4le.');
      new Alert('Erreur lors de la modification du r\xF4le.', 'danger', {
        containerId: 'user-permission-tab',
        dismissible: true,
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification du r\xF4le : ', error);
  }
};
editForm.getForm().addEventListener('submit', (e) => handleEditFormSubmit(e));
