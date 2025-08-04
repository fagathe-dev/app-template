import { fetchAPI } from './fetch';

/**
 * Configuration interface for FormManager initialization
 */
interface FormType {
  form: HTMLFormElement;
  initialData?: FormDataType;
}

/**
 * Type definition for form data values
 */
type FormDataType = Record<string, string | boolean | number | null | Array<string | boolean | number | null>>;

/**
 * FormManager - A comprehensive class for handling form operations
 *
 * Provides functionality for:
 * - Extracting form data from all supported field types
 * - Populating forms with initial data
 * - Handling validation errors and user feedback
 * - Resetting forms to their initial state
 * - Managing field validation states
 *
 * @example
 * ```typescript
 * // Basic usage
 * const formManager = new FormManager({
 *   form: document.getElementById('myForm') as HTMLFormElement
 * });
 *
 * // With initial data
 * const formManager = new FormManager({
 *   form: document.getElementById('myForm') as HTMLFormElement,
 *   initialData: {
 *     transport: ['Train', 'Bus'],
 *     isActive: false,
 *     exampleSelect: '4',
 *     password: 'testPassword',
 *     dueDate: '2002-01-12',
 *     message: 'Some message'
 *   }
 * });
 *
 * // Extract form data
 * const data = formManager.getData();
 *
 * // Handle validation errors
 * formManager.handleViolations({
 *   transport: 'This field is required',
 *   message: 'This field is required'
 * });
 * ```
 */
class FormManager {
  // Constants for field selection and validation
  private static readonly FORM_FIELD_SELECTOR = 'input, select, textarea';
  private static readonly FEEDBACK_CLASSES = '.invalid-feedback, .valid-feedback';
  private static readonly VALIDATION_CLASSES = {
    VALID: 'is-valid',
    INVALID: 'is-invalid',
  } as const;

  private static readonly INPUT_TYPES = {
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
  } as const;

  // Core properties
  private readonly form: HTMLFormElement;
  private readonly initialData: FormDataType;

  /**
   * Creates a new FormManager instance
   * @param config - Configuration object containing form and optional initial data
   */
  constructor({ form, initialData = {} }: FormType) {
    this.form = form;
    this.initialData = initialData;
    this.initialize();
  }

  /**
   * Initializes the form with initial data if provided
   */
  private initialize(): void {
    if (Object.keys(this.initialData).length > 0) {
      this.fillData(this.initialData);
    }
  }

