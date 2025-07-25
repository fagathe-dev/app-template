import { fetchAPI } from './fetch';

interface FormType {
  form: HTMLFormElement;
  initialData?: FormDataType;
}

type FormDataType = Record<string, string | boolean | number | null | Array<string | boolean | number | null>>;

/**
 * FormManager - A class to handle form operations
 *
 * This class provides functionality to:
 * - Get form data from all form fields (input, select, textarea)
 * - Fill form with initial data
 * - Handle form validation errors
 * - Reset form to initial state
 *
 * @example
 * // Create a form manager instance
 * const initialData = {
 *   transport: ['Train', 'Bus'],
 *   isActive: false,
 *   exampleSelect: '4',
 *   password: 'testPassword',
 *   dueDate: '2002-01-12',
 *   message: 'Some message'
 * };
 *
 * const formManager = new FormManager({
 *   form: document.getElementById('myForm'),
 *   initialData
 * });
 *
 * // Get form data
 * const data = formManager.getData();
 *
 * // Handle validation errors
 * const violations = {
 *   transport: 'This field is required',
 *   isActive: 'This field is required',
 *   message: 'This field is required',
 *   dueDate: 'This field is required'
 * };
 * formManager.handleViolations(violations);
 *
 * // Reset form
 * formManager.reset();
 */
class FormManager {
  form: HTMLFormElement;
  initialData: FormDataType;
  static FORM_FIELD_SELECTOR = 'input, select, textarea';

  constructor({ form, initialData }: FormType) {
    this.form = form;
    this.initialData = initialData as FormDataType;
    this.init();
  }

  /**
   * Get all form fields
   * @returns NodeListOf<Element> List of form fields
   */
  private getFormFields(): NodeListOf<Element> {
    return this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);
  }

  /**
   * Reset validation state of a field
   * @param field The form field element
   */
  private resetFieldState(field: Element): void {
    const container = (field.closest('fieldset') as HTMLFieldSetElement) || (field.closest('div') as HTMLDivElement);
    const feedback = container.querySelector('.invalid-feedback, .valid-feedback');

    field.classList.remove('is-valid', 'is-invalid');
    feedback?.remove();
  }

  /**
   * Extract value from an input field based on its type
   * @param field Input field element
   * @param data Current form data object
   */
  private handleInputField(field: HTMLInputElement, data: FormDataType): void {
    const { type, name, value } = field;

    if (data.hasOwnProperty(name)) return;

    if (type === 'checkbox' || type === 'radio') {
      const choices = this.form.querySelectorAll(`input[name="${name}"]:checked`) as NodeListOf<HTMLInputElement>;

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
  private handleSelectField(field: HTMLSelectElement, data: FormDataType): void {
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
  getData(): FormDataType {
    const data: FormDataType = {};
    const fields = this.getFormFields();

    for (const field of fields) {
      const { tagName } = field;

      switch (tagName) {
        case 'INPUT':
          this.handleInputField(field as HTMLInputElement, data);
          break;
        case 'SELECT':
          this.handleSelectField(field as HTMLSelectElement, data);
          break;
        case 'TEXTAREA':
          const { name, value } = field as HTMLTextAreaElement;
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
  private fillInputField(field: HTMLInputElement, value: FormDataType[string]): void {
    const { type } = field;

    if (type === 'checkbox' || type === 'radio') {
      if (Array.isArray(value)) {
        field.checked = value.includes(field.value);
      } else {
        field.checked = value === true || field.value === value;
      }
    } else if (['text', 'number', 'date', 'datetime', 'password', 'hidden'].includes(type)) {
      field.value = (value as string) ?? '';
    }
  }

  /**
   * Set value for a select field
   * @param field Select field element
   * @param value Value to set
   */
  private fillSelectField(field: HTMLSelectElement, value: FormDataType[string]): void {
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
  fillData(data: FormDataType): void {
    const fields = this.getFormFields();

    for (const field of fields) {
      const { tagName, name } = field as HTMLInputElement;

      if (!data.hasOwnProperty(name)) continue;

      const value = data[name];
      this.resetFieldState(field);

      switch (tagName) {
        case 'INPUT':
          this.fillInputField(field as HTMLInputElement, value);
          break;
        case 'SELECT':
          this.fillSelectField(field as HTMLSelectElement, value);
          break;
        case 'TEXTAREA':
          (field as HTMLTextAreaElement).value = (value as string) ?? '';
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
  private displayFieldError(
    field: Element,
    container: HTMLFieldSetElement | HTMLDivElement,
    error: Element | null,
    errorMessage: string | null,
    isValid: boolean
  ): void {
    const isCheckboxOrRadio =
      field.tagName === 'INPUT' && ['checkbox', 'radio'].includes((field as HTMLInputElement).type);

    if (!isValid) {
      if (isCheckboxOrRadio) {
        const choices = this.form.querySelectorAll(
          `input[name="${(field as HTMLInputElement).name}"]`
        ) as NodeListOf<HTMLInputElement>;
        choices.forEach((el: HTMLInputElement) => {
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
  handleViolations(violations: FormDataType): void {
    const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);

    for (const field of fields) {
      const { name } = field as HTMLInputElement;
      const container = (field.closest('fieldset') as HTMLFieldSetElement) || (field.closest('div') as HTMLDivElement);
      const error = container.querySelector('.invalid-feedback');
      const hasViolation = violations.hasOwnProperty(name);
      const errorMessage = hasViolation ? (violations[name] as string) : null;

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
  reset(): void {
    const fields = this.getFormFields();

    fields.forEach((field) => {
      const { tagName } = field;

      switch (tagName) {
        case 'INPUT':
          const input = field as HTMLInputElement;
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
          } else {
            input.value = '';
          }
          break;
        case 'SELECT':
          Array.from((field as HTMLSelectElement).options).forEach((opt) => (opt.selected = false));
          break;
        case 'TEXTAREA':
          (field as HTMLTextAreaElement).value = '';
          break;
      }
    });
  }

  init() {
    if (this.initialData) {
      this.fillData(this.initialData);
    }
  }
}

/**
 * Usage Example:
 */
const example = `
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

export { FormManager, FormDataType };
