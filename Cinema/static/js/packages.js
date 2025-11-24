class BasePackage {
    constructor(sender, recipient, weight, date) {
        this._sender = sender;
        this._recipient = recipient;
        this._weight = weight;
        this._date = date;
    }

    get sender() {
        return this._sender;
    }

    get recipient() {
        return this._recipient;
    }

    get weight() {
        return this._weight;
    }

    get date() {
        return this._date;
    }

    set sender(value) {
        this._sender = value;
    }

    set recipient(value) {
        this._recipient = value;
    }

    set weight(value) {
        this._weight = value;
    }

    set date(value) {
        this._date = value;
    }

    static createFromForm(formData) {
        return new this(
            formData.get('sender'),
            formData.get('recipient'),
            parseFloat(formData.get('weight')),
            formData.get('date')
        );
    }

    isFromLastMonth() {
        const packageDate = new Date(this._date);
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        return packageDate >= lastMonth && packageDate <= currentDate;
    }

    getPackageInfo() {
        return `Посылка от ${this._sender} к ${this._recipient}, вес: ${this._weight}кг`;
    }
}

class ExpressPackage extends BasePackage {
    constructor(sender, recipient, weight, date, priority, trackingNumber) {
        super(sender, recipient, weight, date);
        this._priority = priority;
        this._trackingNumber = trackingNumber;
    }

    get priority() {
        return this._priority;
    }

    get trackingNumber() {
        return this._trackingNumber;
    }

    set priority(value) {
        this._priority = value;
    }

    set trackingNumber(value) {
        this._trackingNumber = value;
    }

    static createFromForm(formData) {
        return new ExpressPackage(
            formData.get('sender'),
            formData.get('recipient'),
            parseFloat(formData.get('weight')),
            formData.get('date'),
            formData.get('priority') || 'standard',
            formData.get('trackingNumber') || ''
        );
    }

    getPackageInfo() {
        return `${super.getPackageInfo()}, приоритет: ${this._priority}, трек: ${this._trackingNumber || 'нет'}`;
    }

    calculateDeliveryTime() {
        return this._priority === 'express' ? 1 : 3;
    }
}

class PackageManager {
    constructor() {
        this.packages = [];
    }

    addPackage(packageObj) {
        this.packages.push(packageObj);
    }

    addFromForm(formElement) {
        const formData = new FormData(formElement);
        const packageObj = ExpressPackage.createFromForm(formData);
        this.addPackage(packageObj);
        formElement.reset();
        this.displayAll();
        return packageObj;
    }

    displayAll() {
        const output = document.getElementById('class-output');
        if (this.packages.length === 0) {
            output.innerHTML = '<div class="alert alert-info">Нет данных о посылках</div>';
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table packages-table">
                    <thead>
                        <tr>
                            <th>Отправитель</th>
                            <th>Получатель</th>
                            <th>Вес (кг)</th>
                            <th>Дата</th>
                            <th>Тип</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        this.packages.forEach(pkg => {
            const type = pkg instanceof ExpressPackage ? 'Экспресс' : 'Стандарт';
            html += `
                <tr>
                    <td>${pkg.sender}</td>
                    <td>${pkg.recipient}</td>
                    <td>${pkg.weight}</td>
                    <td>${pkg.date}</td>
                    <td>${type}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        output.innerHTML = html;
    }

    calculateResult() {
        const output = document.getElementById('class-output');
        const lastMonthPackages = this.packages.filter(pkg => pkg.isFromLastMonth());

        const recipients = {};
        lastMonthPackages.forEach(pkg => {
            if (!recipients[pkg.recipient]) {
                recipients[pkg.recipient] = { count: 0, totalWeight: 0 };
            }
            recipients[pkg.recipient].count++;
            recipients[pkg.recipient].totalWeight += pkg.weight;
        });

        const multipleRecipients = Object.entries(recipients)
            .filter(([_, data]) => data.count > 1);

        if (multipleRecipients.length === 0) {
            output.innerHTML = '<div class="alert alert-warning">Нет получателей с несколькими посылками за последний месяц</div>';
        } else {
            let html = '<div class="alert alert-success"><h5>Результат анализа:</h5><ul class="list-group mt-3">';
            multipleRecipients.forEach(([recipient, data]) => {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${recipient}
                        <span class="badge bg-primary rounded-pill">${data.totalWeight.toFixed(2)} кг (${data.count} посылок)</span>
                    </li>
                `;
            });
            html += '</ul></div>';
            output.innerHTML = html;
        }
    }

