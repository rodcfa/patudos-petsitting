// Client Dashboard Script
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let clientData = null;
let clientBookings = [];
let clientPets = [];

// Elementos DOM
const loadingOverlay = document.getElementById('loadingOverlay');
const clientNameElement = document.getElementById('clientName');
const recentBookingsList = document.getElementById('recentBookingsList');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Client Dashboard - Iniciado');
    
    // Verificar se está logado como cliente
    if (!isClientLoggedIn()) {
        alert('Acesso negado. Faça login como cliente.');
        window.location.href = 'login.html';
        return;
    }
    
    initializeClientDashboard();
});

function isClientLoggedIn() {
    return localStorage.getItem('clientLoggedIn') === 'true' && 
           localStorage.getItem('clientId');
}

async function initializeClientDashboard() {
    try {
        showLoading(true);
        
        await loadClientData();
        updateStats();
        renderRecentBookings();
        
        showLoading(false);
        
        console.log('Client Dashboard carregado com sucesso');
    } catch (error) {
        console.error('Erro ao carregar dashboard cliente:', error);
        showLoading(false);
        alert('Erro ao carregar dados do dashboard.');
    }
}

async function loadClientData() {
    try {
        const clientId = localStorage.getItem('clientId');
        
        // Carregar dados do cliente
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (userError) throw userError;
        
        clientData = userData;
        clientNameElement.textContent = clientData.name;
        
        // Carregar reservas do cliente
        const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
                *,
                booking_pets(
                    pet:pets(name, breed)
                )
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        
        if (bookingsError) throw bookingsError;
        
        clientBookings = bookingsData || [];
        
        // Carregar pets do cliente
        const { data: petsData, error: petsError } = await supabase
            .from('pets')
            .select('*')
            .eq('owner_id', clientId)
            .order('name', { ascending: true });
        
        if (petsError) throw petsError;
        
        clientPets = petsData || [];
        
        console.log('Dados do cliente carregados:', {
            client: clientData.name,
            bookings: clientBookings.length,
            pets: clientPets.length
        });
        
    } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
        throw error;
    }
}

function updateStats() {
    // Reservas ativas (aprovadas e não concluídas)
    const activeBookings = clientBookings.filter(booking => 
        booking.status === 'approved' && new Date(booking.checkout_date) >= new Date()
    );
    document.getElementById('activeBookings').textContent = activeBookings.length;
    
    // Reservas pendentes
    const pendingBookings = clientBookings.filter(booking => booking.status === 'pending');
    document.getElementById('pendingBookings').textContent = pendingBookings.length;
    
    // Total de pets
    document.getElementById('totalPets').textContent = clientPets.length;
    
    // Total de estadias (reservas concluídas)
    const completedStays = clientBookings.filter(booking => 
        booking.status === 'approved' && new Date(booking.checkout_date) < new Date()
    );
    document.getElementById('totalStays').textContent = completedStays.length;
}

function renderRecentBookings() {
    if (clientBookings.length === 0) {
        recentBookingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-plus"></i>
                <h4>Nenhuma reserva encontrada</h4>
                <p>Você ainda não fez nenhuma reserva. <a href="new-booking.html">Clique aqui para fazer sua primeira reserva</a>.</p>
            </div>
        `;
        return;
    }
    
    recentBookingsList.innerHTML = '';
    
    // Mostrar as 5 reservas mais recentes
    const recentBookings = clientBookings.slice(0, 5);
    
    recentBookings.forEach(booking => {
        const bookingElement = createBookingElement(booking);
        recentBookingsList.appendChild(bookingElement);
    });
}

function createBookingElement(booking) {
    const bookingDiv = document.createElement('div');
    bookingDiv.className = 'booking-item';
    
    const checkinDate = new Date(booking.checkin_date).toLocaleDateString('pt-PT');
    const checkoutDate = new Date(booking.checkout_date).toLocaleDateString('pt-PT');
    const createdDate = new Date(booking.created_at).toLocaleDateString('pt-PT');
    
    // Calcular duração
    const checkin = new Date(booking.checkin_date);
    const checkout = new Date(booking.checkout_date);
    const duration = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    // Pets da reserva
    const pets = booking.booking_pets?.map(bp => bp.pet) || [];
    const petsInfo = pets.length > 0 
        ? pets.map(pet => pet.name).join(', ')
        : 'Nenhum pet associado';
    
    bookingDiv.innerHTML = `
        <div class="booking-header">
            <div>
                <h4>Reserva de ${checkinDate}</h4>
                <p><i class="fas fa-paw"></i> ${petsInfo}</p>
            </div>
            <span class="status-badge status-${booking.status}">${getStatusText(booking.status)}</span>
        </div>
        
        <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">
            <p><strong>Check-in:</strong> ${checkinDate} | <strong>Check-out:</strong> ${checkoutDate}</p>
            <p><strong>Duração:</strong> ${duration} ${duration === 1 ? 'dia' : 'dias'}</p>
            <p><strong>Solicitado em:</strong> ${createdDate}</p>
            ${booking.daily_rate ? `<p><strong>Valor/dia:</strong> €${parseFloat(booking.daily_rate).toFixed(2)}</p>` : ''}
        </div>
    `;
    
    return bookingDiv;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'approved': 'Aprovada',
        'rejected': 'Rejeitada',
        'completed': 'Concluída',
        'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('clientLoggedIn');
        localStorage.removeItem('clientId');
        localStorage.removeItem('clientName');
        localStorage.removeItem('clientEmail');
        window.location.href = 'login.html';
    }
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Funções globais
window.logout = logout;