// Patudos PetSitting - Main JavaScript File
// Sistema de gestão para petsitting

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let currentDate = new Date();
let currentView = 'calendar';
let agendamentos = [];

// Elementos DOM
const calendarDays = document.getElementById('calendarDays');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const addClientBtn = document.getElementById('addClientBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const agendamentoForm = document.getElementById('agendamentoForm');
const loadingOverlay = document.getElementById('loadingOverlay');

// Elementos do modal de detalhes do dia
const dayDetailsModal = document.getElementById('dayDetailsModal');
const closeDayDetailsModal = document.getElementById('closeDayDetailsModal');
const dayDetailsTitle = document.getElementById('dayDetailsTitle');
const dayDetailsDate = document.getElementById('dayDetailsDate');
const dayDetailsPetCount = document.getElementById('dayDetailsPetCount');
const dayDetailsPetsList = document.getElementById('dayDetailsPetsList');

// Elementos do modal de edição
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editAgendamentoForm = document.getElementById('editAgendamentoForm');
const deleteAgendamentoBtn = document.getElementById('deleteAgendamentoBtn');

// Elementos de navegação
const calendarViewBtn = document.getElementById('calendarViewBtn');
const adminPanelBtn = document.getElementById('adminPanelBtn');
const dashboardViewBtn = document.getElementById('dashboardViewBtn');
const dashboardSection = document.getElementById('dashboardSection');
const mainContent = document.querySelector('.main-content');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Patudos PetSitting - Ambiente de Testes Iniciado');
    
    // Verificar se está logado antes de inicializar
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar conexão com Supabase
    if (!supabaseUrl || !supabaseKey) {
        console.error('Credenciais do Supabase não encontradas!');
        alert('Erro: Configuração do Supabase não encontrada. Verifique o arquivo .env');
        return;
    }
    
    console.log('Conectado ao Supabase:', supabaseUrl);
    
    // Inicializar aplicação
    initializeApp();
});

function isLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

async function initializeApp() {
    try {
        showLoading(true);
        
        // Carregar agendamentos
        await loadAgendamentos();
        
        // Renderizar calendário
        renderCalendar();
        
        // Configurar event listeners
        setupEventListeners();
        
        showLoading(false);
        
        console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showLoading(false);
        alert('Erro ao carregar dados. Verifique a conexão com o banco de dados.');
    }
}

function setupEventListeners() {
    // Navegação do calendário
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Modal de adicionar cliente
    addClientBtn.addEventListener('click', () => {
        openModal();
    });
    
    closeModal.addEventListener('click', () => {
        closeModalOverlay();
    });
    
    cancelBtn.addEventListener('click', () => {
        closeModalOverlay();
    });
    
    // Modal de detalhes do dia
    closeDayDetailsModal.addEventListener('click', () => {
        closeDayDetails();
    });
    
    // Modal de edição
    closeEditModal.addEventListener('click', () => {
        closeEditModalOverlay();
    });
    
    cancelEditBtn.addEventListener('click', () => {
        closeEditModalOverlay();
    });
    
    // Formulários
    agendamentoForm.addEventListener('submit', handleFormSubmit);
    editAgendamentoForm.addEventListener('submit', handleEditFormSubmit);
    deleteAgendamentoBtn.addEventListener('click', handleDeleteAgendamento);
    
    // Navegação entre views
    calendarViewBtn.addEventListener('click', () => switchView('calendar'));
    adminPanelBtn.addEventListener('click', () => {
        window.location.href = 'admin-dashboard.html';
    });
    dashboardViewBtn.addEventListener('click', () => switchView('dashboard'));
    
    // Fechar modais clicando fora
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModalOverlay();
        }
    });
    
    dayDetailsModal.addEventListener('click', (e) => {
        if (e.target === dayDetailsModal) {
            closeDayDetails();
        }
    });
    
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModalOverlay();
        }
    });
}

