// Manual Entry Logic
document.addEventListener('DOMContentLoaded', async () => {
    await waitForPB();

    if (!API.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    accessibility.setPageTitle('Manual Time Entry - Time Tracking System');

    // Setup logout
    setupLogout();

    // Setup form
    setupForm();

    // Set default date to today
    document.getElementById('entry-date').valueAsDate = new Date();
});

function setupForm() {
    const form = document.getElementById('manual-entry-form');
    const startTime = document.getElementById('start-time');
    const endTime = document.getElementById('end-time');
    const breakDuration = document.getElementById('break-duration');
    const calculatedHours = document.getElementById('calculated-hours');

    // Calculate hours when times change
    function calculateHours() {
        const start = startTime.value;
        const end = endTime.value;
        const breakMin = parseInt(breakDuration.value) || 0;

        if (start && end) {
            // Create date objects for today with the selected times
            const startDate = new Date(`2000-01-01T${start}`);
            const endDate = new Date(`2000-01-01T${end}`);

            // Handle overnight shifts
            if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }

            const diffMs = endDate - startDate;
            const diffHours = diffMs / (1000 * 60 * 60);
            const breakHours = breakMin / 60;
            const totalHours = Math.max(0, diffHours - breakHours);

            calculatedHours.textContent = totalHours.toFixed(2);
            
            // Validate
            if (totalHours < 0) {
                accessibility.announceFormError('end-time', 'End time must be after start time');
            } else {
                accessibility.clearFormError('end-time');
            }
        }
    }

    startTime.addEventListener('change', calculateHours);
    endTime.addEventListener('change', calculateHours);
    breakDuration.addEventListener('input', calculateHours);

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const date = formData.get('date');
        const start = formData.get('startTime');
        const end = formData.get('endTime');
        const breakMin = parseInt(formData.get('breakDuration')) || 0;
        const category = formData.get('category');
        const notes = formData.get('notes');

        // Create datetime strings
        const clockIn = `${date}T${start}:00`;
        const clockOut = `${date}T${end}:00`;

        // Calculate total hours
        const startDate = new Date(clockIn);
        let endDate = new Date(clockOut);
        
        if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }

        const diffMs = endDate - startDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        const breakHours = breakMin / 60;
        const totalHours = diffHours - breakHours;

        // Validate
        if (totalHours <= 0) {
            accessibility.announceFormError('end-time', 'End time must be after start time');
            return;
        }

        // Clear errors
        accessibility.clearFormError('entry-date');
        accessibility.clearFormError('start-time');
        accessibility.clearFormError('end-time');

        // Submit
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        accessibility.announce('Submitting time entry');

        const result = await API.createTimeEntry({
            clock_in: clockIn,
            clock_out: clockOut,
            status: 'pending_approval',
            total_hours: totalHours,
            category: category || null,
            notes: notes || null
        });

        const formMessage = document.getElementById('form-message');

        if (result.success) {
            formMessage.textContent = `Time entry submitted successfully! Total hours: ${totalHours.toFixed(2)}. Entry is pending manager approval.`;
            formMessage.className = 'form-message success';
            accessibility.announce('Time entry submitted successfully', 'assertive');
            
            form.reset();
            calculatedHours.textContent = '0.00';
            document.getElementById('entry-date').valueAsDate = new Date();
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Time Entry';
        } else {
            formMessage.textContent = 'Failed to submit time entry: ' + result.error;
            formMessage.className = 'form-message error';
            accessibility.announce('Failed to submit time entry', 'assertive');
            
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Time Entry';
        }
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            API.logout();
        });
    }
}


