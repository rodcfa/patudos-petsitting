// New Booking Script
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let clientPets = [];
let selectedPets = [];

// Elementos DOM
const bookingForm = document.getElementById('bookingForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const submitBtn = document.getElementById('submitBtn');
const petsSelection = document.getElementById('petsSelection');
const checkinInput = document.getElementById('checkinDate');
const checkoutInput = document.getElementById('checkoutDate');
const durationDisplay = document.getElementById('durationDisplay');
const durationText = document.getElementById('durationText');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('New Booking Page - Iniciado');
    
    // Verificar se está logado como cliente
    if (!isClientLoggedIn()) {
        alert('Acesso negado. Faça login como cliente.');
        window.location.href = 'login.html';
        return;
    }
    
    initializeNewBooking();
});

function isClientLoggedIn() {
    return localStorage.getItem('clientLoggedIn') === 'true' && 
           localStorage.getItem('clientId');
}

async function initializeNewBooking() {
    try {
        showLoading(true);
        
        await loadClientPets();
        renderPetsSelection();
        setupEventListeners();
        setupDateValidation();
        
        showLoading(false);
        
        console.log('New Booking inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar nova reserva:', error);
        showLoading(false);
        showError('Erro ao carregar dados. Tente novamente.');
    }
}

async function loadClientPets() {
    try {
        const clientId = localStorage.getItem('clientId');
        
        const { data: petsData, error } = await supabase
            .from('pets')
            .select('*')
            .eq('owner_id', clientId)
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        clientPets = petsData || [];
        
        console.log('Pets do cliente carregados:', clientPets.length);
        
        if (clientPets.length === 0) {
            showError('Você precisa cadastrar pelo menos um pet antes de fazer uma reserva. Acesse "Meus Pets" para cadastrar.');
            submitBtn.disabled = true;
        }
        
    } catch (error) {
        console.error('Erro ao carregar pets:', error);
        throw error;
    }
}

function renderPetsSelection() {
    if (clientPets.length === 0) {
        petsSelection.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-dog" style="font-size: 3rem; margin-bottom: 1rem; color: #d1d5db;"></i>
                <h4>Nenhum pet cadastrado</h4>
                <p>Você precisa cadastrar pelo menos um pet antes de fazer uma reserva.</p>
                <a href="my-pets.html" style="color: #10b981; text-decoration: none; font-weight: 600;">
                    <i class="fas fa-plus"></i> Cadastrar Pet
                </a>
            </div>
        `;
        return;
    }
    
    petsSelection.innerHTML = '';
    
    clientPets.forEach(pet => {
        const petElement = createPetCheckbox(pet);
        petsSelection.appendChild(petElement);
    });
}

function createPetCheckbox(pet) {
    const petDiv = document.createElement('div');
    petDiv.className = 'pet-checkbox';
    
    const sexText = pet.sex === 'male' ? 'Macho' : 'Fêmea';
    const ageText = `${pet.age} ${pet.age === 1 ? 'ano' : 'anos'}`;
    
    petDiv.innerHTML = `
        <input type="checkbox" id="pet_${pet.id}" value="${pet.id}" onchange="togglePetSelection('${pet.id}')">
        <div class="pet-info">
            <div class="pet-name">${pet.name}</div>
            <div class="pet-details">${pet.breed} • ${sexText} • ${ageText}</div>
        </div>
    `;
    
    return petDiv;
}

function togglePetSelection(petId) {
    const checkbox = document.getElementById(`pet_${petId}`);
    
    if (checkbox.checked) {
        if (!selectedPets.includes(petId)) {
            selectedPets.push(petId);
        }
    } else {
        selectedPets = selectedPets.filter(id => id !== petId);
    }
    
    console.log('Pets selecionados:', selectedPets);
}

function setupEventListeners() {
    bookingForm.addEventListener('submit', handleFormSubmit);
    checkinInput.addEventListener('change', calculateDuration);
    checkoutInput.addEventListener('change', calculateDuration);
}

function setupDateValidation() {
    // Definir data mínima como hoje
    const today = new Date().toISOString().split('T')[0];
    checkinInput.min = today;
    checkoutInput.min = today;
    
    // Atualizar data mínima de checkout quando checkin mudar
    checkinInput.addEventListener('change', function() {
        const checkinDate = new Date(this.value);
        checkinDate.setDate(checkinDate.getDate() + 1);
        checkoutInput.min = checkinDate.toISOString().split('T')[0];
        
        // Limpar checkout se for anterior ao novo checkin
        if (checkoutInput.value && new Date(checkoutInput.value) <= new Date(this.value)) {
            checkoutInput.value = '';
        }
    });
}

function calculateDuration() {
    const checkinDate = new Date(checkinInput.value);
    const checkoutDate = new Date(checkoutInput.value);

    if (checkinInput.value && checkoutInput.value) {
        if (checkoutDate <= checkinDate) {
            showError('A data de check-out deve ser posterior à data de check-in.');
            durationDisplay.style.display = 'none';
            submitBtn.disabled = true;
            return;
        }

        const diffTime = Math.abs(checkoutDate - checkinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        durationText.textContent = `Duração: ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
        durationDisplay.style.display = 'block';
        submitBtn.disabled = false;
        hideError();
    } else {
        durationDisplay.style.display = 'none';
        submitBtn.disabled = true;
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        hideMessages();
        
        // Validações
        if (selectedPets.length === 0) {
            throw new Error('Selecione pelo menos um pet para a reserva.');
        }
        
        const formData = new FormData(bookingForm);
        const checkinDate = formData.get('checkinDate');
        const checkoutDate = formData.get('checkoutDate');
        
        if (!checkinDate || !checkoutDate) {
            throw new Error('Por favor, preencha as datas de check-in e check-out.');
        }
        
        if (new Date(checkoutDate) <= new Date(checkinDate)) {
            throw new Error('A data de check-out deve ser posterior à data de check-in.');
        }
        
        const clientId = localStorage.getItem('clientId');
        
        // Preparar dados da reserva
        const bookingData = {
            client_id: clientId,
            checkin_date: checkinDate,
            checkout_date: checkoutDate,
            pickup_time: formData.get('pickupTime') || null,
            daily_rate: formData.get('dailyRate') ? parseFloat(formData.get('dailyRate')) : 0,
            observations: formData.get('observations') || null,
            status: 'pending'
        };
        
        // Criar reserva
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();
        
        if (bookingError) throw bookingError;
        
        console.log('Reserva criada:', booking);
        
        // Associar pets à reserva
        const bookingPetsData = selectedPets.map(petId => ({
            booking_id: booking.id,
            pet_id: petId
        }));
        
        const { error: petsError } = await supabase
            .from('booking_pets')
            .insert(bookingPetsData);
        
        if (petsError) throw petsError;
        
        console.log('Pets associados à reserva:', selectedPets.length);
        
        showLoading(false);
        showSuccess();
        
        // Limpar formulário
        bookingForm.reset();
        selectedPets = [];
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        durationDisplay.style.display = 'none';
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
            window.location.href = 'client-dashboard.html';
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        showLoading(false);
        showError(error.message);
    }
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    } else {
        loadingOverlay.classList.remove('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Solicitar Reserva';
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

function hideError() {
    errorMessage.style.display = 'none';
}

// Funções globais
window.togglePetSelection = togglePetSelection;