async function loadAgendamentos() {
    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('*')
            .order('data_inicio', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        agendamentos = data || [];
        console.log('Agendamentos carregados:', agendamentos.length);
        
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        throw error;
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Atualizar título do mês
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    
    // Limpar calendário
    calendarDays.innerHTML = '';
    
    // Primeiro dia do mês e último dia
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Dias do mês anterior
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayElement = createDayElement(daysInPrevMonth - i, true);
        calendarDays.appendChild(dayElement);
    }
    
    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, false);
        calendarDays.appendChild(dayElement);
    }
    
    // Dias do próximo mês
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 semanas * 7 dias
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true);
        calendarDays.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    // Verificar se é hoje
    const today = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    if (!isOtherMonth && 
        day === today.getDate() && 
        currentMonth === today.getMonth() && 
        currentYear === today.getFullYear()) {
        dayElement.classList.add('today');
    }
    
    // Criar estrutura do dia
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    
    const dayPets = document.createElement('div');
    dayPets.className = 'day-pets';
    
    dayElement.appendChild(dayNumber);
    dayElement.appendChild(dayPets);
    
    // Adicionar agendamentos do dia
    if (!isOtherMonth) {
        const dayDate = new Date(currentYear, currentMonth, day);
        const dayAgendamentos = getAgendamentosForDate(dayDate);
        
        if (dayAgendamentos.length > 0) {
            // Adicionar classe de ocupação
            if (dayAgendamentos.length <= 3) {
                dayElement.classList.add('occupancy-normal');
            } else if (dayAgendamentos.length === 4) {
                dayElement.classList.add('occupancy-warning');
            } else {
                dayElement.classList.add('occupancy-danger');
            }
            
            // Mostrar pets (máximo 3)
            dayAgendamentos.slice(0, 3).forEach(agendamento => {
                const petElement = document.createElement('div');
                petElement.className = 'pet-item';
                petElement.textContent = agendamento.nome_pet;
                dayPets.appendChild(petElement);
            });
            
            // Mostrar contador se houver mais pets
            if (dayAgendamentos.length > 3) {
                const countElement = document.createElement('div');
                countElement.className = 'pet-count';
                countElement.textContent = dayAgendamentos.length;
                dayElement.appendChild(countElement);
            }
        }
        
        // Adicionar evento de clique
        dayElement.addEventListener('click', () => {
            showDayDetails(dayDate, dayAgendamentos);
        });
    }
    
    return dayElement;
}

function getAgendamentosForDate(date) {
    return agendamentos.filter(agendamento => {
        const dataInicio = new Date(agendamento.data_inicio);
        const dataFim = new Date(agendamento.data_fim);
        
        // Ajustar para timezone local
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        date.setHours(12, 0, 0, 0);
        
        return date >= dataInicio && date <= dataFim;
    });
}

