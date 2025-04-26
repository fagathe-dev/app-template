interface FormType {
  form: HTMLFormElement;
  initialData?: FormDataType;
}

type FormDataType = Record<string, string | boolean | number | null | Array<string | boolean | number | null>>;

class FormManager {
  form: HTMLFormElement;
  initialData: FormDataType;
  static FORM_FIELD_SELECTOR = 'input, select, textarea';

  constructor({ form, initialData }: FormType) {
    this.form = form;
    this.initialData = initialData as FormDataType;
    this.init();
  }

  getData() {
    const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);
    const data: FormDataType = {};

    for (const field of fields) {
      const { tagName, name } = field as HTMLInputElement;
      switch (tagName) {
        case 'INPUT':
          const { type, value } = field as HTMLInputElement;
          if (data.hasOwnProperty(name)) {
            continue;
          } else {
            if (type === 'checkbox' || type === 'radio') {
              const choices = this.form.querySelectorAll(
                `input[name="${name}"]:checked`
              ) as NodeListOf<HTMLInputElement>;
              if (Array.from(choices).length > 1) {
                choices.forEach((el: HTMLInputElement) => {
                  if (!data.hasOwnProperty(name)) {
                    data[name] = [];
                  }
                  (data[name] as Array<string>).push(el.value);
                });
              } else {
                data[name] =
                  (this.form.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value ?? null;
              }
            }
            if (
              type === 'text' ||
              type === 'number' ||
              type === 'date' ||
              type === 'datetime' ||
              type === 'password' ||
              type === 'hidden'
            ) {
              data[name] = value === '' ? null : value;
            }
          }
          break;
        case 'SELECT':
          const choices = this.form.querySelectorAll(`select[name="${name}"] option`) as NodeListOf<HTMLOptionElement>;
          const selectedOptions = Array.from(choices).filter((option: HTMLOptionElement) => option.selected);
          if (selectedOptions.length > 1) {
            (this.form.querySelectorAll(`select[name="${name}"] option`) as NodeListOf<HTMLOptionElement>).forEach(
              (option: HTMLOptionElement) => {
                if (!data.hasOwnProperty(name)) {
                  data[name] = [];
                }
                option.selected && (data[name] as Array<string>).push(option.value);
              }
            );
          } else {
            data[name] = (this.form.querySelector(`select[name="${name}"]`) as HTMLSelectElement)?.value ?? null;
          }
          break;
        case 'TEXTAREA':
          data[name] = (field as HTMLTextAreaElement).value;
          break;
        default:
          break;
      }
    }

    return data;
  }

  fillData(data: FormDataType) {
    const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);

    for (const field of fields) {
      const { tagName, name } = field as HTMLInputElement;
      if (data.hasOwnProperty(name)) {
        const value = data[name];
        switch (tagName) {
          case 'INPUT':
            const { type, value: choiceValue } = field as HTMLInputElement;
            if (type === 'checkbox' || type === 'radio') {
              if (Array.isArray(value)) {
                value.forEach((v) => {
                  if (choiceValue === (v as string)) {
                    (field as HTMLInputElement).checked = true;
                  }
                });
              }
              if (value === false || value === null) {
                (field as HTMLInputElement).checked = false;
              }
              if (value === true) {
                (field as HTMLInputElement).checked = true;
              }
            }
            if (
              type === 'text' ||
              type === 'number' ||
              type === 'date' ||
              type === 'datetime' ||
              type === 'password' ||
              type === 'hidden'
            ) {
              (field as HTMLInputElement).value = value as string;
            }

            break;
          case 'SELECT':
            const { options } = field as HTMLSelectElement;
            if (Array.isArray(value)) {
              Array.from(options).forEach((opt) => {
                opt.selected = value.includes(opt.value);
              });
            } else if (value === null || value === '') {
              continue;
            } else {
              value as string;
              const option = Array.from(options).find((opt) => opt.value === value);
              option && (option.selected = true);
            }
            break;
          case 'TEXTAREA':
            (field as HTMLTextAreaElement).value = value as string;
            break;
          default:
            break;
        }
      } else {
        continue;
      }
    }
  }

  validateData(violations: FormDataType) {
    const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);

    for (const field of fields) {
      const { tagName, name } = field as HTMLInputElement;
      const container = (field.closest('fieldset') as HTMLFieldSetElement) || (field.closest('div') as HTMLDivElement);
      let error = container.querySelector('.invalid-feedback');

      if (violations.hasOwnProperty(name)) {
        if (
          (tagName === 'INPUT' && (field as HTMLInputElement).type === 'checkbox') ||
          (field as HTMLInputElement).type === 'radio'
        ) {
          const choices = this.form.querySelectorAll(`input[name="${name}"]`) as NodeListOf<HTMLInputElement>;
          choices.forEach((el: HTMLInputElement) => {
            el.classList.add('is-invalid');
          });
        } else {
          field.classList.add('is-invalid');
        }
        if (error === null) {
          error = document.createElement('small') as HTMLElement;
          error.innerHTML = violations[name] as string;
          error.classList.add('invalid-feedback');
          container.insertAdjacentElement('beforeend', error);
        }
      } else {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        if (error !== null) {
          error.remove();
        }
      }
    }
  }

  reset() {
    const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);

    fields.forEach((field) => {
      const { tagName } = field;
      const container = (field.closest('fieldset') as HTMLFieldSetElement) || (field.closest('div') as HTMLDivElement);
      const feedback = container.querySelector('.invalid-feedback, valid-feedback');
      if (tagName === 'INPUT') {
        const { type } = field as HTMLInputElement;
        if (type === 'checkbox' || type === 'radio') {
          (field as HTMLInputElement).checked = false;
        }
        if (
          type === 'text' ||
          type === 'number' ||
          type === 'date' ||
          type === 'datetime' ||
          type === 'password' ||
          type === 'hidden'
        ) {
          (field as HTMLInputElement).value = '';
        }
      }
      if (tagName === 'SELECT') {
        const { options } = field as HTMLSelectElement;
        Array.from(options).forEach((opt) => (opt.selected = false));
      }
      if (tagName === 'TEXTAREA') {
        (field as HTMLTextAreaElement).value = '';
      }

      field.classList.remove('is-valid', 'is-invalid');
      feedback && feedback.remove();
    });
  }

  init() {
    this.form.addEventListener('reset', (e) => {
      e.preventDefault();
      this.reset();
    });

    if (this.initialData) {
      this.fillData(this.initialData);
    }
  }
}

const initialData: FormDataType = {
  transport: ['Train', 'Bus'],
  isActive: false,
  exampleSelect: '4',
  password: 'testPassword',
  dueDate: '2002-01-12',
  message: `kkdlkdlkdldlkdl


dlekfle


d;mdlmd
`,
};

const violations = {
  transport: 'This field is required',
  isActive: 'This field is required',
  message: 'This field is required',
  dueDate: 'This field is required',
};

const formManager = new FormManager({ form: document.getElementById('formManagerId') as HTMLFormElement, initialData });

formManager.validateData(violations);

// formManager.reset();