  /**
   * Gets all form fields using the standard selector
   */
  private getFormFields(): NodeListOf<Element> {
    return this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);
  }

  /**
   * Finds the appropriate container for a form field
   */
  private getFieldContainer(field: Element): HTMLFieldSetElement | HTMLDivElement {
    const fieldset = field.closest('fieldset') as HTMLFieldSetElement;
    const div = field.closest('div') as HTMLDivElement;
    return fieldset || div;
  }

  /**
   * Resets validation state of a specific field
   * @param field - The form field element to reset
   */
  private resetFieldState(field: Element): void {
    const container = this.getFieldContainer(field);
    const feedback = container?.querySelector(FormManager.FEEDBACK_CLASSES);

    field.classList.remove(FormManager.VALIDATION_CLASSES.VALID, FormManager.VALIDATION_CLASSES.INVALID);
    feedback?.remove();
  }

  /**
   * Checks if a field name already exists in the data object
   */
  private isFieldProcessed(fieldName: string, data: FormDataType): boolean {
    return Object.prototype.hasOwnProperty.call(data, fieldName);
  }

  /**
   * Processes checkbox and radio input fields
   */
  private processChoiceInputs(field: HTMLInputElement, data: FormDataType): void {
    const { name } = field;
    const checkedInputs = this.form.querySelectorAll(`input[name="${name}"]:checked`) as NodeListOf<HTMLInputElement>;

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
  private processStandardInputs(field: HTMLInputElement, data: FormDataType): void {
    const { name, value, type } = field;

    const supportedTypes = [
      FormManager.INPUT_TYPES.TEXT,
      FormManager.INPUT_TYPES.NUMBER,
      FormManager.INPUT_TYPES.DATE,
      FormManager.INPUT_TYPES.DATETIME,
      FormManager.INPUT_TYPES.PASSWORD,
      FormManager.INPUT_TYPES.HIDDEN,
      FormManager.INPUT_TYPES.EMAIL,
      FormManager.INPUT_TYPES.URL,
      FormManager.INPUT_TYPES.TEL,
    ];

    if (supportedTypes.includes(type as any)) {
      data[name] = value.trim() === '' ? null : value;
    }
  }

  /**
   * Extracts value from an input field based on its type
   */
  private handleInputField(field: HTMLInputElement, data: FormDataType): void {
    const { type, name } = field;

    if (this.isFieldProcessed(name, data)) return;

    if (type === FormManager.INPUT_TYPES.CHECKBOX || type === FormManager.INPUT_TYPES.RADIO) {
      this.processChoiceInputs(field, data);
    } else {
      this.processStandardInputs(field, data);
    }
  }

  /**
   * Extracts value from a select field
   */
  private handleSelectField(field: HTMLSelectElement, data: FormDataType): void {
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
  private handleTextareaField(field: HTMLTextAreaElement, data: FormDataType): void {
    const { name, value } = field;
    data[name] = value.trim() === '' ? null : value;
  }

  /**
   * Extracts all form data into a structured object
   */
  public getData(): FormDataType {
    const data: FormDataType = {};
    const fields = this.getFormFields();

    for (const field of fields) {
      const { tagName } = field;

      switch (tagName.toUpperCase()) {
        case 'INPUT':
          this.handleInputField(field as HTMLInputElement, data);
          break;
        case 'SELECT':
          this.handleSelectField(field as HTMLSelectElement, data);
          break;
        case 'TEXTAREA':
          this.handleTextareaField(field as HTMLTextAreaElement, data);
          break;
      }
    }

    return data;
  }

  /**
   * Sets value for checkbox and radio inputs
   */
  private setChoiceInputValue(field: HTMLInputElement, value: FormDataType[string]): void {
    if (Array.isArray(value)) {
      field.checked = value.includes(field.value);
    } else {
      field.checked = value === true || field.value === String(value);
    }
  }

  /**
   * Sets value for standard input fields
   */
  private setStandardInputValue(field: HTMLInputElement, value: FormDataType[string]): void {
    field.value = String(value || '');
  }

  /**
   * Sets value for an input field based on its type
   */
  private fillInputField(field: HTMLInputElement, value: FormDataType[string]): void {
    const { type } = field;

    if (type === FormManager.INPUT_TYPES.CHECKBOX || type === FormManager.INPUT_TYPES.RADIO) {
      this.setChoiceInputValue(field, value);
    } else {
      this.setStandardInputValue(field, value);
    }
  }

  /**
   * Sets value for a select field (single or multiple selection)
   */
  private fillSelectField(field: HTMLSelectElement, value: FormDataType[string]): void {
    // Reset all options first
    Array.from(field.options).forEach((option) => {
      option.selected = false;
    });

    if (Array.isArray(value)) {
      // Handle multiple selection
      Array.from(field.options).forEach((option) => {
        option.selected = value.includes(option.value);
      });
    } else if (value !== null && value !== undefined && value !== '') {
      // Handle single selection
      const targetOption = Array.from(field.options).find((option) => option.value === String(value));
      if (targetOption) {
        targetOption.selected = true;
      }
    }
  }

  /**
   * Populates form fields with provided data
   */
  public fillData(data: FormDataType): void {
    const fields = this.getFormFields();

    for (const field of fields) {
      const { tagName } = field;
      const fieldName = (field as HTMLInputElement).name;

      if (!Object.prototype.hasOwnProperty.call(data, fieldName)) continue;

      const value = data[fieldName];
      this.resetFieldState(field);

      switch (tagName.toUpperCase()) {
        case 'INPUT':
          this.fillInputField(field as HTMLInputElement, value);
          break;
        case 'SELECT':
          this.fillSelectField(field as HTMLSelectElement, value);
          break;
        case 'TEXTAREA':
          (field as HTMLTextAreaElement).value = String(value || '');
          break;
      }
    }
  }

  /**
   * Escapes HTML content to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Creates and inserts an error message element
   */
  private createErrorElement(container: HTMLElement, errorMessage: string): void {
    const errorElement = document.createElement('small');
    errorElement.innerHTML = this.escapeHtml(errorMessage);
    errorElement.className = 'invalid-feedback';
    container.appendChild(errorElement);
  }

  /**
   * Applies validation styles for checkbox and radio groups
   */
  private applyChoiceFieldValidation(field: HTMLInputElement, isValid: boolean): void {
    const fieldName = field.name;
    const relatedFields = this.form.querySelectorAll(`input[name="${fieldName}"]`) as NodeListOf<HTMLInputElement>;

    relatedFields.forEach((relatedField) => {
      relatedField.classList.toggle(FormManager.VALIDATION_CLASSES.INVALID, !isValid);
      relatedField.classList.toggle(FormManager.VALIDATION_CLASSES.VALID, isValid);
    });
  }

  /**
   * Applies validation styles for standard fields
   */
  private applyStandardFieldValidation(field: Element, isValid: boolean): void {
    field.classList.toggle(FormManager.VALIDATION_CLASSES.INVALID, !isValid);
    field.classList.toggle(FormManager.VALIDATION_CLASSES.VALID, isValid);
  }

  /**
   * Displays or removes error message for a specific field
   */
  private displayFieldError(
    field: Element,
    container: HTMLFieldSetElement | HTMLDivElement,
    existingError: Element | null,
    errorMessage: string | null,
    isValid: boolean
  ): void {
    const isChoiceField = field.tagName === 'INPUT' && ['checkbox', 'radio'].includes((field as HTMLInputElement).type);

    // Apply validation styles
    if (isChoiceField) {
      this.applyChoiceFieldValidation(field as HTMLInputElement, isValid);
    } else {
      this.applyStandardFieldValidation(field, isValid);
    }

    // Handle error message display
    if (!isValid && errorMessage && !existingError) {
      this.createErrorElement(container, errorMessage);
    } else if (isValid && existingError) {
      existingError.remove();
    }
  }

  /**
   * Handles form validation violations and displays appropriate feedback
   */
  public handleViolations(violations: FormDataType): void {
    const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);

    for (const field of fields) {
      const fieldName = (field as HTMLInputElement).name;
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
  public resetFormFieldsState(): void {
    const fields = this.getFormFields();
    fields.forEach((field) => this.resetFieldState(field));
  }

  /**
   * Resets input field to its default state
   */
  private resetInputField(field: HTMLInputElement): void {
    const { type } = field;

    if (type === FormManager.INPUT_TYPES.CHECKBOX || type === FormManager.INPUT_TYPES.RADIO) {
      field.checked = false;
    } else {
      field.value = '';
    }
  }

  /**
   * Resets select field to its default state
   */
  private resetSelectField(field: HTMLSelectElement): void {
    Array.from(field.options).forEach((option) => {
      option.selected = false;
    });
  }

  /**
   * Resets textarea field to its default state
   */
  private resetTextareaField(field: HTMLTextAreaElement): void {
    field.value = '';
  }

  /**
   * Resets form to its initial state
   */
  public reset(): void {
    const fields = this.getFormFields();

    fields.forEach((field) => {
      const { tagName } = field;

      switch (tagName.toUpperCase()) {
        case 'INPUT':
          this.resetInputField(field as HTMLInputElement);
          break;
        case 'SELECT':
          this.resetSelectField(field as HTMLSelectElement);
          break;
        case 'TEXTAREA':
          this.resetTextareaField(field as HTMLTextAreaElement);
          break;
      }
    });

    // Reset validation states
    this.resetFormFieldsState();
  }

  /**
   * Gets the current initial data
   */
  public getInitialData(): FormDataType {
    return { ...this.initialData };
  }

  /**
   * Gets the form element
   */
  public getForm(): HTMLFormElement {
    return this.form;
  }
}

export { FormManager, FormDataType, FormType };
