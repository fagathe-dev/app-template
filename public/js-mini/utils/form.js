var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) =>
  key in obj
    ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value })
    : (obj[key] = value);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== 'symbol' ? key + '' : key, value);

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
export { FormManager };
