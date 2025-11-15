// Time Off Management Logic
document.addEventListener('DOMContentLoaded', async () => {
    await waitForPB();

    if (!API.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    accessibility.setPageTitle('Time Off Management - Time Tracking System');

    // Setup logout
    setupLogout();

    // Load balances
    await loadBalances();

    // Setup form
    setupForm();

    // Load request history
    await loadRequestHistory();
});

async function loadBalances() {
    const result = await API.getUserProfile();
    
    if (result.success && result.data) {
        document.getElementById('pto-balance').textContent = result.data.pto_balance.toFixed(1);
        document.getElementById('sick-balance').textContent = result.data.sick_balance.toFixed(1);
    }
}

function setupForm() {
    const form = document.getElementById('time-off-form');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    const calculatedDays = document.getElementById('calculated-days');

    // Calculate days when dates change
    function calculateDays() {
        const start = startDate.value;
        const end = endDate.value;

        if (start && end) {
            const startDateObj = new Date(start);
            const endDateObj = new Date(end);

            if (endDateObj < startDateObj) {
                accessibility.announceFormError('end-date', 'End date must be after start date');
                calculatedDays.textContent = '0';
                return;
            }

            accessibility.clearFormError('end-date');

            const diffTime = Math.abs(endDateObj - startDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates

            calculatedDays.textContent = diffDays;
        }
    }

    startDate.addEventListener('change', calculateDays);
    endDate.addEventListener('change', calculateDays);

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    startDate.setAttribute('min', today);
    endDate.setAttribute('min', today);

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const type = formData.get('type');
        const start = formData.get('startDate');
        const end = formData.get('endDate');
        const reason = formData.get('reason');

        // Validate
        if (!type) {
            accessibility.announceFormError('request-type', 'Please select a type of time off');
            return;
        }

        if (!start || !end) {
            accessibility.announce('Please select start and end dates', 'assertive');
            return;
        }

        const startDateObj = new Date(start);
        const endDateObj = new Date(end);

        if (endDateObj < startDateObj) {
            accessibility.announceFormError('end-date', 'End date must be after start date');
            return;
        }

        // Clear errors
        accessibility.clearFormError('request-type');
        accessibility.clearFormError('start-date');
        accessibility.clearFormError('end-date');

        // Submit
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        accessibility.announce('Submitting time off request');

        const result = await API.createTimeOffRequest({
            type,
            start_date: start,
            end_date: end,
            reason: reason || null
        });

        const formMessage = document.getElementById('form-message');

        if (result.success) {
            const days = parseInt(calculatedDays.textContent);
            formMessage.textContent = `Time off request for ${days} day(s) submitted successfully! Your request is pending manager approval.`;
            formMessage.className = 'form-message success';
            accessibility.announce('Time off request submitted successfully', 'assertive');
            
            form.reset();
            calculatedDays.textContent = '0';
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';

            await loadRequestHistory();
        } else {
            formMessage.textContent = 'Failed to submit time off request: ' + result.error;
            formMessage.className = 'form-message error';
            accessibility.announce('Failed to submit time off request', 'assertive');
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    });
}

async function loadRequestHistory() {
    const result = await API.getTimeOffRequests();
    const tbody = document.getElementById('request-history');

    if (result.success && result.data.length > 0) {
        tbody.innerHTML = result.data.map(request => {
            const startDate = new Date(request.start_date);
            const endDate = new Date(request.end_date);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            const created = new Date(request.created);

            return `
                <tr>
                    <td>${request.type.toUpperCase()}</td>
                    <td>${startDate.toLocaleDateString()}</td>
                    <td>${endDate.toLocaleDateString()}</td>
                    <td>${diffDays}</td>
                    <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                    <td>${created.toLocaleDateString()}</td>
                </tr>
            `;
        }).join('');

        accessibility.announce(`Loaded ${result.data.length} time off requests`);
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No time off requests found</td></tr>';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            API.logout();
        });
    }
}


