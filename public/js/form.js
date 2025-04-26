class FormManager {
    constructor({ form, initialData }) {
        this.form = form;
        this.initialData = initialData;
        this.init();
    }
    getData() {
        var _a, _b, _c, _d;
        const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);
        const data = {};
        for (const field of fields) {
            const { tagName, name } = field;
            switch (tagName) {
                case 'INPUT':
                    const { type, value } = field;
                    if (data.hasOwnProperty(name)) {
                        continue;
                    }
                    else {
                        if (type === 'checkbox' || type === 'radio') {
                            const choices = this.form.querySelectorAll(`input[name="${name}"]:checked`);
                            if (Array.from(choices).length > 1) {
                                choices.forEach((el) => {
                                    if (!data.hasOwnProperty(name)) {
                                        data[name] = [];
                                    }
                                    data[name].push(el.value);
                                });
                            }
                            else {
                                data[name] =
                                    (_b = (_a = this.form.querySelector(`input[name="${name}"]:checked`)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
                            }
                        }
                        if (type === 'text' ||
                            type === 'number' ||
                            type === 'date' ||
                            type === 'datetime' ||
                            type === 'password' ||
                            type === 'hidden') {
                            data[name] = value === '' ? null : value;
                        }
                    }
                    break;
                case 'SELECT':
                    const choices = this.form.querySelectorAll(`select[name="${name}"] option`);
                    const selectedOptions = Array.from(choices).filter((option) => option.selected);
                    if (selectedOptions.length > 1) {
                        this.form.querySelectorAll(`select[name="${name}"] option`).forEach((option) => {
                            if (!data.hasOwnProperty(name)) {
                                data[name] = [];
                            }
                            option.selected && data[name].push(option.value);
                        });
                    }
                    else {
                        data[name] = (_d = (_c = this.form.querySelector(`select[name="${name}"]`)) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : null;
                    }
                    break;
                case 'TEXTAREA':
                    data[name] = field.value;
                    break;
                default:
                    break;
            }
        }
        return data;
    }
    fillData(data) {
        const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);
        for (const field of fields) {
            const { tagName, name } = field;
            if (data.hasOwnProperty(name)) {
                const value = data[name];
                switch (tagName) {
                    case 'INPUT':
                        const { type, value: choiceValue } = field;
                        if (type === 'checkbox' || type === 'radio') {
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
                        if (type === 'text' ||
                            type === 'number' ||
                            type === 'date' ||
                            type === 'datetime' ||
                            type === 'password' ||
                            type === 'hidden') {
                            field.value = value;
                        }
                        break;
                    case 'SELECT':
                        const { options } = field;
                        if (Array.isArray(value)) {
                            Array.from(options).forEach((opt) => {
                                opt.selected = value.includes(opt.value);
                            });
                        }
                        else if (value === null || value === '') {
                            continue;
                        }
                        else {
                            value;
                            const option = Array.from(options).find((opt) => opt.value === value);
                            option && (option.selected = true);
                        }
                        break;
                    case 'TEXTAREA':
                        field.value = value;
                        break;
                    default:
                        break;
                }
            }
            else {
                continue;
            }
        }
    }
    validateData(violations) {
        const fields = this.form.querySelectorAll(FormManager.FORM_FIELD_SELECTOR);
        for (const field of fields) {
            const { tagName, name } = field;
            const container = field.closest('fieldset') || field.closest('div');
            let error = container.querySelector('.invalid-feedback');
            if (violations.hasOwnProperty(name)) {
                if ((tagName === 'INPUT' && field.type === 'checkbox') ||
                    field.type === 'radio') {
                    const choices = this.form.querySelectorAll(`input[name="${name}"]`);
                    choices.forEach((el) => {
                        el.classList.add('is-invalid');
                    });
                }
                else {
                    field.classList.add('is-invalid');
                }
                if (error === null) {
                    error = document.createElement('small');
                    error.innerHTML = violations[name];
                    error.classList.add('invalid-feedback');
                    container.insertAdjacentElement('beforeend', error);
                }
            }
            else {
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
            const container = field.closest('fieldset') || field.closest('div');
            const feedback = container.querySelector('.invalid-feedback, valid-feedback');
            if (tagName === 'INPUT') {
                const { type } = field;
                if (type === 'checkbox' || type === 'radio') {
                    field.checked = false;
                }
                if (type === 'text' ||
                    type === 'number' ||
                    type === 'date' ||
                    type === 'datetime' ||
                    type === 'password' ||
                    type === 'hidden') {
                    field.value = '';
                }
            }
            if (tagName === 'SELECT') {
                const { options } = field;
                Array.from(options).forEach((opt) => (opt.selected = false));
            }
            if (tagName === 'TEXTAREA') {
                field.value = '';
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
FormManager.FORM_FIELD_SELECTOR = 'input, select, textarea';
const initialData = {
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
const formManager = new FormManager({ form: document.getElementById('formManagerId'), initialData });
formManager.validateData(violations);
// formManager.reset();
