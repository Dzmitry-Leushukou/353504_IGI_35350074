(function() {
    function getCachedLocation() {
        try {
            const cached = localStorage.getItem('cachedGeolocation');
            if (cached) {
                const { location, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < 3600000) {
                    return location;
                }
            }
        } catch (e) {
            console.error('Ошибка чтения кэша геолокации:', e);
        }
        return null;
    }

    function cacheLocation(location) {
        try {
            const data = {
                location: location,
                timestamp: Date.now()
            };
            localStorage.setItem('cachedGeolocation', JSON.stringify(data));
        } catch (e) {
            console.error('Ошибка сохранения геолокации:', e);
        }
    }

    function updateGeolocationStatus(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`)
            .then(response => response.json())
            .then(data => {
                let locationName = 'Неизвестно';
                
                if (data.address) {
                    if (data.address.city) {
                        locationName = data.address.city;
                    } else if (data.address.town) {
                        locationName = data.address.town;
                    } else if (data.address.village) {
                        locationName = data.address.village;
                    } else if (data.address.municipality) {
                        locationName = data.address.municipality;
                    } else if (data.address.state) {
                        locationName = data.address.state;
                    } else if (data.address.country) {
                        locationName = data.address.country;
                    }
                }
                
                cacheLocation(locationName);
                
                document.getElementById('geolocation-icon').textContent = '📍';
                document.getElementById('geolocation-text').textContent = locationName;
            })
            .catch(error => {
                console.error('Ошибка геокодирования:', error);
                document.getElementById('geolocation-icon').textContent = '📍';
                document.getElementById('geolocation-text').textContent = 'Ошибка';
            });
    }

    function handleGeolocationError(error) {
        let errorMessage = 'Не доступно';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Доступ запрещен';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Инфо недоступно';
                break;
            case error.TIMEOUT:
                errorMessage = 'Таймаут';
                break;
        }
        
        document.getElementById('geolocation-icon').textContent = '📍';
        document.getElementById('geolocation-text').textContent = errorMessage;
    }

    if ('geolocation' in navigator) {
        document.getElementById('geolocation-status').style.display = 'block';
        
        const cachedLocation = getCachedLocation();
        if (cachedLocation) {
            document.getElementById('geolocation-icon').textContent = '📍';
            document.getElementById('geolocation-text').textContent = cachedLocation;
        } else {
            navigator.geolocation.getCurrentPosition(
                updateGeolocationStatus,
                handleGeolocationError,
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 3600000
                }
            );
        }
    } else {
        document.getElementById('geolocation-status').style.display = 'none';
    }

    document.addEventListener('DOMContentLoaded', function() {
        const refreshBtn = document.getElementById('refresh-location');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                localStorage.removeItem('cachedGeolocation');
                document.getElementById('geolocation-text').textContent = 'Обновление...';
                
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        updateGeolocationStatus,
                        handleGeolocationError,
                        {
                            enableHighAccuracy: false,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                }
            });
        }
    });
})();