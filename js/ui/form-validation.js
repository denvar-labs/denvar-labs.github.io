// =====================================================
//  KA ESPORTS – Form Validation
//  Client-side form validation with error messages
// =====================================================

const FormValidator = (() => {
  const instances = new Map();

  class Validator {
    constructor(formId, options = {}) {
      this.form = document.getElementById(formId);
      if (!this.form) return;

      this.rules = options.rules || {};
      this.messages = options.messages || {};
      this.onValid = options.onValid || (() => {});
      this.onInvalid = options.onInvalid || (() => {});
      this.showErrorClass = options.showErrorClass !== false;

      this.init();
    }

    init() {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validate()) {
          this.onValid(this.getValues());
        }
      });

      this.form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => {
          if (field.classList.contains('field-error')) {
            this.validateField(field);
          }
        });
      });
    }

    validate() {
      let isValid = true;
      const errors = {};

      Object.keys(this.rules).forEach(fieldName => {
        const field = this.form.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;

        const fieldErrors = this.validateFieldRules(field, this.rules[fieldName]);
        if (fieldErrors.length > 0) {
          errors[fieldName] = fieldErrors;
          isValid = false;
          this.showFieldError(field, fieldErrors[0]);
        } else {
          this.clearFieldError(field);
        }
      });

      if (!isValid) this.onInvalid(errors);
      return isValid;
    }

    validateField(field) {
      const name = field.name || field.id;
      if (!name || !this.rules[name]) return true;

      const errors = this.validateFieldRules(field, this.rules[name]);
      if (errors.length > 0) {
        this.showFieldError(field, errors[0]);
        return false;
      } else {
        this.clearFieldError(field);
        return true;
      }
    }

    validateFieldRules(field, rules) {
      const errors = [];
      const value = field.value.trim();
      const name = field.name || field.id;
      const label = this.getLabel(field) || name;

      rules.forEach(rule => {
        const ruleType = typeof rule === 'string' ? rule : rule.type;
        const ruleParam = typeof rule === 'object' ? rule.value : undefined;
        const customMessage = typeof rule === 'object' ? rule.message : undefined;

        switch (ruleType) {
          case 'required':
            if (!value) errors.push(customMessage || `${label} is required`);
            break;
          case 'minLength':
            if (value && value.length < ruleParam) errors.push(customMessage || `${label} must be at least ${ruleParam} characters`);
            break;
          case 'maxLength':
            if (value && value.length > ruleParam) errors.push(customMessage || `${label} must be at most ${ruleParam} characters`);
            break;
          case 'min':
            if (value && parseFloat(value) < ruleParam) errors.push(customMessage || `${label} must be at least ${ruleParam}`);
            break;
          case 'max':
            if (value && parseFloat(value) > ruleParam) errors.push(customMessage || `${label} must be at most ${ruleParam}`);
            break;
          case 'email':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(customMessage || `${label} must be a valid email`);
            break;
          case 'pattern':
            if (value && !ruleParam.test(value)) errors.push(customMessage || `${label} format is invalid`);
            break;
          case 'match':
            const matchField = this.form.querySelector(`[name="${ruleParam}"], #${ruleParam}`);
            if (matchField && value !== matchField.value) errors.push(customMessage || `${label} must match ${this.getLabel(matchField) || ruleParam}`);
            break;
          case 'custom':
            if (ruleParam && !ruleParam(value, field)) errors.push(customMessage || `${label} is invalid`);
            break;
        }
      });

      return errors;
    }

    getLabel(field) {
      const label = this.form.querySelector(`label[for="${field.id}"]`);
      return label ? label.textContent.trim() : '';
    }

    showFieldError(field, message) {
      if (this.showErrorClass) field.classList.add('field-error');
      this.clearFieldError(field);

      const errorEl = document.createElement('div');
      errorEl.className = 'field-error-message';
      errorEl.textContent = message;
      errorEl.style.cssText = 'color:var(--danger);font-size:var(--text-xs);margin-top:4px;';
      field.parentNode.appendChild(errorEl);
    }

    clearFieldError(field) {
      if (this.showErrorClass) field.classList.remove('field-error');
      const existing = field.parentNode?.querySelector('.field-error-message');
      if (existing) existing.remove();
    }

    getValues() {
      const values = {};
      const formData = new FormData(this.form);
      for (const [key, value] of formData.entries()) {
        values[key] = value;
      }
      return values;
    }

    setValues(values) {
      Object.keys(values).forEach(key => {
        const field = this.form.querySelector(`[name="${key}"], #${key}`);
        if (field) field.value = values[key];
      });
    }

    reset() {
      this.form.reset();
      this.form.querySelectorAll('.field-error').forEach(f => f.classList.remove('field-error'));
      this.form.querySelectorAll('.field-error-message').forEach(el => el.remove());
    }

    destroy() {
      this.form.querySelectorAll('.field-error-message').forEach(el => el.remove());
    }
  }

  function create(formId, options) {
    if (instances.has(formId)) instances.get(formId).destroy();
    const validator = new Validator(formId, options);
    instances.set(formId, validator);
    return validator;
  }

  function get(formId) { return instances.get(formId); }

  return { create, get };
})();