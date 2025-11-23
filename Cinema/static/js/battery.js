(function() {
    function updateBatteryStatus(battery) {
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        
        let icon = '🔋';
        if (charging) icon = '⚡';
        if (level <= 20) icon = '🪫';
        
        document.getElementById('battery-level').textContent = `${level}%`;
        document.getElementById('battery-icon').textContent = icon;
    }

    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            updateBatteryStatus(battery);
            
            battery.addEventListener('levelchange', function() {
                updateBatteryStatus(battery);
            });
            
            battery.addEventListener('chargingchange', function() {
                updateBatteryStatus(battery);
            });
        });
    } else {
        document.getElementById('battery-status').style.display = 'none';
    }
})();