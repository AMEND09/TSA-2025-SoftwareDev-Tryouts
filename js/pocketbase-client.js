// PocketBase Client Configuration
const PB_URL = 'https://tryout-backend.rizzed.mom';

// Initialize PocketBase (will be loaded from CDN)
let pb;
let pbReady = false;
const pbReadyCallbacks = [];

// Initialize PocketBase client
function initPocketBase() {
    return new Promise((resolve) => {
        if (typeof PocketBase === 'undefined') {
            console.log('Loading PocketBase SDK from CDN...');
            
            // Dynamically load PocketBase SDK
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/pocketbase@0.21.3/dist/pocketbase.umd.js';
            script.onload = () => {
                pb = new PocketBase(PB_URL);
                window.pb = pb;
                pbReady = true;
                console.log('PocketBase initialized:', PB_URL);
                
                // Execute any waiting callbacks
                pbReadyCallbacks.forEach(cb => cb());
                pbReadyCallbacks.length = 0;
                
                resolve(pb);
            };
            script.onerror = () => {
                console.error('Failed to load PocketBase SDK');
                resolve(null);
            };
            document.head.appendChild(script);
        } else {
            pb = new PocketBase(PB_URL);
            window.pb = pb;
            pbReady = true;
            console.log('PocketBase initialized:', PB_URL);
            resolve(pb);
        }
    });
}

// Wait for PocketBase to be ready
function waitForPB() {
    return new Promise((resolve) => {
        if (pbReady && pb) {
            resolve(pb);
        } else {
            pbReadyCallbacks.push(() => resolve(pb));
        }
    });
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPocketBase);
} else {
    initPocketBase();
}

