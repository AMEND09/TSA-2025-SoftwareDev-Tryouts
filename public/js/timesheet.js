// Timesheet Logic
let lastEditTrigger = null;

document.addEventListener('DOMContentLoaded', async () => {
    await waitForPB();

    if (!API.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    accessibility.setPageTitle('Timesheet - Time Tracking System');

    // Setup logout
    setupLogout();

    // Setup filters
    setupFilters();

    // Load timesheet data
    await loadTimesheet();
});

function setupFilters() {
    const periodFilter = document.getElementById('period-filter');
    const dateRangeGroup = document.getElementById('date-range-group');
    const applyFilterBtn = document.getElementById('apply-filter-btn');

    periodFilter.addEventListener('change', () => {
        if (periodFilter.value === 'custom') {
            dateRangeGroup.removeAttribute('hidden');
            accessibility.announce('Custom date range fields shown');
        } else {
            dateRangeGroup.setAttribute('hidden', '');
        }
    });

    applyFilterBtn.addEventListener('click', loadTimesheet);
}

async function loadTimesheet() {
    const periodFilter = document.getElementById('period-filter').value;
    let filter = '';

    if (periodFilter === 'current') {
        // Current pay period (last 14 days)
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        filter = `&& created >= "${twoWeeksAgo.toISOString()}"`;
    } else if (periodFilter === 'last') {
        // Last pay period (14-28 days ago)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        filter = `&& created >= "${fourWeeksAgo.toISOString()}" && created <= "${twoWeeksAgo.toISOString()}"`;
    } else if (periodFilter === 'custom') {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        if (startDate && endDate) {
            filter = `&& created >= "${startDate}" && created <= "${endDate}"`;
        }
    }

    accessibility.announceLoading(document.querySelector('.timesheet-section'), true);

    const result = await API.getTimeEntries(filter);
    const tbody = document.getElementById('timesheet-entries');

    if (!result.success) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data">${result.error || 'Unable to load time entries'}</td></tr>`;
        document.getElementById('period-total-hours').textContent = '0.0';
        document.getElementById('period-regular-hours').textContent = '0.0';
        document.getElementById('period-overtime-hours').textContent = '0.0';
        document.getElementById('period-break-hours').textContent = '0.0';

        if (result.status === 403 || result.status === 404) {
            showTimesheetSetupWarning();
        } else if (result.status === 0) {
            showTimesheetNetworkError();
        }

        accessibility.announce('Unable to load time entries', 'assertive');
        accessibility.announceLoading(document.querySelector('.timesheet-section'), false);
        return;
    }

    if (result.data.length > 0) {
        // Calculate period summary
        let totalHours = 0;
        let regularHours = 0;
        let overtimeHours = 0;
        let breakHours = 0;

        result.data.forEach(entry => {
            if (entry.total_hours) {
                totalHours += entry.total_hours;
                if (entry.total_hours <= 8) {
                    regularHours += entry.total_hours;
                } else {
                    regularHours += 8;
                    overtimeHours += (entry.total_hours - 8);
                }
            }
            if (entry.break_start && entry.break_end) {
                const breakMs = new Date(entry.break_end) - new Date(entry.break_start);
                breakHours += breakMs / (1000 * 60 * 60);
            }
        });

        // Update summary
        document.getElementById('period-total-hours').textContent = totalHours.toFixed(1);
        document.getElementById('period-regular-hours').textContent = regularHours.toFixed(1);
        document.getElementById('period-overtime-hours').textContent = overtimeHours.toFixed(1);
        document.getElementById('period-break-hours').textContent = breakHours.toFixed(1);

        // Populate table
        tbody.innerHTML = result.data.map(entry => {
            const clockIn = new Date(entry.clock_in);
            const clockOut = entry.clock_out ? new Date(entry.clock_out) : null;
            
            let breakTime = '--';
            if (entry.break_start && entry.break_end) {
                const breakMs = new Date(entry.break_end) - new Date(entry.break_start);
                const breakMinutes = Math.floor(breakMs / 60000);
                breakTime = `${breakMinutes} min`;
            }
            
            return `
                <tr>
                    <td>${clockIn.toLocaleDateString()}</td>
                    <td>${clockIn.toLocaleTimeString()}</td>
                    <td>${clockOut ? clockOut.toLocaleTimeString() : 'In Progress'}</td>
                    <td>${breakTime}</td>
                    <td>${entry.total_hours ? entry.total_hours.toFixed(2) : '--'}</td>
                    <td>${entry.category || '--'}</td>
                    <td><span class="status-badge status-${entry.status}">${entry.status.replace('_', ' ')}</span></td>
                    <td>
                        ${entry.status === 'completed' ? 
                            `<button class="btn btn-secondary" onclick="requestEdit('${entry.id}')" aria-label="Request correction for entry on ${clockIn.toLocaleDateString()}">
                                Edit Request
                            </button>` : 
                            '--'
                        }
                    </td>
                </tr>
            `;
        }).join('');

        accessibility.announce(`Loaded ${result.data.length} time entries`);
    } else {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No time entries found for this period</td></tr>';
        
        // Reset summary
        document.getElementById('period-total-hours').textContent = '0.0';
        document.getElementById('period-regular-hours').textContent = '0.0';
        document.getElementById('period-overtime-hours').textContent = '0.0';
        document.getElementById('period-break-hours').textContent = '0.0';

        accessibility.announce('No time entries found for selected period');
    }

    accessibility.announceLoading(document.querySelector('.timesheet-section'), false);
}

