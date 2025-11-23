class Package {
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
        const packageObj = Package.createFromForm(formData);
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
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        this.packages.forEach(pkg => {
            html += `
                <tr>
                    <td>${pkg.sender}</td>
                    <td>${pkg.recipient}</td>
                    <td>${pkg.weight}</td>
                    <td>${pkg.date}</td>
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
        
        const date1 = new Date(lastMonth);
        date1.setDate(lastMonth.getDate() + 5);
        
        const date2 = new Date(lastMonth);
        date2.setDate(lastMonth.getDate() + 10);
        
        const date3 = new Date(lastMonth);
        date3.setDate(lastMonth.getDate() + 15);
        
        const date4 = new Date(lastMonth);
        date4.setDate(lastMonth.getDate() + 20);

        this.packages = [
            new Package("Иванов", "Петров", 2.5, date1.toISOString().split('T')[0]),
            new Package("Сидоров", "Петров", 1.8, date2.toISOString().split('T')[0]),
            new Package("Кузнецов", "Смирнов", 3.2, date3.toISOString().split('T')[0]),
            new Package("Попов", "Иванова", 0.9, date4.toISOString().split('T')[0]),
            new Package("Новиков", "Петров", 4.1, date1.toISOString().split('T')[0]),
            new Package("Васильев", "Смирнов", 2.7, date2.toISOString().split('T')[0]),
            new Package("Морозов", "Иванова", 1.5, date3.toISOString().split('T')[0]),
            new Package("Федоров", "Петров", 3.8, date4.toISOString().split('T')[0]),
            new Package("Орлов", "Козлов", 2.1, date1.toISOString().split('T')[0]),
            new Package("Лебедев", "Смирнов", 1.2, date2.toISOString().split('T')[0])
        ];
        this.displayAll();
    }
}

function FunctionalPackage(sender, recipient, weight, date) {
    this._sender = sender;
    this._recipient = recipient;
    this._weight = weight;
    this._date = date;
}

FunctionalPackage.prototype.getSender = function() {
    return this._sender;
};

FunctionalPackage.prototype.getRecipient = function() {
    return this._recipient;
};

FunctionalPackage.prototype.getWeight = function() {
    return this._weight;
};

FunctionalPackage.prototype.getDate = function() {
    return this._date;
};

FunctionalPackage.prototype.setSender = function(value) {
    this._sender = value;
};

FunctionalPackage.prototype.setRecipient = function(value) {
    this._recipient = value;
};

FunctionalPackage.prototype.setWeight = function(value) {
    this._weight = value;
};

FunctionalPackage.prototype.setDate = function(value) {
    this._date = value;
};

FunctionalPackage.createFromForm = function(formData) {
    return new this(
        formData.get('sender'),
        formData.get('recipient'),
        parseFloat(formData.get('weight')),
        formData.get('date')
    );
};

FunctionalPackage.prototype.isFromLastMonth = function() {
    const packageDate = new Date(this._date);
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    return packageDate >= lastMonth && packageDate <= currentDate;
};

function FunctionalPackageManager() {
    this.packages = [];
}

FunctionalPackageManager.prototype.addPackage = function(packageObj) {
    this.packages.push(packageObj);
};

FunctionalPackageManager.prototype.addFromForm = function(formElement) {
    const formData = new FormData(formElement);
    const packageObj = FunctionalPackage.createFromForm(formData);
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
                    </tr>
                </thead>
                <tbody>
    `;
    
    this.packages.forEach(pkg => {
        html += `
            <tr>
                <td>${pkg.getSender()}</td>
                <td>${pkg.getRecipient()}</td>
                <td>${pkg.getWeight()}</td>
                <td>${pkg.getDate()}</td>
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
    
    const date1 = new Date(lastMonth);
    date1.setDate(lastMonth.getDate() + 5);
    
    const date2 = new Date(lastMonth);
    date2.setDate(lastMonth.getDate() + 10);
    
    const date3 = new Date(lastMonth);
    date3.setDate(lastMonth.getDate() + 15);
    
    const date4 = new Date(lastMonth);
    date4.setDate(lastMonth.getDate() + 20);

    this.packages = [
        new FunctionalPackage("Иванов", "Петров", 2.5, date1.toISOString().split('T')[0]),
        new FunctionalPackage("Сидоров", "Петров", 1.8, date2.toISOString().split('T')[0]),
        new FunctionalPackage("Кузнецов", "Смирнов", 3.2, date3.toISOString().split('T')[0]),
        new FunctionalPackage("Попов", "Иванова", 0.9, date4.toISOString().split('T')[0]),
        new FunctionalPackage("Новиков", "Петров", 4.1, date1.toISOString().split('T')[0]),
        new FunctionalPackage("Васильев", "Смирнов", 2.7, date2.toISOString().split('T')[0]),
        new FunctionalPackage("Морозов", "Иванова", 1.5, date3.toISOString().split('T')[0]),
        new FunctionalPackage("Федоров", "Петров", 3.8, date4.toISOString().split('T')[0]),
        new FunctionalPackage("Орлов", "Козлов", 2.1, date1.toISOString().split('T')[0]),
        new FunctionalPackage("Лебедев", "Смирнов", 1.2, date2.toISOString().split('T')[0])
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