    generateTestData() {
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        
        const dates = [5, 10, 15, 20].map(days => {
            const date = new Date(lastMonth);
            date.setDate(lastMonth.getDate() + days);
            return date.toISOString().split('T')[0];
        });

        this.packages = [
            new ExpressPackage("Иванов", "Петров", 2.5, dates[0], "express", "TRK001"),
            new ExpressPackage("Сидоров", "Петров", 1.8, dates[1], "standard", "TRK002"),
            new BasePackage("Кузнецов", "Смирнов", 3.2, dates[2]),
            new ExpressPackage("Попов", "Иванова", 0.9, dates[3], "express", "TRK003"),
            new BasePackage("Новиков", "Петров", 4.1, dates[0]),
            new ExpressPackage("Васильев", "Смирнов", 2.7, dates[1], "standard", "TRK004"),
            new BasePackage("Морозов", "Иванова", 1.5, dates[2]),
            new ExpressPackage("Федоров", "Петров", 3.8, dates[3], "express", "TRK005"),
            new BasePackage("Орлов", "Козлов", 2.1, dates[0]),
            new ExpressPackage("Лебедев", "Смирнов", 1.2, dates[1], "standard", "TRK006")
        ];
        this.displayAll();
    }
}

function BaseFunctionalPackage(sender, recipient, weight, date) {
    this._sender = sender;
    this._recipient = recipient;
    this._weight = weight;
    this._date = date;
}

BaseFunctionalPackage.prototype.getSender = function() {
    return this._sender;
};

BaseFunctionalPackage.prototype.getRecipient = function() {
    return this._recipient;
};

BaseFunctionalPackage.prototype.getWeight = function() {
    return this._weight;
};

BaseFunctionalPackage.prototype.getDate = function() {
    return this._date;
};

BaseFunctionalPackage.prototype.setSender = function(value) {
    this._sender = value;
};

BaseFunctionalPackage.prototype.setRecipient = function(value) {
    this._recipient = value;
};

BaseFunctionalPackage.prototype.setWeight = function(value) {
    this._weight = value;
};

BaseFunctionalPackage.prototype.setDate = function(value) {
    this._date = value;
};

BaseFunctionalPackage.createFromForm = function(formData) {
    return new this(
        formData.get('sender'),
        formData.get('recipient'),
        parseFloat(formData.get('weight')),
        formData.get('date')
    );
};

BaseFunctionalPackage.prototype.isFromLastMonth = function() {
    const packageDate = new Date(this._date);
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    return packageDate >= lastMonth && packageDate <= currentDate;
};

BaseFunctionalPackage.prototype.getPackageInfo = function() {
    return `Посылка от ${this._sender} к ${this._recipient}, вес: ${this._weight}кг`;
};

function ExpressFunctionalPackage(sender, recipient, weight, date, priority, trackingNumber) {
    BaseFunctionalPackage.call(this, sender, recipient, weight, date);
    this._priority = priority;
    this._trackingNumber = trackingNumber;
}

ExpressFunctionalPackage.prototype = Object.create(BaseFunctionalPackage.prototype);
ExpressFunctionalPackage.prototype.constructor = ExpressFunctionalPackage;

ExpressFunctionalPackage.prototype.getPriority = function() {
    return this._priority;
};

ExpressFunctionalPackage.prototype.getTrackingNumber = function() {
    return this._trackingNumber;
};

ExpressFunctionalPackage.prototype.setPriority = function(value) {
    this._priority = value;
};

ExpressFunctionalPackage.prototype.setTrackingNumber = function(value) {
    this._trackingNumber = value;
};

ExpressFunctionalPackage.createFromForm = function(formData) {
    return new ExpressFunctionalPackage(
        formData.get('sender'),
        formData.get('recipient'),
        parseFloat(formData.get('weight')),
        formData.get('date'),
        formData.get('priority') || 'standard',
        formData.get('trackingNumber') || ''
    );
};

ExpressFunctionalPackage.prototype.getPackageInfo = function() {
    return `${BaseFunctionalPackage.prototype.getPackageInfo.call(this)}, приоритет: ${this._priority}, трек: ${this._trackingNumber || 'нет'}`;
};

ExpressFunctionalPackage.prototype.calculateDeliveryTime = function() {
    return this._priority === 'express' ? 1 : 3;
};

