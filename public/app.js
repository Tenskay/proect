// Глобальные переменные
let currentUser = null;
let currentSection = 'login';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthStatus();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Форма входа
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Форма входа с 2FA
    document.getElementById('login-2fa-form').addEventListener('submit', handleLogin2FA);
    
    // Форма регистрации
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Настройка 2FA
    document.getElementById('setup-2fa-btn').addEventListener('click', setup2FA);
    
    // Подтверждение 2FA
    document.getElementById('verify-2fa-form').addEventListener('submit', verify2FA);
    
    // Отключение 2FA
    document.getElementById('disable-2fa-form').addEventListener('submit', disable2FA);
}

// Проверка статуса аутентификации
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/profile');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showSection('profile');
            loadProfile();
        } else {
            currentUser = null;
            showSection('login');
        }
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        currentUser = null;
        showSection('login');
    }
}

// Показать раздел
function showSection(section) {
    // Скрыть все разделы
    document.querySelectorAll('[id$="-section"]').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Показать выбранный раздел
    document.getElementById(section + '-section').classList.remove('hidden');
    
    // Обновить навигацию
    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показывать навигацию только для авторизованных пользователей
    if (currentUser && section !== 'login' && section !== 'register' && section !== 'login-2fa') {
        document.getElementById('nav').style.display = 'flex';
        const navBtn = document.getElementById('nav-' + section);
        if (navBtn) navBtn.classList.add('active');
    } else {
        document.getElementById('nav').style.display = 'none';
    }
    
    currentSection = section;
}

// Показать уведомление
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    // Автоматически скрыть через 5 секунд
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showAlert('Успешный вход!', 'success');
            
            if (data.requires2FA) {
                showSection('login-2fa');
                document.getElementById('login-2fa-email').value = email;
                document.getElementById('login-2fa-password').value = password;
            } else {
                showSection('profile');
                loadProfile();
            }
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showAlert('Ошибка соединения с сервером', 'error');
    }
}

// Обработка входа с 2FA
async function handleLogin2FA(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-2fa-email').value;
    const password = document.getElementById('login-2fa-password').value;
    const token = document.getElementById('login-2fa-token').value;
    
    try {
        const response = await fetch('/2fa/login/2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, token })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showAlert('Успешный вход с 2FA!', 'success');
            showSection('profile');
            loadProfile();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка входа с 2FA:', error);
        showAlert('Ошибка соединения с сервером', 'error');
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showAlert('Регистрация успешна!', 'success');
            showSection('profile');
            loadProfile();
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showAlert('Ошибка соединения с сервером', 'error');
    }
}

// Загрузка профиля
async function loadProfile() {
    try {
        const response = await fetch('/auth/profile');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            const profileInfo = document.getElementById('profile-info');
            profileInfo.innerHTML = `
                <h3>Информация о пользователе</h3>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>2FA:</strong> ${currentUser.twoFactorEnabled ? 'Включена' : 'Отключена'}</p>
                <p><strong>Дата регистрации:</strong> ${new Date(currentUser.createdAt).toLocaleDateString('ru-RU')}</p>
            `;
            
            // Показать соответствующие кнопки для 2FA
            if (currentUser.twoFactorEnabled) {
                document.getElementById('2fa-setup-section').style.display = 'none';
                document.getElementById('2fa-disable-section').classList.remove('hidden');
            } else {
                document.getElementById('2fa-setup-section').style.display = 'block';
                document.getElementById('2fa-disable-section').classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showAlert('Ошибка загрузки профиля', 'error');
    }
}

// Настройка 2FA
async function setup2FA() {
    try {
        const response = await fetch('/2fa/setup');
        const data = await response.json();
        
        if (response.ok) {
            // Показать QR-код
            const qrContainer = document.getElementById('qr-code-container');
            qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
            
            // Показать секрет
            const secretDisplay = document.getElementById('secret-display');
            secretDisplay.innerHTML = `
                <strong>Секрет (если не можете отсканировать QR-код):</strong><br>
                ${data.secret}
            `;
            
            // Показать форму подтверждения
            document.getElementById('2fa-verify-section').classList.remove('hidden');
            document.getElementById('setup-2fa-btn').style.display = 'none';
            
            showAlert(data.message, 'info');
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка настройки 2FA:', error);
        showAlert('Ошибка соединения с сервером', 'error');
    }
}

// Подтверждение 2FA
async function verify2FA(e) {
    e.preventDefault();
    
    const token = document.getElementById('verify-token').value;
    
    try {
        const response = await fetch('/2fa/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('2FA успешно включена!', 'success');
            document.getElementById('2fa-verify-section').classList.add('hidden');
            document.getElementById('setup-2fa-btn').style.display = 'block';
            loadProfile(); // Обновить профиль
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка подтверждения 2FA:', error);
        showAlert('Ошибка соединения с сервером', 'error');
    }
}

// Отмена настройки 2FA
function cancel2FASetup() {
    document.getElementById('2fa-verify-section').classList.add('hidden');
    document.getElementById('setup-2fa-btn').style.display = 'block';
    document.getElementById('verify-token').value = '';
}

// Отключение 2FA
async function disable2FA(e) {
    e.preventDefault();
    
    const password = document.getElementById('disable-password').value;
    
    try {
        const response = await fetch('/2fa/disable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('2FA успешно отключена!', 'success');
            document.getElementById('disable-password').value = '';
            loadProfile(); // Обновить профиль
        } else {
            showAlert(data.error, 'error');
        }
    } catch (error) {
        console.error('Ошибка отключения 2FA:', error);
        showAlert('Ошибка соединения с сервером', 'error');
    }
}

// Выход
async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            showAlert('Вы вышли из системы', 'info');
            showSection('login');
            
            // Очистить формы
            document.getElementById('login-form').reset();
            document.getElementById('register-form').reset();
        }
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showAlert('Ошибка при выходе', 'error');
    }
}