// Dashboard Logic
let activeEntry = null;
let timerInterval = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    await waitForPB();

    // Check authentication
    if (!API.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Set page title
    accessibility.setPageTitle('Dashboard - Time Tracking System');

    // Load user profile
    await loadUserProfile();

    // Load active time entry
    await loadActiveEntry();

    // Load today's summary
    await loadTodaySummary();

    // Load recent entries
    await loadRecentEntries();

    // Setup event listeners
    setupEventListeners();

    // Setup logout
    setupLogout();

    // Check for notifications
    checkNotifications();

    // Start checking for missed clock-out
    setInterval(checkMissedClockOut, 60000); // Check every minute
});

async function loadUserProfile() {
    const result = await API.getUserProfile();
    if (result.success && result.data) {
        userProfile = result.data;
        document.getElementById('pto-balance').textContent = userProfile.pto_balance.toFixed(1);
    } else {
        console.warn('User profile not available:', result.error);
        // Set default values
        document.getElementById('pto-balance').textContent = '0';
        
        // Only show setup warning if it's a 403/404 error (not network error)
        if (result.status === 403 || result.status === 404) {
            showSetupWarning();
        } else if (result.status === 0) {
            showNetworkError();
        }
    }
}

function showSetupWarning() {
    // Only show one warning at a time
    if (document.getElementById('setup-warning')) return;
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'setup-warning';
    warningDiv.className = 'alert alert-warning';
    warningDiv.setAttribute('role', 'alert');
    warningDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 450px; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    warningDiv.innerHTML = `
        <h3 style="margin-top: 0; color: #856404;">⚠️ Setup Required</h3>
        <p style="color: #856404; margin-bottom: 10px;">PocketBase collections need to be configured.</p>
        <p style="color: #856404; margin-bottom: 15px;">Please see <strong>POCKETBASE_SETUP.md</strong> for detailed instructions.</p>
        <div style="display: flex; gap: 10px;">
            <a href="setup-check.html" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; text-decoration: none; font-weight: 500;">Setup Guide</a>
            <button onclick="this.closest('#setup-warning').remove()" style="padding: 8px 16px; background: #856404; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Dismiss</button>
        </div>
    `;
    document.body.appendChild(warningDiv);
    accessibility.announce('Setup required: PocketBase collections need to be configured. Please see setup guide.', 'assertive');
    
    setTimeout(() => {
        if (warningDiv.parentElement) {
            warningDiv.remove();
        }
    }, 20000);
}

