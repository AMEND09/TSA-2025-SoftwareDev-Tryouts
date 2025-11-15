// Authentication Handler
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for PocketBase to initialize
    await waitForPB();

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Login Form
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('login-btn');
            const formError = document.getElementById('form-error');

            // Clear previous errors
            accessibility.clearFormError('email');
            accessibility.clearFormError('password');
            formError.textContent = '';

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            accessibility.announce('Logging in, please wait');

            const result = await API.login(email, password);

            if (result.success) {
                accessibility.announce('Login successful. Redirecting to dashboard');
                formError.textContent = '';
                formError.className = 'form-message success';
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                accessibility.announceFormError('form', result.error || 'Login failed. Please check your credentials.');
                formError.textContent = result.error || 'Login failed. Please check your credentials.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    // Register Form
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('password-confirm').value;
            const submitBtn = document.getElementById('register-btn');
            const formError = document.getElementById('form-error');

            // Clear previous errors
            accessibility.clearFormError('name');
            accessibility.clearFormError('email');
            accessibility.clearFormError('password');
            accessibility.clearFormError('password-confirm');
            formError.textContent = '';

            // Validate password match
            if (password !== passwordConfirm) {
                accessibility.announceFormError('password-confirm', 'Passwords do not match');
                return;
            }

            // Validate password length
            if (password.length < 8) {
                accessibility.announceFormError('password', 'Password must be at least 8 characters');
                return;
            }

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            accessibility.announce('Creating account, please wait');

            const result = await API.register(email, password, passwordConfirm, name);

            if (result.success) {
                accessibility.announce('Account created successfully. Please log in.');
                formError.textContent = 'Account created successfully! Redirecting to login...';
                formError.className = 'form-message success';
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                accessibility.announceFormError('form', result.error || 'Registration failed');
                formError.textContent = result.error || 'Registration failed. Please try again.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        });
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            accessibility.announce('Logging out');
            API.logout();
        });
    }

    // Check authentication on protected pages
    const path = window.location.pathname.toLowerCase();
    if (!path.includes('login') && !path.includes('register') && !path.includes('index.html') && path !== '/') {
        if (!API.isAuthenticated()) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = 'login.html';
        }
    }
});