function requestEdit(entryId) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-request-form');
    const reasonField = document.getElementById('edit-reason');

    // Get entry data
    document.getElementById('edit-entry-id').value = entryId;
    lastEditTrigger = document.activeElement;

    // Show modal
    modal.removeAttribute('hidden');
    modal.focus();
    if (reasonField) {
        setTimeout(() => reasonField.focus(), 50);
    }
    
    // Trap focus in modal
    accessibility.trapFocus(modal);
    
    accessibility.announce('Edit request form opened');
}

// Setup modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-request-form');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const entryId = document.getElementById('edit-entry-id').value;
            const reason = document.getElementById('edit-reason').value;
            const clockIn = document.getElementById('edit-clock-in').value;
            const clockOut = document.getElementById('edit-clock-out').value;

            const requestedChanges = {};
            if (clockIn) requestedChanges.clock_in = clockIn;
            if (clockOut) requestedChanges.clock_out = clockOut;

            const result = await API.createEditRequest(entryId, reason, requestedChanges);

            if (result.success) {
                accessibility.announce('Edit request submitted successfully', 'assertive');
                alert('Edit request submitted successfully and is pending manager approval.');
                closeEditModal('submitted');
                await loadTimesheet();
            } else {
                if (result.status === 403 || result.status === 404) {
                    showTimesheetSetupWarning();
                } else if (result.status === 0) {
                    showTimesheetNetworkError();
                }
                accessibility.announce('Failed to submit edit request', 'assertive');
                alert('Failed to submit edit request: ' + result.error);
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeEditModal('cancelled');
        });
    }

    // Handle escape key
    if (modal) {
        modal.addEventListener('escape-pressed', () => {
            closeEditModal('dismissed');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal('dismissed');
            }
        });
    }
});

// Make requestEdit globally available
window.requestEdit = requestEdit;

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            API.logout();
        });
    }
}

function closeEditModal(reason = 'closed') {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-request-form');
    if (!modal || modal.hasAttribute('hidden')) return;

    modal.setAttribute('hidden', '');
    if (form) {
        form.reset();
    }

    const announcementMap = {
        submitted: 'Edit request submitted and modal closed',
        cancelled: 'Edit request cancelled. Returning to dashboard.',
        dismissed: 'Edit request dismissed',
        closed: 'Edit request modal closed'
    };
    accessibility.announce(announcementMap[reason] || announcementMap.closed);

    if (reason === 'cancelled') {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 100);
        return;
    }

    if (lastEditTrigger && typeof lastEditTrigger.focus === 'function') {
        lastEditTrigger.focus();
    }
}

function showTimesheetSetupWarning() {
    if (document.getElementById('timesheet-setup-warning')) return;

    const warning = document.createElement('div');
    warning.id = 'timesheet-setup-warning';
    warning.className = 'alert alert-warning';
    warning.setAttribute('role', 'alert');
    warning.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1200; max-width: 420px; padding: 18px; background: #fffbea; border: 2px solid #facc15; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);';
    warning.innerHTML = `
        <strong style="color: #92400e; font-size: 1rem;">PocketBase setup required</strong>
        <p style="color: #854d0e; margin: 0.5rem 0 1rem;">Time entry corrections rely on the <code>edit_requests</code> collection. Please follow POCKETBASE_SETUP.md to configure collection rules.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="setup-check.html" class="btn btn-primary" style="background:#2563eb; color:#fff; padding:0.5rem 1rem; border-radius:6px; text-decoration:none;">Open Setup Checker</a>
            <button class="btn btn-secondary" style="padding:0.5rem 1rem; border-radius:6px; border:none; background:#92400e; color:#fff;" onclick="this.closest('#timesheet-setup-warning').remove()">Dismiss</button>
        </div>
    `;
    document.body.appendChild(warning);
    accessibility.announce('PocketBase setup required for edit requests', 'assertive');
}

function showTimesheetNetworkError() {
    if (document.getElementById('timesheet-network-error')) return;

    const warning = document.createElement('div');
    warning.id = 'timesheet-network-error';
    warning.className = 'alert alert-error';
    warning.setAttribute('role', 'alert');
    warning.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 1200; max-width: 420px; padding: 18px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);';
    warning.innerHTML = `
        <strong style="color: #991b1b; font-size: 1rem;">Network error</strong>
        <p style="color: #991b1b; margin: 0.5rem 0 1rem;">We couldn't reach the server. Please verify your internet connection or try again.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" style="background:#ef4444; color:#fff; padding:0.5rem 1rem; border-radius:6px; border:none;" onclick="window.location.reload()">Reload</button>
            <button class="btn btn-secondary" style="padding:0.5rem 1rem; border-radius:6px; border:none; background:#991b1b; color:#fff;" onclick="this.closest('#timesheet-network-error').remove()">Dismiss</button>
        </div>
    `;
    document.body.appendChild(warning);
    accessibility.announce('Network error while communicating with PocketBase', 'assertive');
}


