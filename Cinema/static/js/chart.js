// Функция для вычисления факториала
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Функция для вычисления ряда Тейлора для sin(x)
function taylorSin(x, n) {
    let sum = 0;
    for (let i = 0; i <= n; i++) {
        const term = Math.pow(-1, i) * Math.pow(x, 2 * i + 1) / factorial(2 * i + 1);
        sum += term;
    }
    return sum;
}

// Создание и обновление графика
let functionChart = null;
let isAnimating = false;

// Функция для получения данных графика
function getChartData() {
    const n = parseInt(document.getElementById('nValue').value);
    const xMin = parseFloat(document.getElementById('xMin').value);
    const xMax = parseFloat(document.getElementById('xMax').value);
    const step = parseFloat(document.getElementById('step').value);
    
    // Генерация данных
    const labels = [];
    const seriesData = [];
    const mathData = [];
    
    for (let x = xMin; x <= xMax; x += step) {
        labels.push(x.toFixed(2));
        seriesData.push(taylorSin(x, n));
        mathData.push(Math.sin(x));
    }
    
    return { labels, seriesData, mathData, n };
}

// Функция для создания графика
function createChart(animate = false) {
    const { labels, seriesData, mathData, n } = getChartData();
    const ctx = document.getElementById('functionChart').getContext('2d');
    
    // Удаляем предыдущий график, если он существует
    if (functionChart) {
        functionChart.destroy();
    }
    
    // Создаем новый график
    functionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Ряд Тейлора (n=${n})`,
                    data: seriesData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Math.sin(x)',
                    data: mathData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            animation: {
                duration: animate ? 2000 : 0,
                easing: 'easeOutQuart',
                onComplete: function() {
                    isAnimating = false;
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Сравнение разложения sin(x) в ряд Тейлора и вычисления через Math.sin',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'x'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'f(x)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Функция для анимированного построения графика слева направо
function animateChartProgressive() {
    if (isAnimating) return;
    
    isAnimating = true;
    const { labels, seriesData, mathData, n } = getChartData();
    const ctx = document.getElementById('functionChart').getContext('2d');
    
    // Удаляем предыдущий график, если он существует
    if (functionChart) {
        functionChart.destroy();
    }
    
    // Создаем пустые массивы для постепенного заполнения
    const progressiveSeriesData = new Array(seriesData.length).fill(null);
    const progressiveMathData = new Array(mathData.length).fill(null);
    
    // Создаем новый график с пустыми данными
    functionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Ряд Тейлора (n=${n})`,
                    data: progressiveSeriesData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false,
                    segment: {
                        borderColor: ctx => {
                            // Пропускаем точки с null значениями
                            if (ctx.p0.parsed.y === null || ctx.p1.parsed.y === null) {
                                return 'transparent';
                            }
                            return 'rgb(255, 99, 132)';
                        }
                    }
                },
                {
                    label: 'Math.sin(x)',
                    data: progressiveMathData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false,
                    segment: {
                        borderColor: ctx => {
                            // Пропускаем точки с null значениями
                            if (ctx.p0.parsed.y === null || ctx.p1.parsed.y === null) {
                                return 'transparent';
                            }
                            return 'rgb(54, 162, 235)';
                        }
                    }
                }
            ]
        },
        options: {
            responsive: true,
            animation: {
                duration: 0 // Отключаем стандартную анимацию
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Сравнение разложения sin(x) в ряд Тейлора и вычисления через Math.sin',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'x'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'f(x)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
    
    // Анимируем построение графика слева направо
    let currentIndex = 0;
    const totalPoints = labels.length;
    const animationSpeed = 2000 / totalPoints; // Общая длительность анимации 2 секунды
    
    function addPoint() {
        if (currentIndex < totalPoints) {
            progressiveSeriesData[currentIndex] = seriesData[currentIndex];
            progressiveMathData[currentIndex] = mathData[currentIndex];
            
            functionChart.update('none');
            
            currentIndex++;
            setTimeout(addPoint, animationSpeed);
        } else {
            isAnimating = false;
        }
    }
    
    addPoint();
}

// Функция для сохранения графика
function saveChart() {
    if (functionChart) {
        const link = document.createElement('a');
        link.download = 'sin-function-chart.png';
        link.href = functionChart.toBase64Image();
        link.click();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Создаем первоначальный график
    createChart(false);
    
    // Добавляем обработчики событий
    document.getElementById('updateChart').addEventListener('click', function() {
        const shouldAnimate = document.getElementById('animationCheck').checked;
        createChart(shouldAnimate);
    });
    
    document.getElementById('animateChart').addEventListener('click', function() {
        animateChartProgressive();
    });
    
    document.getElementById('saveChart').addEventListener('click', saveChart);
    
    // Обновляем график при изменении параметров
    document.getElementById('nValue').addEventListener('change', function() {
        const shouldAnimate = document.getElementById('animationCheck').checked;
        createChart(shouldAnimate);
    });
    
    document.getElementById('xMin').addEventListener('change', function() {
        const shouldAnimate = document.getElementById('animationCheck').checked;
        createChart(shouldAnimate);
    });
    
    document.getElementById('xMax').addEventListener('change', function() {
        const shouldAnimate = document.getElementById('animationCheck').checked;
        createChart(shouldAnimate);
    });
    
    document.getElementById('step').addEventListener('change', function() {
        const shouldAnimate = document.getElementById('animationCheck').checked;
        createChart(shouldAnimate);
    });
    
    // Автоматическая анимация при загрузке
    setTimeout(() => {
        if (document.getElementById('animationCheck').checked) {
            animateChartProgressive();
        }
    }, 1000);
});