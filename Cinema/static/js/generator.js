(function(){
    const STORAGE_KEY = "text_fields_generator";
    const container = document.getElementById("fields-container");
    const addButton = document.getElementById("add-field-btn");

    function loadFields() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveFields(fields) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
    }

    function createField(config = {}) {
        const fieldId = 'field_' + Date.now();
        const defaultConfig = {
            id: fieldId,
            name: '',
            placeholder: 'Введите текст',
            maxlength: '50',
            value: '',
            readonly: false,
            disabled: false
        };

        return { ...defaultConfig, ...config };
    }

    function validateMaxLength(value, maxlength) {
        if (!maxlength) return value;
        const max = parseInt(maxlength);
        if (isNaN(max)) return value;
        return value.slice(0, max);
    }

    function renderField(fieldConfig) {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'field-card';
        fieldElement.innerHTML = `
            <div class="field-preview">
                <input type="text" 
                       class="preview-input"
                       name="${fieldConfig.name}"
                       placeholder="${fieldConfig.placeholder}"
                       maxlength="${fieldConfig.maxlength}"
                       value="${fieldConfig.value}"
                       ${fieldConfig.readonly ? 'readonly' : ''}
                       ${fieldConfig.disabled ? 'disabled' : ''}>
            </div>
            
            <div class="field-settings">
                <div>
                    <label>Имя (name):</label>
                    <input type="text" class="setting-name" value="${fieldConfig.name}" placeholder="имя_поля">
                </div>
                <div>
                    <label>Подсказка (placeholder):</label>
                    <input type="text" class="setting-placeholder" value="${fieldConfig.placeholder}" placeholder="Текст подсказки">
                </div>
                <div>
                    <label>Макс. длина (maxlength):</label>
                    <input type="number" class="setting-maxlength" value="${fieldConfig.maxlength}" placeholder="50" min="1">
                </div>
                <div>
                    <label>Значение (value):</label>
                    <input type="text" class="setting-value" value="${fieldConfig.value}" placeholder="Значение по умолчанию">
                </div>
            </div>
            
            <div class="field-options">
                <label>
                    <input type="checkbox" class="setting-readonly" ${fieldConfig.readonly ? 'checked' : ''}>
                    Только чтение (readonly)
                </label>
                <label>
                    <input type="checkbox" class="setting-disabled" ${fieldConfig.disabled ? 'checked' : ''}>
                    Отключено (disabled)
                </label>
            </div>
            
            <div class="field-actions">
                <button class="btn btn-primary apply-btn">Применить</button>
                <button class="btn btn-danger remove-btn">Удалить</button>
            </div>
        `;

        const applyBtn = fieldElement.querySelector('.apply-btn');
        const removeBtn = fieldElement.querySelector('.remove-btn');
        const previewInput = fieldElement.querySelector('.preview-input');
        const settingValue = fieldElement.querySelector('.setting-value');
        const settingMaxlength = fieldElement.querySelector('.setting-maxlength');

        settingMaxlength.addEventListener('input', function() {
            const maxlength = parseInt(this.value) || 524288;
            const currentValue = settingValue.value;
            
            if (currentValue.length > maxlength) {
                settingValue.value = currentValue.slice(0, maxlength);
            }
        });

        settingValue.addEventListener('input', function() {
            const maxlength = parseInt(settingMaxlength.value) || 524288;
            
            if (this.value.length > maxlength) {
                this.value = this.value.slice(0, maxlength);
            }
        });

        applyBtn.addEventListener('click', function() {
            const fields = loadFields();
            const fieldIndex = fields.findIndex(f => f.id === fieldConfig.id);
            
            if (fieldIndex !== -1) {
                const name = fieldElement.querySelector('.setting-name').value;
                const placeholder = fieldElement.querySelector('.setting-placeholder').value;
                const maxlength = fieldElement.querySelector('.setting-maxlength').value;
                let value = fieldElement.querySelector('.setting-value').value;
                const readonly = fieldElement.querySelector('.setting-readonly').checked;
                const disabled = fieldElement.querySelector('.setting-disabled').checked;

                value = validateMaxLength(value, maxlength);

                fields[fieldIndex] = {
                    ...fields[fieldIndex],
                    name,
                    placeholder,
                    maxlength,
                    value,
                    readonly,
                    disabled
                };

                saveFields(fields);
                updatePreview(previewInput, fields[fieldIndex]);
            }
        });

        removeBtn.addEventListener('click', function() {
            if (confirm('Удалить это поле?')) {
                const fields = loadFields().filter(f => f.id !== fieldConfig.id);
                saveFields(fields);
                renderAllFields();
            }
        });

        return fieldElement;
    }

    function updatePreview(previewElement, config) {
        previewElement.name = config.name;
        previewElement.placeholder = config.placeholder;
        previewElement.maxLength = parseInt(config.maxlength) || 524288;
        previewElement.value = config.value;
        previewElement.readOnly = config.readonly;
        previewElement.disabled = config.disabled;
    }

    function renderAllFields() {
        const fields = loadFields();
        container.innerHTML = '';
        
        fields.forEach(fieldConfig => {
            const fieldElement = renderField(fieldConfig);
            container.appendChild(fieldElement);
        });
    }

    addButton.addEventListener('click', function() {
        const fields = loadFields();
        const newField = createField();
        fields.push(newField);
        saveFields(fields);
        renderAllFields();
    });

    document.addEventListener('DOMContentLoaded', function() {
        renderAllFields();
    });
})();