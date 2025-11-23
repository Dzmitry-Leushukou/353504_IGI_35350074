function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function taylorSin(x, n) {
    let sum = 0;
    for (let i = 0; i <= n; i++) {
        const term = Math.pow(-1, i) * Math.pow(x, 2 * i + 1) / factorial(2 * i + 1);
        sum += term;
    }
    return sum;
}

let functionChart = null;
let isAnimating = false;

function getChartData() {
    const n = parseInt(document.getElementById('nValue').value) || 5;
    const xMin = parseFloat(document.getElementById('xMin').value) || -10;
    const xMax = parseFloat(document.getElementById('xMax').value) || 10;
    const step = parseFloat(document.getElementById('step').value) || 0.1;
    
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

function createChart(animate = false) {
    const { labels, seriesData, mathData, n } = getChartData();
    const ctx = document.getElementById('functionChart').getContext('2d');
    
    if (functionChart) {
        functionChart.destroy();
    }
    
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
            maintainAspectRatio: false,
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

function animateChartProgressive() {
    if (isAnimating) return;
    
    isAnimating = true;
    const { labels, seriesData, mathData, n } = getChartData();
    const ctx = document.getElementById('functionChart').getContext('2d');
    
    if (functionChart) {
        functionChart.destroy();
    }
    
    const progressiveSeriesData = new Array(seriesData.length).fill(null);
    const progressiveMathData = new Array(mathData.length).fill(null);
    
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
            maintainAspectRatio: false,
            animation: {
                duration: 0
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
    
    let currentIndex = 0;
    const totalPoints = labels.length;
    const animationSpeed = Math.min(2000 / totalPoints, 50);
    
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

function saveChart() {
    if (functionChart) {
        const link = document.createElement('a');
        link.download = 'sin-function-chart.png';
        link.href = functionChart.toBase64Image();
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    createChart(false);
    
    document.getElementById('updateChart').addEventListener('click', function() {
        const shouldAnimate = document.getElementById('animationCheck').checked;
        createChart(shouldAnimate);
    });
    
    document.getElementById('animateChart').addEventListener('click', function() {
        animateChartProgressive();
    });
    
    document.getElementById('saveChart').addEventListener('click', saveChart);
    
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
    
    setTimeout(() => {
        if (document.getElementById('animationCheck').checked) {
            animateChartProgressive();
        }
    }, 1000);
});