// Register Script
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let petCount = 1;

// Elementos DOM
const registerForm = document.getElementById('registerForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const submitBtn = document.getElementById('submitBtn');
const petsContainer = document.getElementById('petsContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Register Page - Iniciado');
    setupEventListeners();
});

function setupEventListeners() {
    registerForm.addEventListener('submit', handleFormSubmit);
    
    // Validação de senha em tempo real
    document.getElementById('confirmPassword').addEventListener('input', validatePasswords);
    document.getElementById('password').addEventListener('input', validatePasswords);
}

function validatePasswords() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmField = document.getElementById('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmField.setCustomValidity('As senhas não coincidem');
    } else {
        confirmField.setCustomValidity('');
    }
}

function addPet() {
    petCount++;
    
    const petSection = document.createElement('div');
    petSection.className = 'pet-section additional';
    petSection.setAttribute('data-pet-index', petCount - 1);
    
    petSection.innerHTML = `
        <div class="pet-header">
            <div class="pet-title">
                <i class="fas fa-paw"></i>
                Pet ${petCount}
            </div>
            <button type="button" class="remove-pet-btn" onclick="removePet(this)">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
        
        <div class="form-grid">
            <div class="form-group">
                <label>Nome do Pet <span class="required">*</span></label>
                <input type="text" name="pets[${petCount - 1}][name]" required>
            </div>

            <div class="form-group">
                <label>Raça <span class="required">*</span></label>
                <input type="text" name="pets[${petCount - 1}][breed]" required>
            </div>

            <div class="form-group">
                <label>Idade (anos) <span class="required">*</span></label>
                <input type="number" name="pets[${petCount - 1}][age]" min="0" max="30" required>
            </div>

            <div class="form-group">
                <label>Sexo <span class="required">*</span></label>
                <select name="pets[${petCount - 1}][sex]" required>
                    <option value="">Selecione</option>
                    <option value="male">Macho</option>
                    <option value="female">Fêmea</option>
                </select>
            </div>

            <div class="form-group">
                <label>Peso (kg)</label>
                <input type="number" name="pets[${petCount - 1}][weight]" min="0" step="0.1">
            </div>

            <div class="form-group">
                <label>Vacinas em dia? <span class="required">*</span></label>
                <select name="pets[${petCount - 1}][vaccinations_up_to_date]" required>
                    <option value="">Selecione</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                </select>
            </div>

            <div class="form-group">
                <label>Sociável com outros cães?</label>
                <select name="pets[${petCount - 1}][sociable_with_dogs]">
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                    <option value="depends">Depende</option>
                </select>
            </div>

            <div class="form-group">
                <label>Amigável com estranhos?</label>
                <select name="pets[${petCount - 1}][friendly_with_strangers]">
                    <option value="">Selecione</option>
                    <option value="yes">Sim</option>
                    <option value="no">Não</option>
                    <option value="depends">Depende</option>
                </select>
            </div>

            <div class="form-group full-width">
                <label>Instruções de Alimentação</label>
                <textarea name="pets[${petCount - 1}][feeding_instructions]" placeholder="Tipo de ração, quantidade, horários..."></textarea>
            </div>

            <div class="form-group full-width">
                <label>Alergias ou Condições Médicas</label>
                <textarea name="pets[${petCount - 1}][medical_conditions]" placeholder="Descreva alergias, medicações, condições especiais..."></textarea>
            </div>
        </div>
    `;
    
    petsContainer.appendChild(petSection);
}

function removePet(button) {
    const petSection = button.closest('.pet-section');
    petSection.remove();
    petCount--;
    
    // Renumerar os pets
    document.querySelectorAll('.pet-section').forEach((section, index) => {
        const title = section.querySelector('.pet-title');
        title.innerHTML = `<i class="fas fa-paw"></i> Pet ${index + 1}`;
        section.setAttribute('data-pet-index', index);
        
        // Atualizar nomes dos campos
        section.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.name && field.name.startsWith('pets[')) {
                const fieldName = field.name.replace(/pets\[\d+\]/, `pets[${index}]`);
                field.name = fieldName;
            }
        });
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        hideMessages();
        
        const formData = new FormData(registerForm);
        
        // Validar senhas
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem');
        }
        
        if (password.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        
        // Preparar dados do usuário
        const userData = {
            email: formData.get('email'),
            password_hash: await hashPassword(password), // Em produção, usar bcrypt no backend
            role: 'client',
            name: formData.get('name'),
            phone: formData.get('phone') || null,
            emergency_contact: formData.get('emergency_contact'),
            veterinarian: formData.get('veterinarian'),
            authorize_emergency_care: formData.get('authorize_emergency_care') === 'true',
            additional_comments: formData.get('additional_comments') || null
        };
        
        // Verificar se email já existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', userData.email)
            .single();
        
        if (existingUser) {
            throw new Error('Este email já está cadastrado');
        }
        
        // Criar usuário
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
        
        if (userError) throw userError;
        
        console.log('Usuário criado:', user);
        
        // Preparar dados dos pets
        const pets = [];
        const petSections = document.querySelectorAll('.pet-section');
        
        petSections.forEach((section, index) => {
            const pet = {
                owner_id: user.id,
                name: formData.get(`pets[${index}][name]`),
                breed: formData.get(`pets[${index}][breed]`),
                age: parseInt(formData.get(`pets[${index}][age]`)),
                sex: formData.get(`pets[${index}][sex]`),
                weight: formData.get(`pets[${index}][weight]`) ? parseFloat(formData.get(`pets[${index}][weight]`)) : null,
                vaccinations_up_to_date: formData.get(`pets[${index}][vaccinations_up_to_date]`) === 'true',
                sociable_with_dogs: formData.get(`pets[${index}][sociable_with_dogs]`) || null,
                friendly_with_strangers: formData.get(`pets[${index}][friendly_with_strangers]`) || null,
                feeding_instructions: formData.get(`pets[${index}][feeding_instructions]`) || null,
                medical_conditions: formData.get(`pets[${index}][medical_conditions]`) || null
            };
            
            if (pet.name && pet.breed && pet.age && pet.sex) {
                pets.push(pet);
            }
        });
        
        // Criar pets
        if (pets.length > 0) {
            const { error: petsError } = await supabase
                .from('pets')
                .insert(pets);
            
            if (petsError) throw petsError;
            
            console.log('Pets criados:', pets.length);
        }
        
        showLoading(false);
        showSuccess();
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        showLoading(false);
        showError(error.message);
    }
}

async function hashPassword(password) {
    // Em produção, isso deve ser feito no backend com bcrypt
    // Por enquanto, usar uma hash simples para demonstração
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
    } else {
        loadingOverlay.classList.remove('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
    }
}

function showSuccess() {
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Funções globais
window.addPet = addPet;
window.removePet = removePet;