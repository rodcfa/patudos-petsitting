// Admin Dashboard Script
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let pendingBookings = [];
let allBookings = [];
let users = [];

// Elementos DOM
const loadingOverlay = document.getElementById('loadingOverlay');
const pendingBookingsList = document.getElementById('pendingBookingsList');
const bookingDetailsModal = document.getElementById('bookingDetailsModal');
const bookingDetailsContent = document.getElementById('bookingDetailsContent');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard - Iniciado');
    
    // Verificar se é admin
    if (!isAdmin()) {
        alert('Acesso negado. Apenas administradores podem acessar esta página.');
        window.location.href = 'login.html';
        return;
    }
    
    initializeAdminDashboard();
});

function isAdmin() {
    // Por enquanto, verificar localStorage
    // Em produção, verificar token JWT e role
    return localStorage.getItem('adminLoggedIn') === 'true';
}

async function initializeAdminDashboard() {
    try {
        showLoading(true);
        
        await loadData();
        updateStats();
        renderPendingBookings();
        
        showLoading(false);
        
        console.log('Admin Dashboard carregado com sucesso');
    } catch (error) {
        console.error('Erro ao carregar dashboard admin:', error);
        showLoading(false);
        alert('Erro ao carregar dados do dashboard.');
    }
}

async function loadData() {
    try {
        // Carregar reservas
        const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
                *,
                client:users!bookings_client_id_fkey(name, email, phone),
                booking_pets(
                    pet:pets(name, breed, age, sex)
                )
            `)
            .order('created_at', { ascending: false });
        
        if (bookingsError) throw bookingsError;
        
        allBookings = bookingsData || [];
        pendingBookings = allBookings.filter(booking => booking.status === 'pending');
        
        // Carregar usuários
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        
        users = usersData || [];
        
        console.log('Dados carregados:', {
            bookings: allBookings.length,
            pending: pendingBookings.length,
            users: users.length
        });
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        throw error;
    }
}

function updateStats() {
    // Reservas pendentes
    document.getElementById('pendingCount').textContent = pendingBookings.length;
    
    // Reservas aprovadas este mês
    const thisMonth = new Date();
    const approvedThisMonth = allBookings.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return booking.status === 'approved' &&
               bookingDate.getMonth() === thisMonth.getMonth() &&
               bookingDate.getFullYear() === thisMonth.getFullYear();
    });
    document.getElementById('approvedCount').textContent = approvedThisMonth.length;
    
    // Clientes ativos
    const clients = users.filter(user => user.role === 'client');
    document.getElementById('clientsCount').textContent = clients.length;
    
    // Taxa de ocupação (simulada)
    const occupancyRate = Math.min(100, Math.round((allBookings.length / 30) * 100));
    document.getElementById('occupancyRate').textContent = `${occupancyRate}%`;
}

function renderPendingBookings() {
    if (pendingBookings.length === 0) {
        pendingBookingsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h4>Nenhuma reserva pendente</h4>
                <p>Todas as reservas foram processadas.</p>
            </div>
        `;
        return;
    }
    
    pendingBookingsList.innerHTML = '';
    
    pendingBookings.forEach(booking => {
        const bookingElement = createBookingElement(booking);
        pendingBookingsList.appendChild(bookingElement);
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
        ? pets.map(pet => `${pet.name} (${pet.breed})`).join(', ')
        : 'Nenhum pet associado';
    
    bookingDiv.innerHTML = `
        <div class="booking-header">
            <div>
                <h4>${booking.client?.name || 'Cliente não encontrado'}</h4>
                <p><i class="fas fa-envelope"></i> ${booking.client?.email || 'N/A'}</p>
                <p><i class="fas fa-phone"></i> ${booking.client?.phone || 'N/A'}</p>
                <p><i class="fas fa-calendar"></i> Solicitado em: ${createdDate}</p>
            </div>
            <span class="status-badge status-${booking.status}">${getStatusText(booking.status)}</span>
        </div>
        
        <div class="pet-info">
            <strong>Pets:</strong> ${petsInfo}
        </div>
        
        <div style="margin: 1rem 0;">
            <p><strong>Check-in:</strong> ${checkinDate}</p>
            <p><strong>Check-out:</strong> ${checkoutDate}</p>
            <p><strong>Duração:</strong> ${duration} ${duration === 1 ? 'dia' : 'dias'}</p>
            ${booking.daily_rate ? `<p><strong>Valor/dia:</strong> €${parseFloat(booking.daily_rate).toFixed(2)}</p>` : ''}
            ${booking.observations ? `<p><strong>Observações:</strong> ${booking.observations}</p>` : ''}
        </div>
        
        <div class="booking-actions">
            <button class="btn-approve" onclick="approveBooking('${booking.id}')">
                <i class="fas fa-check"></i> Aprovar
            </button>
            <button class="btn-reject" onclick="rejectBooking('${booking.id}')">
                <i class="fas fa-times"></i> Rejeitar
            </button>
            <button class="btn btn-secondary" onclick="viewBookingDetails('${booking.id}')">
                <i class="fas fa-eye"></i> Detalhes
            </button>
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

async function approveBooking(bookingId) {
    if (!confirm('Tem certeza que deseja aprovar esta reserva?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const { error } = await supabase
            .from('bookings')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: 'admin' // Em produção, usar ID do admin logado
            })
            .eq('id', bookingId);
        
        if (error) throw error;
        
        // Recarregar dados
        await loadData();
        updateStats();
        renderPendingBookings();
        
        showLoading(false);
        alert('Reserva aprovada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao aprovar reserva:', error);
        showLoading(false);
        alert('Erro ao aprovar reserva. Tente novamente.');
    }
}

async function rejectBooking(bookingId) {
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason === null) return; // Usuário cancelou
    
    try {
        showLoading(true);
        
        const updateData = {
            status: 'rejected',
            approved_at: new Date().toISOString(),
            approved_by: 'admin' // Em produção, usar ID do admin logado
        };
        
        if (reason.trim()) {
            updateData.admin_notes = reason.trim();
        }
        
        const { error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId);
        
        if (error) throw error;
        
        // Recarregar dados
        await loadData();
        updateStats();
        renderPendingBookings();
        
        showLoading(false);
        alert('Reserva rejeitada.');
        
    } catch (error) {
        console.error('Erro ao rejeitar reserva:', error);
        showLoading(false);
        alert('Erro ao rejeitar reserva. Tente novamente.');
    }
}

function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        alert('Reserva não encontrada.');
        return;
    }
    
    const checkinDate = new Date(booking.checkin_date).toLocaleDateString('pt-PT');
    const checkoutDate = new Date(booking.checkout_date).toLocaleDateString('pt-PT');
    const createdDate = new Date(booking.created_at).toLocaleDateString('pt-PT');
    
    // Calcular duração
    const checkin = new Date(booking.checkin_date);
    const checkout = new Date(booking.checkout_date);
    const duration = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    // Pets da reserva
    const pets = booking.booking_pets?.map(bp => bp.pet) || [];
    
    let petsHtml = '';
    if (pets.length > 0) {
        petsHtml = pets.map(pet => `
            <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <h4>${pet.name}</h4>
                <p><strong>Raça:</strong> ${pet.breed}</p>
                <p><strong>Idade:</strong> ${pet.age} ${pet.age === 1 ? 'ano' : 'anos'}</p>
                <p><strong>Sexo:</strong> ${pet.sex === 'male' ? 'Macho' : 'Fêmea'}</p>
            </div>
        `).join('');
    } else {
        petsHtml = '<p>Nenhum pet associado a esta reserva.</p>';
    }
    
    bookingDetailsContent.innerHTML = `
        <div style="padding: 1rem;">
            <h3>Informações do Cliente</h3>
            <p><strong>Nome:</strong> ${booking.client?.name || 'N/A'}</p>
            <p><strong>Email:</strong> ${booking.client?.email || 'N/A'}</p>
            <p><strong>Telefone:</strong> ${booking.client?.phone || 'N/A'}</p>
            
            <h3 style="margin-top: 2rem;">Detalhes da Reserva</h3>
            <p><strong>Check-in:</strong> ${checkinDate}</p>
            <p><strong>Check-out:</strong> ${checkoutDate}</p>
            <p><strong>Duração:</strong> ${duration} ${duration === 1 ? 'dia' : 'dias'}</p>
            <p><strong>Status:</strong> ${getStatusText(booking.status)}</p>
            <p><strong>Solicitado em:</strong> ${createdDate}</p>
            ${booking.daily_rate ? `<p><strong>Valor/dia:</strong> €${parseFloat(booking.daily_rate).toFixed(2)}</p>` : ''}
            ${booking.pickup_time ? `<p><strong>Horário preferido:</strong> ${booking.pickup_time}</p>` : ''}
            
            <h3 style="margin-top: 2rem;">Pets</h3>
            ${petsHtml}
            
            ${booking.observations ? `
                <h3 style="margin-top: 2rem;">Observações do Cliente</h3>
                <p>${booking.observations}</p>
            ` : ''}
            
            ${booking.admin_notes ? `
                <h3 style="margin-top: 2rem;">Notas do Administrador</h3>
                <p>${booking.admin_notes}</p>
            ` : ''}
        </div>
    `;
    
    bookingDetailsModal.classList.add('active');
}

function closeBookingDetails() {
    bookingDetailsModal.classList.remove('active');
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminLoggedIn');
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
window.approveBooking = approveBooking;
window.rejectBooking = rejectBooking;
window.viewBookingDetails = viewBookingDetails;
window.closeBookingDetails = closeBookingDetails;
window.logout = logout;