function showNetworkError() {
    // Only show one error at a time
    if (document.getElementById('network-error')) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.id = 'network-error';
    errorDiv.className = 'alert alert-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 450px; padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    errorDiv.innerHTML = `
        <h3 style="margin-top: 0; color: #991b1b;">🔌 Network Error</h3>
        <p style="color: #991b1b; margin-bottom: 10px;">Unable to connect to the server. Please check:</p>
        <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px;">
            <li>Your internet connection</li>
            <li>The PocketBase server is online</li>
            <li>The server URL is correct</li>
        </ul>
        <button onclick="window.location.reload()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; margin-right: 10px;">Retry</button>
        <button onclick="this.closest('#network-error').remove()" style="padding: 8px 16px; background: #991b1b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Dismiss</button>
    `;
    document.body.appendChild(errorDiv);
    accessibility.announce('Network error: Unable to connect to server. Please check your connection.', 'assertive');
}

async function loadActiveEntry() {
    const result = await API.getActiveTimeEntry();
    if (result.success && result.data) {
        activeEntry = result.data;
        updateUIForActiveEntry();
        startTimer();
    } else {
        updateUIForInactive();
    }
}

function setupEventListeners() {
    const clockInBtn = document.getElementById('clock-in-btn');
    const clockOutBtn = document.getElementById('clock-out-btn');
    const breakStartBtn = document.getElementById('break-start-btn');
    const breakEndBtn = document.getElementById('break-end-btn');

    clockInBtn.addEventListener('click', handleClockIn);
    clockOutBtn.addEventListener('click', handleClockOut);
    breakStartBtn.addEventListener('click', handleBreakStart);
    breakEndBtn.addEventListener('click', handleBreakEnd);
}

async function handleClockIn() {
    const now = new Date().toISOString();
    const result = await API.createTimeEntry({
        clock_in: now,
        status: 'active'
    });

    if (result.success) {
        activeEntry = result.data;
        updateUIForActiveEntry();
        startTimer();
        accessibility.announce('Clocked in successfully. Your work day has started.', 'assertive');
        await loadTodaySummary();
    } else {
        accessibility.announce('Failed to clock in. Please try again.', 'assertive');
        alert('Failed to clock in: ' + result.error);
    }
}

async function handleClockOut() {
    if (!activeEntry) return;

    const now = new Date().toISOString();
    const clockIn = new Date(activeEntry.clock_in);
    const clockOut = new Date(now);
    
    // Calculate total hours
    let totalMs = clockOut - clockIn;
    
    // Subtract break time if exists
    if (activeEntry.break_start && activeEntry.break_end) {
        const breakStart = new Date(activeEntry.break_start);
        const breakEnd = new Date(activeEntry.break_end);
        totalMs -= (breakEnd - breakStart);
    }
    
    const totalHours = totalMs / (1000 * 60 * 60);

    const result = await API.updateTimeEntry(activeEntry.id, {
        clock_out: now,
        status: 'completed',
        total_hours: totalHours
    });

    if (result.success) {
        stopTimer();
        activeEntry = null;
        updateUIForInactive();
        accessibility.announce(`Clocked out successfully. Total hours worked: ${totalHours.toFixed(2)} hours.`, 'assertive');
        await loadTodaySummary();
        await loadRecentEntries();
        
        // Check for overtime
        if (totalHours > (userProfile?.overtime_threshold || 8)) {
            addNotification(`You worked ${totalHours.toFixed(2)} hours today, which exceeds the overtime threshold.`, 'warning');
        }
    } else {
        accessibility.announce('Failed to clock out. Please try again.', 'assertive');
        alert('Failed to clock out: ' + result.error);
    }
}

async function handleBreakStart() {
    if (!activeEntry || activeEntry.status !== 'active') return;

    const now = new Date().toISOString();
    const result = await API.updateTimeEntry(activeEntry.id, {
        break_start: now,
        status: 'on_break'
    });

    if (result.success) {
        activeEntry = result.data;
        updateUIForBreak();
        accessibility.announce('Break started. Timer paused.', 'assertive');
    }
}

async function handleBreakEnd() {
    if (!activeEntry || activeEntry.status !== 'on_break') return;

    const now = new Date().toISOString();
    const result = await API.updateTimeEntry(activeEntry.id, {
        break_end: now,
        status: 'active'
    });

    if (result.success) {
        activeEntry = result.data;
        updateUIForActiveEntry();
        accessibility.announce('Break ended. Timer resumed.', 'assertive');
    }
}

function updateUIForActiveEntry() {
    document.getElementById('status-text').textContent = 'Clocked In - Working';
    document.getElementById('clock-in-btn').disabled = true;
    document.getElementById('clock-out-btn').disabled = false;
    document.getElementById('break-start-btn').disabled = false;
    document.getElementById('break-end-btn').disabled = true;
}

function updateUIForBreak() {
    document.getElementById('status-text').textContent = 'On Break';
    document.getElementById('clock-in-btn').disabled = true;
    document.getElementById('clock-out-btn').disabled = false;
    document.getElementById('break-start-btn').disabled = true;
    document.getElementById('break-end-btn').disabled = false;
}

function updateUIForInactive() {
    document.getElementById('status-text').textContent = 'Not Clocked In';
    document.getElementById('timer').textContent = '--:--:--';
    document.getElementById('clock-in-btn').disabled = false;
    document.getElementById('clock-out-btn').disabled = true;
    document.getElementById('break-start-btn').disabled = true;
    document.getElementById('break-end-btn').disabled = true;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    let lastAnnouncedMinute = -1;
    
    timerInterval = setInterval(() => {
        if (activeEntry && activeEntry.status === 'active') {
            const elapsed = Date.now() - new Date(activeEntry.clock_in).getTime();
            
            // Subtract break time if on break or break ended
            let breakTime = 0;
            if (activeEntry.break_start) {
                const breakStart = new Date(activeEntry.break_start).getTime();
                const breakEnd = activeEntry.break_end ? new Date(activeEntry.break_end).getTime() : null;
                
                if (breakEnd) {
                    breakTime = breakEnd - breakStart;
                } else if (activeEntry.status === 'on_break') {
                    // Currently on break, don't count it
                    return;
                }
            }
            
            const workTime = elapsed - breakTime;
            const hours = Math.floor(workTime / 3600000);
            const minutes = Math.floor((workTime % 3600000) / 60000);
            const seconds = Math.floor((workTime % 60000) / 1000);
            
            const timeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            document.getElementById('timer').textContent = timeDisplay;
            
            // Announce every 30 minutes for screen reader users
            if (minutes % 30 === 0 && minutes !== lastAnnouncedMinute && seconds === 0) {
                lastAnnouncedMinute = minutes;
                const hourText = hours === 1 ? 'hour' : 'hours';
                const minuteText = minutes === 1 ? 'minute' : 'minutes';
                if (hours > 0) {
                    accessibility.announce(`You have been working for ${hours} ${hourText} and ${minutes} ${minuteText}`, 'polite');
                } else if (minutes > 0) {
                    accessibility.announce(`You have been working for ${minutes} ${minuteText}`, 'polite');
                }
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

async function loadTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const result = await API.getTimeEntries(`&& created >= "${todayISO}"`);
    
    if (result.success) {
        let totalHours = 0;
        let breakHours = 0;

        result.data.forEach(entry => {
            if (entry.total_hours) {
                totalHours += entry.total_hours;
            }
            if (entry.break_start && entry.break_end) {
                const breakMs = new Date(entry.break_end) - new Date(entry.break_start);
                breakHours += breakMs / (1000 * 60 * 60);
            }
        });

        document.getElementById('total-hours-today').textContent = totalHours.toFixed(1);
        document.getElementById('break-time-today').textContent = breakHours.toFixed(1);
    }

    // Load week total
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartISO = weekStart.toISOString();

    const weekResult = await API.getTimeEntries(`&& created >= "${weekStartISO}"`);
    
    if (weekResult.success) {
        let weekTotal = 0;
        weekResult.data.forEach(entry => {
            if (entry.total_hours) {
                weekTotal += entry.total_hours;
            }
        });
        document.getElementById('total-hours-week').textContent = weekTotal.toFixed(1);
    }
}

async function loadRecentEntries() {
    const result = await API.getTimeEntries();
    const tbody = document.getElementById('recent-entries');

    if (result.success && result.data.length > 0) {
        tbody.innerHTML = result.data.slice(0, 5).map(entry => {
            const clockIn = new Date(entry.clock_in);
            const clockOut = entry.clock_out ? new Date(entry.clock_out) : null;
            
            return `
                <tr>
                    <td>${clockIn.toLocaleDateString()}</td>
                    <td>${clockIn.toLocaleTimeString()}</td>
                    <td>${clockOut ? clockOut.toLocaleTimeString() : 'In Progress'}</td>
                    <td>${entry.total_hours ? entry.total_hours.toFixed(2) : '--'}</td>
                    <td><span class="status-badge status-${entry.status}">${entry.status}</span></td>
                </tr>
            `;
        }).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No recent entries</td></tr>';
    }
}

function checkNotifications() {
    // This would check for various notifications
    // For now, just placeholder
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '<p class="no-notifications">No notifications at this time</p>';
}

function addNotification(message, type = 'info') {
    const notificationsList = document.getElementById('notifications-list');
    const noNotifications = notificationsList.querySelector('.no-notifications');
    
    if (noNotifications) {
        notificationsList.innerHTML = '';
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'listitem');
    notification.innerHTML = `
        <p>${message}</p>
        <small>${new Date().toLocaleTimeString()}</small>
    `;
    
    notificationsList.insertBefore(notification, notificationsList.firstChild);
    accessibility.announce(message, 'assertive');
}

function checkMissedClockOut() {
    if (activeEntry && activeEntry.status === 'active') {
        const clockInTime = new Date(activeEntry.clock_in);
        const hoursSinceClockIn = (Date.now() - clockInTime.getTime()) / (1000 * 60 * 60);
        
        // Alert if clocked in for more than 12 hours
        if (hoursSinceClockIn > 12) {
            addNotification('You have been clocked in for over 12 hours. Did you forget to clock out?', 'warning');
        }
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (activeEntry) {
                if (confirm('You are currently clocked in. Are you sure you want to logout?')) {
                    API.logout();
                }
            } else {
                API.logout();
            }
        });
    }
}


