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
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...options.headers,
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
    console.log('ICI');
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

// public/ts/utils/form.ts
var _FormManager = class _FormManager {
  constructor({ form, initialData }) {
    __publicField(this, 'form');
    __publicField(this, 'initialData');
    this.form = form;
    this.initialData = initialData;
    this.init();
  }
  /**
   * Get all form fields
   * @returns NodeListOf<Element> List of form fields
   */
  getFormFields() {
    return this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
  }
  /**
   * Reset validation state of a field
   * @param field The form field element
   */
  resetFieldState(field) {
    const container = field.closest('fieldset') || field.closest('div');
    const feedback = container.querySelector('.invalid-feedback, .valid-feedback');
    field.classList.remove('is-valid', 'is-invalid');
    feedback?.remove();
  }
  /**
   * Extract value from an input field based on its type
   * @param field Input field element
   * @param data Current form data object
   */
  handleInputField(field, data) {
    const { type, name, value } = field;
    if (data.hasOwnProperty(name)) return;
    if (type === 'checkbox' || type === 'radio') {
      const choices = this.form.querySelectorAll(`input[name="${name}"]:checked`);
      if (Array.from(choices).length > 1) {
        data[name] = Array.from(choices).map((el) => el.value);
      } else {
        data[name] = choices[0]?.value ?? null;
      }
    } else if (['text', 'number', 'date', 'datetime', 'password', 'hidden'].includes(type)) {
      data[name] = value === '' ? null : value;
    }
  }
  /**
   * Extract value from a select field
   * @param field Select field element
   * @param data Current form data object
   */
  handleSelectField(field, data) {
    const { name } = field;
    const selectedOptions = Array.from(field.options).filter((opt) => opt.selected);
    if (selectedOptions.length > 1) {
      data[name] = selectedOptions.map((opt) => opt.value);
    } else {
      data[name] = field.value || null;
    }
  }
  /**
   * Get all form data
   * @returns FormDataType Object containing all form field values
   */
  getData() {
    const data = {};
    const fields = this.getFormFields();
    for (const field of fields) {
      const { tagName } = field;
      switch (tagName) {
        case 'INPUT':
          this.handleInputField(field, data);
          break;
        case 'SELECT':
          this.handleSelectField(field, data);
          break;
        case 'TEXTAREA':
          const { name, value } = field;
          data[name] = value;
          break;
      }
    }
    return data;
  }
  /**
   * Set value for an input field based on its type
   * @param field Input field element
   * @param value Value to set
   */
  fillInputField(field, value) {
    const { type } = field;
    if (type === 'checkbox' || type === 'radio') {
      if (Array.isArray(value)) {
        field.checked = value.includes(field.value);
      } else {
        field.checked = value === true || field.value === value;
      }
    } else if (['text', 'number', 'date', 'datetime', 'password', 'hidden'].includes(type)) {
      field.value = value ?? '';
    }
  }
  /**
   * Set value for a select field
   * @param field Select field element
   * @param value Value to set
   */
  fillSelectField(field, value) {
    if (Array.isArray(value)) {
      Array.from(field.options).forEach((opt) => {
        opt.selected = value.includes(opt.value);
      });
    } else if (value !== null && value !== '') {
      const option = Array.from(field.options).find((opt) => opt.value === value);
      if (option) option.selected = true;
    }
  }
  /**
   * Fill form with data
   * @param data Data to fill the form with
   */
  fillData(data) {
    const fields = this.getFormFields();
    for (const field of fields) {
      const { tagName, name } = field;
      if (!data.hasOwnProperty(name)) continue;
      const value = data[name];
      this.resetFieldState(field);
      switch (tagName) {
        case 'INPUT':
          this.fillInputField(field, value);
          break;
        case 'SELECT':
          this.fillSelectField(field, value);
          break;
        case 'TEXTAREA':
          field.value = value ?? '';
          break;
      }
    }
  }
  /**
   * Display error message for a specific field
   * @param field The form field element
   * @param container The container element of the field
   * @param error The existing error element if any
   * @param errorMessage The error message to display
   * @param isValid Whether the field is valid
   */
  displayFieldError(field, container, error, errorMessage, isValid) {
    const isCheckboxOrRadio = field.tagName === 'INPUT' && ['checkbox', 'radio'].includes(field.type);
    if (!isValid) {
      if (isCheckboxOrRadio) {
        const choices = this.form.querySelectorAll(`input[name="${field.name}"]`);
        choices.forEach((el) => {
          el.classList.add('is-invalid');
        });
      } else {
        field.classList.add('is-invalid');
      }
      if (error === null && errorMessage) {
        const errorElement = document.createElement('small');
        errorElement.innerHTML = errorMessage;
        errorElement.classList.add('invalid-feedback');
        container.insertAdjacentElement('beforeend', errorElement);
      }
    } else {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      error?.remove();
    }
  }
  /**
   * Handle form validation violations
   * @param violations Object containing field names and their error messages
   */
  handleViolations(violations) {
    const fields = this.form.querySelectorAll(_FormManager.FORM_FIELD_SELECTOR);
    for (const field of fields) {
      const { name } = field;
      const container = field.closest('fieldset') || field.closest('div');
      const error = container.querySelector('.invalid-feedback');
      const hasViolation = violations.hasOwnProperty(name);
      const errorMessage = hasViolation ? violations[name] : null;
      this.displayFieldError(field, container, error, errorMessage, !hasViolation);
    }
  }
  resetFormFieldsState() {
    const fields = this.getFormFields();
    return fields.forEach((f) => this.resetFieldState(f));
  }
  /**
   * Reset form to its initial state
   */
  reset() {
    const fields = this.getFormFields();
    fields.forEach((field) => {
      const { tagName } = field;
      switch (tagName) {
        case 'INPUT':
          const input = field;
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
          } else {
            input.value = '';
          }
          break;
        case 'SELECT':
          Array.from(field.options).forEach((opt) => (opt.selected = false));
          break;
        case 'TEXTAREA':
          field.value = '';
          break;
      }
    });
  }
  init() {
    if (this.initialData) {
      this.fillData(this.initialData);
    }
  }
};
__publicField(_FormManager, 'FORM_FIELD_SELECTOR', 'input, select, textarea');
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
  form: document.getElementById('editUserInfosForm'),
});
var handleEditFormSubmit = async (e) => {
  e.preventDefault();
  const data = editForm.getData();
  const actionUrl = editForm.form.getAttribute('action');
  try {
    const response = await fetchAPI(actionUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const responseData = response.data;
      if (data?.message) {
        new Alert(responseData.message, 'success', {
          containerId: 'editUserInfosAlert',
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
                containerId: 'editUserInfosAlert',
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
editForm.form.addEventListener('submit', (e) => handleEditFormSubmit(e));