function FunctionalPackageManager() {
    this.packages = [];
}

FunctionalPackageManager.prototype.addPackage = function(packageObj) {
    this.packages.push(packageObj);
};

FunctionalPackageManager.prototype.addFromForm = function(formElement) {
    const formData = new FormData(formElement);
    const packageObj = ExpressFunctionalPackage.createFromForm(formData);
    this.addPackage(packageObj);
    formElement.reset();
    this.displayAll();
    return packageObj;
};

FunctionalPackageManager.prototype.displayAll = function() {
    const output = document.getElementById('functional-output');
    if (this.packages.length === 0) {
        output.innerHTML = '<div class="alert alert-info">Нет данных о посылках</div>';
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table packages-table">
                <thead>
                    <tr>
                        <th>Отправитель</th>
                        <th>Получатель</th>
                        <th>Вес (кг)</th>
                        <th>Дата</th>
                        <th>Тип</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    this.packages.forEach(pkg => {
        const type = pkg instanceof ExpressFunctionalPackage ? 'Экспресс' : 'Стандарт';
        html += `
            <tr>
                <td>${pkg.getSender()}</td>
                <td>${pkg.getRecipient()}</td>
                <td>${pkg.getWeight()}</td>
                <td>${pkg.getDate()}</td>
                <td>${type}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    output.innerHTML = html;
};

FunctionalPackageManager.prototype.calculateResult = function() {
    const output = document.getElementById('functional-output');
    const lastMonthPackages = this.packages.filter(pkg => pkg.isFromLastMonth());

    const recipients = {};
    lastMonthPackages.forEach(pkg => {
        const recipient = pkg.getRecipient();
        if (!recipients[recipient]) {
            recipients[recipient] = { count: 0, totalWeight: 0 };
        }
        recipients[recipient].count++;
        recipients[recipient].totalWeight += pkg.getWeight();
    });

    const multipleRecipients = Object.entries(recipients)
        .filter(([_, data]) => data.count > 1);

    if (multipleRecipients.length === 0) {
        output.innerHTML = '<div class="alert alert-warning">Нет получателей с несколькими посылками за последний месяц</div>';
    } else {
        let html = '<div class="alert alert-success"><h5>Результат анализа:</h5><ul class="list-group mt-3">';
        multipleRecipients.forEach(([recipient, data]) => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${recipient}
                    <span class="badge bg-primary rounded-pill">${data.totalWeight.toFixed(2)} кг (${data.count} посылок)</span>
                </li>
            `;
        });
        html += '</ul></div>';
        output.innerHTML = html;
    }
};

FunctionalPackageManager.prototype.generateTestData = function() {
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    
    const dates = [5, 10, 15, 20].map(days => {
        const date = new Date(lastMonth);
        date.setDate(lastMonth.getDate() + days);
        return date.toISOString().split('T')[0];
    });

    this.packages = [
        new ExpressFunctionalPackage("Иванов", "Петров", 2.5, dates[0], "express", "TRK001"),
        new ExpressFunctionalPackage("Сидоров", "Петров", 1.8, dates[1], "standard", "TRK002"),
        new BaseFunctionalPackage("Кузнецов", "Смирнов", 3.2, dates[2]),
        new ExpressFunctionalPackage("Попов", "Иванова", 0.9, dates[3], "express", "TRK003"),
        new BaseFunctionalPackage("Новиков", "Петров", 4.1, dates[0]),
        new ExpressFunctionalPackage("Васильев", "Смирнов", 2.7, dates[1], "standard", "TRK004"),
        new BaseFunctionalPackage("Морозов", "Иванова", 1.5, dates[2]),
        new ExpressFunctionalPackage("Федоров", "Петров", 3.8, dates[3], "express", "TRK005"),
        new BaseFunctionalPackage("Орлов", "Козлов", 2.1, dates[0]),
        new ExpressFunctionalPackage("Лебедев", "Смирнов", 1.2, dates[1], "standard", "TRK006")
    ];
    this.displayAll();
};

const functionalManager = new FunctionalPackageManager();
const classManager = new PackageManager();

document.getElementById('functional-form').addEventListener('submit', function(e) {
    e.preventDefault();
    functionalManager.addFromForm(this);
});

document.getElementById('class-form').addEventListener('submit', function(e) {
    e.preventDefault();
    classManager.addFromForm(this);
});
