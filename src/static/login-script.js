// Login Script
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let currentLoginType = null;

// Elementos DOM
const loginForm = document.getElementById('loginForm');
const loginOptions = document.getElementById('loginOptions');
const loadingOverlay = document.getElementById('loadingOverlay');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login Page - Iniciado');
    setupEventListeners();
    
    // Verificar se já está logado
    checkExistingLogin();
});

function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function checkExistingLogin() {
    // Verificar se já está logado como admin
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    // Verificar se já está logado como cliente
    if (localStorage.getItem('clientLoggedIn') === 'true') {
        window.location.href = 'client-dashboard.html';
        return;
    }
}

function showClientLogin() {
    currentLoginType = 'client';
    loginOptions.style.display = 'none';
    loginForm.style.display = 'block';
    
    // Atualizar placeholder e labels para cliente
    document.querySelector('label[for="username"]').textContent = 'Email:';
    document.getElementById('username').type = 'email';
    document.getElementById('username').placeholder = 'seu@email.com';
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar como Cliente';
}

function showAdminLogin() {
    currentLoginType = 'admin';
    loginOptions.style.display = 'none';
    loginForm.style.display = 'block';
    
    // Atualizar placeholder e labels para admin
    document.querySelector('label[for="username"]').textContent = 'Usuário:';
    document.getElementById('username').type = 'text';
    document.getElementById('username').placeholder = 'Usuário do administrador';
    submitBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Entrar como Admin';
}

function showLoginOptions() {
    currentLoginType = null;
    if (loginForm) loginForm.style.display = 'none';
    if (loginOptions) loginOptions.style.display = 'flex';
    
    // Resetar formulário
    if (loginForm) loginForm.reset();
    hideError();
}

async function handleLogin(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        hideError();
        
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        
        if (currentLoginType === 'admin') {
            // Login de administrador - credenciais hardcoded para segurança
            if (username === 'RC-adm' && password === 'Gotzen1154!') {
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminUser', 'RC-adm');
                
                showLoading(false);
                window.location.href = 'index.html';
                return;
            } else {
                throw new Error('Credenciais de administrador inválidas');
            }
        } else if (currentLoginType === 'client') {
            // Login de cliente via Supabase
            const hashedPassword = await hashPassword(password);
            
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', username)
                .eq('password_hash', hashedPassword)
                .eq('role', 'client')
                .single();
            
            if (error || !user) {
                throw new Error('Email ou senha incorretos');
            }
            
            // Salvar dados do cliente logado
            localStorage.setItem('clientLoggedIn', 'true');
            localStorage.setItem('clientId', user.id);
            localStorage.setItem('clientName', user.name);
            localStorage.setItem('clientEmail', user.email);
            
            showLoading(false);
            window.location.href = 'client-dashboard.html';
            return;
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        showLoading(false);
        showError(error.message);
    }
}

async function hashPassword(password) {
    // Mesma função de hash usada no registro
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function showLoading(show) {
    if (!loadingOverlay || !submitBtn) return;
    
    if (show) {
        loadingOverlay.classList.add('active');
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.dataset.originalText = originalText;
    } else {
        loadingOverlay.classList.remove('active');
        submitBtn.disabled = false;
        if (submitBtn.dataset.originalText) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
        }
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

function hideError() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// Funções globais
window.showClientLogin = showClientLogin;
window.showAdminLogin = showAdminLogin;
window.showLoginOptions = showLoginOptions;