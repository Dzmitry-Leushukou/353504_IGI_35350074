class EmployeeTable {
    constructor(config) {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.pageSize = 3;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filterText = '';
        this.isAdmin = config.isAdmin;
        this.apiEndpoints = config.apiEndpoints;
        this.staticUrl = config.staticUrl;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.render();
    }

    showPreloader() {
        const preloader = document.getElementById('global-preloader');
        if (preloader) {
            preloader.style.display = 'flex';
        }
    }

    hidePreloader() {
        const preloader = document.getElementById('global-preloader');
        if (preloader) {
            preloader.style.display = 'none';
        }
    }

    async loadData() {
        this.showPreloader();
        
        try {
            const response = await fetch(this.apiEndpoints.employees);
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            const result = await response.json();
            
            if (result.employees && result.employees.length > 0) {
                this.data = result.employees.map(emp => ({
                    id: emp.id,
                    full_name: emp.full_name,
                    position: emp.position,
                    phone: emp.phone,
                    email: emp.email,
                    photo_url: emp.photo_url,
                    description: emp.description
                }));
            } else {
                // Если данных нет, оставляем пустой массив
                this.data = [];
            }
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Показываем сообщение об ошибке вместо использования демо-данных
            this.showNotification('Ошибка загрузки данных: ' + error.message, 'error');
            this.data = [];
        } finally {
            setTimeout(() => {
                this.hidePreloader();
            }, 500);
        }
    }

    getDemoData() {
        // Вместо возврата фиктивных данных, возвращаем пустой массив
        // Это заставит приложение отображать сообщение "Сотрудники не найдены"
        return [];
    }

    bindEvents() {
        // Сортировка
        document.querySelectorAll('#emp-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => this.sortTable(th.dataset.sort));
        });

        // Фильтрация
        const filterBtn = document.getElementById('filter-btn');
        const resetBtn = document.getElementById('reset-btn');
        const filterInput = document.getElementById('filter-input');

        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.filterText = filterInput.value.toLowerCase();
                this.currentPage = 1;
                this.render();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                filterInput.value = '';
                this.filterText = '';
                this.currentPage = 1;
                this.render();
            });
        }

        if (filterInput) {
            filterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.filterText = filterInput.value.toLowerCase();
                    this.currentPage = 1;
                    this.render();
                }
            });
        }

        // Добавление сотрудника (только для админов)
        if (this.isAdmin) {
            const addBtn = document.getElementById('add-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const employeeForm = document.getElementById('employee-form');
            const rewardBtn = document.getElementById('btn-reward');

            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    document.getElementById('add-form').style.display = 'block';
                });
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    document.getElementById('add-form').style.display = 'none';
                    this.resetForm();
                });
            }

            if (employeeForm) {
                employeeForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addEmployee();
                });
            }

            // Валидация в реальном времени
            const phoneInput = document.getElementById('phone');
            const urlInput = document.getElementById('photo_url');

            if (phoneInput) {
                phoneInput.addEventListener('input', () => {
                    this.validatePhone();
                    this.checkFormValidity();
                });
            }

            if (urlInput) {
                urlInput.addEventListener('input', () => {
                    this.validateUrl();
                    this.checkFormValidity();
                });
            }

            // Проверка валидности формы при изменении полей
            ['full_name', 'position', 'email', 'description'].forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    element.addEventListener('input', () => this.checkFormValidity());
                }
            });

            // Премирование
            if (rewardBtn) {
                rewardBtn.addEventListener('click', () => this.rewardEmployees());
            }
        }
    }

    checkFormValidity() {
        if (!this.isAdmin) return;

        const fullName = document.getElementById('full_name')?.value.trim() || '';
        const position = document.getElementById('position')?.value || '';
        const phone = document.getElementById('phone')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const description = document.getElementById('description')?.value.trim() || '';
        const photoUrl = document.getElementById('photo_url')?.value.trim() || '';

        const isPhoneValid = this.validatePhone(true);
        const isUrlValid = photoUrl ? this.validateUrl(true) : true;
        
        const allRequiredFilled = fullName && position && phone && email && description;
        const allValid = isPhoneValid && isUrlValid;

        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.disabled = !(allRequiredFilled && allValid);
        }
    }

    validatePhone(silent = false) {
        const phoneInput = document.getElementById('phone');
        const phoneValidation = document.getElementById('phone-validation');
        
        if (!phoneInput) return false;

        const phone = phoneInput.value;
        const phoneRegex = /^(\+375\s?\(\d{2}\)\s?\d{3}[- ]?\d{2}[- ]?\d{2}|8\s?\(\d{3}\)\s?\d{3}[- ]?\d{4}|8029\d{7}|8\s?\d{3}\s?\d{3}[- ]?\d{4})$/;
        const phoneValid = phoneRegex.test(phone.replace(/\s/g, ''));
        
        if (!silent) {
            if (phone && !phoneValid) {
                if (phoneValidation) {
                    phoneValidation.textContent = 'Неверный формат телефона. Пример: +375 (29) 123-45-67';
                    phoneValidation.style.display = 'block';
                }
                phoneInput.classList.add('invalid-field');
                return false;
            } else {
                if (phoneValidation) {
                    phoneValidation.style.display = 'none';
                }
                phoneInput.classList.remove('invalid-field');
                return true;
            }
        }
        
        return phoneValid;
    }

    validateUrl(silent = false) {
        const urlInput = document.getElementById('photo_url');
        const urlValidation = document.getElementById('url-validation');
        
        if (!urlInput) return true;

        const url = urlInput.value;
        const urlRegex = /^(http:\/\/|https:\/\/).*\.(php|html)$/;
        const urlValid = url ? urlRegex.test(url) : true;
        
        if (!silent) {
            if (url && !urlValid) {
                if (urlValidation) {
                    urlValidation.textContent = 'URL должен начинаться с http:// или https:// и заканчиваться на .php или .html';
                    urlValidation.style.display = 'block';
                }
                urlInput.classList.add('invalid-field');
                return false;
            } else {
                if (urlValidation) {
                    urlValidation.style.display = 'none';
                }
                urlInput.classList.remove('invalid-field');
                return true;
            }
        }
        
        return urlValid;
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.render();
    }

    applyFilter() {
        if (!this.filterText) {
            this.filteredData = [...this.data];
            return;
        }

        this.filteredData = this.data.filter(employee => 
            employee.full_name.toLowerCase().includes(this.filterText) ||
            employee.position.toLowerCase().includes(this.filterText) ||
            employee.phone.toLowerCase().includes(this.filterText) ||
            employee.email.toLowerCase().includes(this.filterText) ||
            (employee.description && employee.description.toLowerCase().includes(this.filterText))
        );
    }

    applySort() {
        if (!this.sortColumn) return;

        this.filteredData.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];

            if (this.sortColumn === 'phone') {
                // Нормализация телефонных номеров для сортировки
                aVal = aVal.replace(/\D/g, '');
                bVal = bVal.replace(/\D/g, '');
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderTable() {
        const tbody = document.querySelector('#emp-table tbody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = '';

        if (pageData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="${this.isAdmin ? 6 : 5}" class="text-center py-4 text-muted">Сотрудники не найдены</td>`;
            tbody.appendChild(row);
            return;
        }

        pageData.forEach(employee => {
            const row = document.createElement('tr');
            row.addEventListener('click', (e) => {
                // Не показываем детали при клике на чекбокс
                if (!e.target.classList.contains('employee-checkbox')) {
                    this.showRowDetails(employee);
                }
            });

            const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZGVlMmU2Ii8+CjxwYXRoIGQ9Ik0zMCAzM0MzMy44NjYgMzMgMzcgMzAuMDg1OCAzNyAyNkMzNyAyMS45MTQyIDMzLjg2NiAxOSAzMCAxOUMyNi4xMzQgMTkgMjMgMjEuOTE0MiAyMyAyNkMyMyAzMC4wODU4IDI2LjEzNCAzMyAzMCAzM1pNNDQgNDNDNDQgNDEuODk1NCA0My4xMDQ2IDQxIDQyIDQxSDE4QzE2Ljg5NTQgNDEgMTYgNDEuODk1NCAxNiA0M1Y0NUMxNiA0Ni4xMDQ2IDE2Ljg5NTQgNDcgMTggNDdINDJDNjMuMTA0NiA0NyA0NCA0Ni4xMDQ2IDQ0IDQ1VjQzWiIgZmlsbD0iIzZjNzU4MCIvPgo8L3N2Zz4=';
            
            const photoCell = `<td>
                <img src="${employee.photo_url || defaultAvatar}" alt="${employee.full_name}" 
                     class="employee-photo"
                     onerror="this.src='${defaultAvatar}'">
            </td>`;

            const checkboxCell = this.isAdmin ? 
                `<td class="text-center">
                    <input type="checkbox" class="employee-checkbox form-check-input" data-id="${employee.id}"
                           onchange="window.employeeTable.updateRewardButton()">
                </td>` : '';

            row.innerHTML = `
                ${photoCell}
                <td>${employee.full_name}</td>
                <td>${employee.position}</td>
                <td>${employee.phone}</td>
                <td>${employee.email}</td>
                ${checkboxCell}
            `;

            tbody.appendChild(row);
        });

        // Обновление индикаторов сортировки
        document.querySelectorAll('#emp-table th[data-sort]').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === this.sortColumn) {
                th.classList.add(`sort-${this.sortDirection}`);
            }
        });
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        const pager = document.getElementById('pager');
        
        if (!pager) return;

        pager.innerHTML = '';

        if (totalPages <= 1) return;

        // Кнопка "Назад"
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });
        pager.appendChild(prevLi);

        // Номера страниц
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentPage = i;
                this.render();
            });
            pager.appendChild(li);
        }

        // Кнопка "Вперед"
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });
        pager.appendChild(nextLi);
    }

    render() {
        this.applyFilter();
        this.applySort();
        this.renderTable();
        this.renderPagination();
        this.updateRewardButton();
    }

    showRowDetails(employee) {
        const detailsDiv = document.getElementById('row-details');
        const contentDiv = document.getElementById('row-details-content');
        
        if (!detailsDiv || !contentDiv) return;

        const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZGVlMmU2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTEwQzExMi44NzUgMTEwIDEyMyAxMDAuMjg2IDEyMyA4OEMxMjMgNzUuNzE0IDExMi44NzUgNjYgMTAwIDY2Qzg3LjEyNSA2NiA3NyA3NS43MTQgNzcgODhDNzcgMTAwLjI4NiA4Ny4xMjUgMTEwIDEwMCAxMTBaTTE0NyAxNDNDMTQ3IDE0MS44OTUgMTQ2LjEwNSAxNDEgMTQ1IDE0MUg1NUM1My44OTUgMTQxIDUzIDE0MS44OTUgNTMgMTQzVjE0N0M1MyAxNDguMTA1IDUzLjg5NSAxNDkgNTUgMTQ5SDE0NUMxNDYuMTA1IDE0OSAxNDcgMTQ4LjEwNSAxNDcgMTQ3VjE0M1oiIGZpbGw9IiM2Yzc1ODAiLz4KPC9zdmc+';
        
        contentDiv.innerHTML = `
            <div class="row">
                <div class="col-md-3 text-center">
                    <img src="${employee.photo_url || defaultAvatar}" alt="${employee.full_name}" 
                         class="img-fluid rounded mb-3" style="max-height: 200px;"
                         onerror="this.src='${defaultAvatar}'">
                </div>
                <div class="col-md-9">
                    <h4>${employee.full_name}</h4>
                    <p><strong>Должность:</strong> ${employee.position}</p>
                    <p><strong>Телефон:</strong> ${employee.phone}</p>
                    <p><strong>Email:</strong> ${employee.email}</p>
                    <p><strong>Описание работ:</strong> ${employee.description || 'Описание не указано'}</p>
                </div>
            </div>
        `;
        
        detailsDiv.style.display = 'block';
    }

    async addEmployee() {
        if (!this.isAdmin) {
            this.showNotification('Только администраторы могут добавлять сотрудников', 'warning');
            return;
        }

        const formData = {
            full_name: document.getElementById('full_name')?.value.trim() || '',
            position: document.getElementById('position')?.value || '',
            phone: document.getElementById('phone')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            photo_url: document.getElementById('photo_url')?.value.trim() || '',
            description: document.getElementById('description')?.value.trim() || ''
        };

        // Валидация
        if (!this.validatePhone(true) || !this.validateUrl(true)) {
            this.showNotification('Исправьте ошибки в форме', 'error');
            return;
        }

        this.showPreloader();

        try {
            const response = await fetch(this.apiEndpoints.employees, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                // Добавляем нового сотрудника в таблицу
                this.data.unshift({
                    id: result.employee.id,
                    full_name: result.employee.full_name,
                    position: result.employee.position,
                    phone: result.employee.phone,
                    email: result.employee.email,
                    photo_url: result.employee.photo_url,
                    description: result.employee.description
                });
                this.resetForm();
                document.getElementById('add-form').style.display = 'none';
                this.currentPage = 1;
                this.render();
                
                this.showNotification('Сотрудник успешно добавлен!', 'success');
            } else {
                throw new Error(result.error || 'Ошибка при добавлении сотрудника');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.hidePreloader();
        }
    }

    async rewardEmployees() {
        if (!this.isAdmin) {
            this.showNotification('Только администраторы могут премировать сотрудников', 'warning');
            return;
        }

        const selectedCheckboxes = document.querySelectorAll('.employee-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            const rewardResult = document.getElementById('reward-result');
            if (rewardResult) {
                rewardResult.innerHTML = '<div class="alert alert-warning">Выберите сотрудников для премирования</div>';
            }
            return;
        }

        const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.id);

        this.showPreloader();

        try {
            const response = await fetch(this.apiEndpoints.reward, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({ employee_ids: selectedIds })
            });

            const result = await response.json();

            if (response.ok) {
                const rewardResult = document.getElementById('reward-result');
                if (rewardResult) {
                    rewardResult.innerHTML = `
                        <div class="alert alert-success">
                            <h5>🎉 Премирование сотрудников</h5>
                            <p>${result.message}</p>
                            <p class="mb-0"><strong>Премировано сотрудников:</strong> ${result.rewarded_count}</p>
                        </div>
                    `;
                }

                // Сбрасываем чекбоксы
                selectedCheckboxes.forEach(checkbox => checkbox.checked = false);
                this.updateRewardButton();
            } else {
                throw new Error(result.error || 'Ошибка при премировании');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            const rewardResult = document.getElementById('reward-result');
            if (rewardResult) {
                rewardResult.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        } finally {
            this.hidePreloader();
        }
    }

    updateRewardButton() {
        if (!this.isAdmin) return;
        
        const selectedCount = document.querySelectorAll('.employee-checkbox:checked').length;
        const rewardBtn = document.getElementById('btn-reward');
        
        if (rewardBtn) {
            if (selectedCount > 0) {
                rewardBtn.disabled = false;
                rewardBtn.textContent = `Премировать выбранных (${selectedCount})`;
            } else {
                rewardBtn.disabled = true;
                rewardBtn.textContent = 'Премировать выбранных';
            }
        }
    }

    resetForm() {
        const form = document.getElementById('employee-form');
        if (form) form.reset();
        
        const phoneValidation = document.getElementById('phone-validation');
        const urlValidation = document.getElementById('url-validation');
        const phoneInput = document.getElementById('phone');
        const urlInput = document.getElementById('photo_url');
        const submitBtn = document.getElementById('submit-btn');

        if (phoneValidation) phoneValidation.style.display = 'none';
        if (urlValidation) urlValidation.style.display = 'none';
        if (phoneInput) phoneInput.classList.remove('invalid-field');
        if (urlInput) urlInput.classList.remove('invalid-field');
        if (submitBtn) submitBtn.disabled = true;
    }

    getCSRFToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    showNotification(message, type = 'info') {
        // Удаляем существующие уведомления
        document.querySelectorAll('.alert-toast').forEach(alert => alert.remove());

        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} alert-toast alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        notification.style.zIndex = '10000';
        notification.innerHTML = `
            <strong>${type === 'success' ? 'Успех!' : 
                      type === 'error' ? 'Ошибка!' : 
                      type === 'warning' ? 'Внимание!' : 'Информация'}</strong> 
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (window.CINEMA_CONFIG) {
        window.employeeTable = new EmployeeTable(window.CINEMA_CONFIG);
    }
});