// API Helper Functions
const API = {
    // Authentication
    async login(email, password) {
        try {
            await waitForPB();
            const authData = await pb.collection('users').authWithPassword(email, password);
            return { success: true, data: authData };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    async register(email, password, passwordConfirm, name) {
        try {
            await waitForPB();
            const userData = {
                email,
                password,
                passwordConfirm,
                name,
                emailVisibility: true
            };
            
            console.log('Creating user:', { email, name });
            const user = await pb.collection('users').create(userData);
            console.log('User created:', user.id);
            
            // Create user profile with default values
            try {
                await pb.collection('user_profiles').create({
                    user: user.id,
                    pto_balance: 15,
                    sick_balance: 10,
                    role: 'employee',
                    overtime_threshold: 8
                });
                console.log('User profile created');
            } catch (profileError) {
                console.warn('Profile creation failed (may not exist yet):', profileError.message);
            }
            
            return { success: true, data: user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    logout() {
        if (pb) {
            pb.authStore.clear();
        }
        window.location.href = 'login.html';
    },

    isAuthenticated() {
        return pb && pb.authStore.isValid;
    },

    getCurrentUser() {
        return pb ? pb.authStore.model : null;
    },

    // Time Entries
    async createTimeEntry(data) {
        try {
            await waitForPB();
            const entry = await pb.collection('time_entries').create({
                user: pb.authStore.model.id,
                ...data
            });
            return { success: true, data: entry };
        } catch (error) {
            console.error('Create time entry error:', error);
            let errorMessage = error.message || 'Failed to create time entry';
            
            if (error.status === 0 || !error.status) {
                errorMessage = 'Network error: Unable to connect to server';
            } else if (error.status === 403) {
                errorMessage = 'Cannot create time entry: Collection not configured. See POCKETBASE_SETUP.md';
            } else if (error.status === 404) {
                errorMessage = 'Collection not found: time_entries must be created. See POCKETBASE_SETUP.md';
            }
            
            return { success: false, error: errorMessage, status: error.status };
        }
    },

    async updateTimeEntry(id, data) {
        try {
            await waitForPB();
            const entry = await pb.collection('time_entries').update(id, data);
            return { success: true, data: entry };
        } catch (error) {
            console.error('Update time entry error:', error);
            return { success: false, error: error.message };
        }
    },

    async getTimeEntries(filter = '') {
        try {
            await waitForPB();
            const entries = await pb.collection('time_entries').getFullList({
                filter: `user="${pb.authStore.model.id}" ${filter}`,
                sort: '-created'
            });
            return { success: true, data: entries };
        } catch (error) {
            console.error('Get time entries error:', error);
            let errorMessage = error.message || 'Failed to fetch time entries';
            
            // Handle specific error types
            if (error.status === 0 || !error.status) {
                errorMessage = 'Network error: Unable to connect to server. Please check your internet connection.';
            } else if (error.status === 403) {
                errorMessage = 'Access denied: Collection not configured. See POCKETBASE_SETUP.md';
            } else if (error.status === 404) {
                errorMessage = 'Collection not found: time_entries collection does not exist. See POCKETBASE_SETUP.md';
            }
            
            return { success: false, error: errorMessage, status: error.status };
        }
    },

    async getActiveTimeEntry() {
        try {
            await waitForPB();
            const entries = await pb.collection('time_entries').getFullList({
                filter: `user="${pb.authStore.model.id}" && (status="active" || status="on_break")`,
                sort: '-created',
                $autoCancel: false
            });
            return { success: true, data: entries[0] || null };
        } catch (error) {
            console.error('Get active time entry error:', error);
            let errorMessage = error.message || 'Failed to fetch active time entry';
            
            if (error.status === 0 || !error.status) {
                errorMessage = 'Network error: Unable to connect to server';
            } else if (error.status === 403) {
                errorMessage = 'Collection access denied - setup required';
            } else if (error.status === 404) {
                errorMessage = 'time_entries collection not found';
            }
            
            return { success: false, error: errorMessage, status: error.status };
        }
    },

    // Edit Requests
    async createEditRequest(timeEntryId, reason, requestedChanges) {
        try {
            await waitForPB();
            const request = await pb.collection('edit_requests').create({
                user: pb.authStore.model.id,
                time_entry: timeEntryId,
                reason,
                requested_changes: requestedChanges,
                status: 'pending'
            });
            return { success: true, data: request };
        } catch (error) {
            console.error('Create edit request error:', error);
            let errorMessage = error.message || 'Failed to submit edit request';

            if (error.status === 0 || !error.status) {
                errorMessage = 'Network error: Unable to reach PocketBase server';
            } else if (error.status === 403) {
                errorMessage = 'Access denied: edit_requests collection is not configured for users. See POCKETBASE_SETUP.md';
            } else if (error.status === 404) {
                errorMessage = 'Collection not found: edit_requests collection must be created. See POCKETBASE_SETUP.md';
            }

            return { success: false, error: errorMessage, status: error.status };
        }
    },

    // Time Off Requests
    async createTimeOffRequest(data) {
        try {
            await waitForPB();
            const request = await pb.collection('time_off_requests').create({
                user: pb.authStore.model.id,
                ...data,
                status: 'pending'
            });
            return { success: true, data: request };
        } catch (error) {
            console.error('Create time off request error:', error);
            return { success: false, error: error.message };
        }
    },

    async getTimeOffRequests() {
        try {
            await waitForPB();
            const requests = await pb.collection('time_off_requests').getFullList({
                filter: `user="${pb.authStore.model.id}"`,
                sort: '-created'
            });
            return { success: true, data: requests };
        } catch (error) {
            console.error('Get time off requests error:', error);
            return { success: false, error: error.message };
        }
    },

    // User Profile
    async getUserProfile() {
        try {
            await waitForPB();
            const profiles = await pb.collection('user_profiles').getFullList({
                filter: `user="${pb.authStore.model.id}"`
            });
            return { success: true, data: profiles[0] || null };
        } catch (error) {
            console.error('Get user profile error:', error);
            let errorMessage = error.message || 'Failed to fetch user profile';
            
            // Handle specific error types
            if (error.status === 0 || !error.status) {
                errorMessage = 'Network error: Unable to connect to server';
            } else if (error.status === 403) {
                errorMessage = 'Collection access denied - setup required';
            } else if (error.status === 404) {
                errorMessage = 'user_profiles collection not found';
            }
            
            return { success: false, error: errorMessage, status: error.status };
        }
    }
};

// Make API available globally
window.API = API;
window.waitForPB = waitForPB;