function showDayDetails(date, dayAgendamentos) {
    const dateStr = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dayDetailsDate.textContent = dateStr;
    dayDetailsPetCount.textContent = `${dayAgendamentos.length} ${dayAgendamentos.length === 1 ? 'pet' : 'pets'}`;
    
    // Limpar lista de pets
    dayDetailsPetsList.innerHTML = '';
    
    if (dayAgendamentos.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-calendar-day"></i>
            <h4>Nenhum agendamento</h4>
            <p>Não há pets agendados para este dia.</p>
        `;
        dayDetailsPetsList.appendChild(emptyState);
    } else {
        dayAgendamentos.forEach(agendamento => {
            const petCard = createPetCard(agendamento);
            dayDetailsPetsList.appendChild(petCard);
        });
    }
    
    dayDetailsModal.classList.add('active');
}

function createPetCard(agendamento) {
    const petCard = document.createElement('div');
    petCard.className = 'pet-card';
    
    const dataInicio = new Date(agendamento.data_inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(agendamento.data_fim).toLocaleDateString('pt-BR');
    
    petCard.innerHTML = `
        <div class="pet-card-header">
            <div class="pet-name">
                <i class="fas fa-paw"></i>
                ${agendamento.nome_pet}
            </div>
            <div class="pet-actions">
                <button class="btn-icon btn-edit" onclick="editAgendamento('${agendamento.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteAgendamento('${agendamento.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="pet-dates">
            <div class="pet-date-item">
                <i class="fas fa-sign-in-alt"></i>
                <span>Entrada: ${dataInicio}</span>
            </div>
            <div class="pet-date-item">
                <i class="fas fa-sign-out-alt"></i>
                <span>Saída: ${dataFim}</span>
            </div>
        </div>
        ${agendamento.valor_por_dia ? `<p><strong>Valor/dia:</strong> €${parseFloat(agendamento.valor_por_dia).toFixed(2)}</p>` : ''}
        ${agendamento.observacoes ? `<p><strong>Observações:</strong> ${agendamento.observacoes}</p>` : ''}
        <span class="pet-status">${agendamento.status || 'Confirmado'}</span>
    `;
    
    return petCard;
}

function openModal() {
    // Limpar formulário
    agendamentoForm.reset();
    
    // Definir data mínima como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dataInicio').min = today;
    document.getElementById('dataFim').min = today;
    
    modalOverlay.classList.add('active');
}

function closeModalOverlay() {
    modalOverlay.classList.remove('active');
}

function closeDayDetails() {
    dayDetailsModal.classList.remove('active');
}

function closeEditModalOverlay() {
    editModal.classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData(agendamentoForm);
        const agendamentoData = {
            nome_pet: formData.get('nomePet'),
            data_inicio: formData.get('dataInicio'),
            data_fim: formData.get('dataFim'),
            valor_por_dia: parseFloat(formData.get('valorPorDia')) || 0,
            observacoes: formData.get('observacoes') || null,
            status: 'Confirmado'
        };
        
        // Validar datas
        const dataInicio = new Date(agendamentoData.data_inicio);
        const dataFim = new Date(agendamentoData.data_fim);
        
        if (dataFim <= dataInicio) {
            alert('A data de saída deve ser posterior à data de entrada.');
            showLoading(false);
            return;
        }
        
        const { data, error } = await supabase
            .from('agendamentos')
            .insert([agendamentoData])
            .select();
        
        if (error) {
            throw error;
        }
        
        console.log('Agendamento criado:', data[0]);
        
        // Recarregar agendamentos e atualizar calendário
        await loadAgendamentos();
        renderCalendar();
        
        // Fechar modal
        closeModalOverlay();
        
        showLoading(false);
        alert('Agendamento criado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        showLoading(false);
        alert('Erro ao criar agendamento. Tente novamente.');
    }
}

async function editAgendamento(id) {
    try {
        const agendamento = agendamentos.find(a => a.id === id);
        if (!agendamento) {
            alert('Agendamento não encontrado.');
            return;
        }
        
        // Preencher formulário de edição
        document.getElementById('editAgendamentoId').value = agendamento.id;
        document.getElementById('editNomePet').value = agendamento.nome_pet;
        document.getElementById('editDataInicio').value = agendamento.data_inicio;
        document.getElementById('editDataFim').value = agendamento.data_fim;
        document.getElementById('editValorPorDia').value = agendamento.valor_por_dia || '';
        document.getElementById('editObservacoes').value = agendamento.observacoes || '';
        
        // Fechar modal de detalhes e abrir modal de edição
        closeDayDetails();
        editModal.classList.add('active');
        
    } catch (error) {
        console.error('Erro ao editar agendamento:', error);
        alert('Erro ao carregar dados do agendamento.');
    }
}

async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading(true);
        
        const formData = new FormData(editAgendamentoForm);
        const id = document.getElementById('editAgendamentoId').value;
        
        const agendamentoData = {
            nome_pet: formData.get('nomePet'),
            data_inicio: formData.get('dataInicio'),
            data_fim: formData.get('dataFim'),
            valor_por_dia: parseFloat(formData.get('valorPorDia')) || 0,
            observacoes: formData.get('observacoes') || null
        };
        
        // Validar datas
        const dataInicio = new Date(agendamentoData.data_inicio);
        const dataFim = new Date(agendamentoData.data_fim);
        
        if (dataFim <= dataInicio) {
            alert('A data de saída deve ser posterior à data de entrada.');
            showLoading(false);
            return;
        }
        
        const { data, error } = await supabase
            .from('agendamentos')
            .update(agendamentoData)
            .eq('id', id)
            .select();
        
        if (error) {
            throw error;
        }
        
        console.log('Agendamento atualizado:', data[0]);
        
        // Recarregar agendamentos e atualizar calendário
        await loadAgendamentos();
        renderCalendar();
        
        // Fechar modal
        closeEditModalOverlay();
        
        showLoading(false);
        alert('Agendamento atualizado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        showLoading(false);
        alert('Erro ao atualizar agendamento. Tente novamente.');
    }
}

async function handleDeleteAgendamento() {
    if (!confirm('Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const id = document.getElementById('editAgendamentoId').value;
        
        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        console.log('Agendamento excluído:', id);
        
        // Recarregar agendamentos e atualizar calendário
        await loadAgendamentos();
        renderCalendar();
        
        // Fechar modal
        closeEditModalOverlay();
        
        showLoading(false);
        alert('Agendamento excluído com sucesso!');
        
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        showLoading(false);
        alert('Erro ao excluir agendamento. Tente novamente.');
    }
}

function switchView(view) {
    currentView = view;
    
    // Atualizar botões de navegação
    calendarViewBtn.classList.remove('active');
    dashboardViewBtn.classList.remove('active');
    
    if (view === 'calendar') {
        calendarViewBtn.classList.add('active');
        mainContent.style.display = 'block';
        dashboardSection.style.display = 'none';
    } else if (view === 'dashboard') {
        dashboardViewBtn.classList.add('active');
        mainContent.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadDashboardData();
    }
}

async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Calcular estatísticas
        const stats = calculateStats();
        
        // Atualizar cards de estatísticas
        document.getElementById('receitaTotal').textContent = `€${stats.receitaTotal.toFixed(2)}`;
        document.getElementById('totalAgendamentos').textContent = stats.totalAgendamentos;
        document.getElementById('totalDias').textContent = stats.totalDias;
        document.getElementById('valorMedio').textContent = `€${stats.valorMedio.toFixed(2)}`;
        
        // Carregar gráficos
        loadCharts(stats);
        
        showLoading(false);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showLoading(false);
    }
}

function calculateStats() {
    let receitaTotal = 0;
    let totalDias = 0;
    
    agendamentos.forEach(agendamento => {
        const dataInicio = new Date(agendamento.data_inicio);
        const dataFim = new Date(agendamento.data_fim);
        const dias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
        const valorPorDia = parseFloat(agendamento.valor_por_dia) || 0;
        
        totalDias += dias;
        receitaTotal += dias * valorPorDia;
    });
    
    return {
        receitaTotal,
        totalAgendamentos: agendamentos.length,
        totalDias,
        valorMedio: totalDias > 0 ? receitaTotal / totalDias : 0
    };
}

function loadCharts(stats) {
    // Implementar gráficos com Chart.js
    console.log('Carregando gráficos com dados:', stats);
    
    // Por enquanto, apenas log - implementar gráficos posteriormente
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Funções globais para uso nos event handlers inline
window.editAgendamento = editAgendamento;
window.logout = logout;
window.deleteAgendamento = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id);
        
        if (error) {
            throw error;
        }
        
        await loadAgendamentos();
        renderCalendar();
        closeDayDetails();
        
        showLoading(false);
        alert('Agendamento excluído com sucesso!');
        
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        showLoading(false);
        alert('Erro ao excluir agendamento. Tente novamente.');
    }
};

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    }
}