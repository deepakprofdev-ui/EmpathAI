// Shared in-memory store — single source of truth for server.js and api.js
const db = {
    users: [
        {
            user_id: 'ADMIN001',
            name: 'Counselor Admin',
            email: 'admin@empathai.clinic',
            password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password = 'superuser123' (bcrypt)
            login_type: 'counselor',
            preferred_language: 'English',
            voice_enabled: true,
<<<<<<< HEAD
            is_deaf: false,
            last_login: Date.now(),
=======
>>>>>>> 436f9e14925a661809128a8df0b61d709422674d
            created_at: Date.now()
        }
    ],
    moodEntries: [],
    chatHistory: [],
    crisisAlerts: []
};

module.exports = db;
