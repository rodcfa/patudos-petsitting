// Global variables
let currentDate = new Date();
let agendamentos = [];
let contagemDiaria = {};

// DOM elements
const calendarDays = document.getElementById('calendarDays');
const currentMonthElement = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const addClientBtn = document.getElementById('addClientBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModalBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const agendamentoForm = document.getElementById('agendamentoForm');
const loadingOverlay = document.getElementById('loadingOverlay');

// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatMonthYear(date) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function showModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    agendamentoForm.reset();
}

// API functions
async function fetchAgendamentos() {
    try {
        const response = await fetch('/api/agendamentos');
        if (!response.ok) throw new Error('Erro ao buscar agendamentos');
        agendamentos = await response.json();
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        alert('Erro ao carregar agendamentos. Tente novamente.');
    }
}

async function fetchContagemDiaria() {
    try {
        const response = await fetch('/api/contagem-diaria');
        if (!response.ok) throw new Error('Erro ao buscar contagem diária');
        const contagens = await response.json();
        
        // Convert array to object for easier lookup
        contagemDiaria = {};
        contagens.forEach(item => {
            contagemDiaria[item.data] = item.contagem_pets;
        });
    } catch (error) {
        console.error('Erro ao buscar contagem diária:', error);
    }
}

async function createAgendamento(data) {
    try {
        showLoading();
        const response = await fetch('/api/agendamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar agendamento');
        }
        
        const newAgendamento = await response.json();
        agendamentos.push(newAgendamento);
        
        // Refresh data and calendar
        await fetchContagemDiaria();
        renderCalendar();
        hideModal();
        
        alert('Agendamento criado com sucesso!');
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        alert(`Erro ao criar agendamento: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Calendar functions
function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function getAgendamentosForDate(date) {
    const dateStr = formatDate(date);
    return agendamentos.filter(agendamento => {
        // Normalizar todas as datas para meia-noite para evitar problemas de timezone
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const inicio = new Date(agendamento.data_inicio + 'T00:00:00');
        const fim = new Date(agendamento.data_fim + 'T00:00:00');
        
        // Normalizar datas de início e fim para meia-noite
        const inicioNormalized = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
        const fimNormalized = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
        
        return targetDate >= inicioNormalized && targetDate <= fimNormalized;
    });
}

function getOccupancyClass(count) {
    if (count === 0) return '';
    if (count >= 5) return 'occupancy-danger';
    if (count === 4) return 'occupancy-warning';
    return 'occupancy-normal';
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // Update month/year display
    currentMonthElement.textContent = formatMonthYear(currentDate);
    
    // Clear calendar
    calendarDays.innerHTML = '';
    
    // Get calendar data
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const date = new Date(year, month - 1, dayNum);
        const dayElement = createDayElement(date, dayNum, true);
        calendarDays.appendChild(dayElement);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dayElement = createDayElement(date, day, false, isToday);
        calendarDays.appendChild(dayElement);
    }
    
    // Next month days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
    
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        const dayElement = createDayElement(date, day, true);
        calendarDays.appendChild(dayElement);
    }
}

function createDayElement(date, dayNum, isOtherMonth = false, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    // Get pets for this date
    const petsForDate = getAgendamentosForDate(date);
    const dateStr = formatDate(date);
    const petCount = contagemDiaria[dateStr] || 0;
    
    // Add occupancy class
    if (!isOtherMonth && !isToday) {
        const occupancyClass = getOccupancyClass(petCount);
        if (occupancyClass) {
            dayElement.classList.add(occupancyClass);
        }
    }
    
    // Add click handler for day details
    if (!isOtherMonth) {
        dayElement.addEventListener('click', () => showDayDetails(date));
        dayElement.style.cursor = 'pointer';
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = dayNum;
    dayElement.appendChild(dayNumber);
    
    // Pet count badge
    if (petCount > 0) {
        const petCountElement = document.createElement('div');
        petCountElement.className = 'pet-count';
        petCountElement.textContent = petCount;
        dayElement.appendChild(petCountElement);
    }
    
    // Pets list
    const petsContainer = document.createElement('div');
    petsContainer.className = 'day-pets';
    
    // Show up to 3 pets, then show "..." if more
    const visiblePets = petsForDate.slice(0, 3);
    visiblePets.forEach(agendamento => {
        const petElement = document.createElement('div');
        petElement.className = 'pet-item';
        petElement.textContent = agendamento.nome_pet;
        petsContainer.appendChild(petElement);
    });
    
    if (petsForDate.length > 3) {
        const moreElement = document.createElement('div');
        moreElement.className = 'pet-item';
        moreElement.textContent = `+${petsForDate.length - 3} mais`;
        moreElement.style.fontStyle = 'italic';
        petsContainer.appendChild(moreElement);
    }
    
    dayElement.appendChild(petsContainer);
    
    return dayElement;
}

// Event handlers
function handlePrevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function handleNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Get raw date values and ensure they're in YYYY-MM-DD format
    let dataInicio = formData.get('dataInicio');
    let dataFim = formData.get('dataFim');
    
    // Convert dates to YYYY-MM-DD format if needed
    if (dataInicio && !dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const inicioDate = new Date(dataInicio);
        dataInicio = formatDate(inicioDate);
    }
    
    if (dataFim && !dataFim.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const fimDate = new Date(dataFim);
        dataFim = formatDate(fimDate);
    }
    
    const data = {
        nome_pet: formData.get('nomePet'),
        data_inicio: dataInicio,
        data_fim: dataFim,
        valor_por_dia: parseFloat(formData.get('valorPorDia')) || 0.00,
        observacoes: formData.get('observacoes') || ''
    };
    
    // Validation
    if (!data.nome_pet || !data.data_inicio || !data.data_fim) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const inicio = new Date(data.data_inicio);
    const fim = new Date(data.data_fim);
    
    if (inicio > fim) {
        alert('A data de início deve ser anterior à data de fim.');
        return;
    }
    
    createAgendamento(data);
}

// Event listeners
prevMonthBtn.addEventListener('click', handlePrevMonth);
nextMonthBtn.addEventListener('click', handleNextMonth);
addClientBtn.addEventListener('click', showModal);
closeModalBtn.addEventListener('click', hideModal);
cancelBtn.addEventListener('click', hideModal);
agendamentoForm.addEventListener('submit', handleFormSubmit);

// Close modal when clicking outside
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        hideModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
        hideModal();
    }
});

// Initialize app
async function initApp() {
    try {
        showLoading();
        await Promise.all([
            fetchAgendamentos(),
            fetchContagemDiaria()
        ]);
        renderCalendar();
    } catch (error) {
        console.error('Erro ao inicializar aplicativo:', error);
        alert('Erro ao carregar dados. Recarregue a página.');
    } finally {
        hideLoading();
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);


// Additional DOM elements for new modals
const dayDetailsModal = document.getElementById('dayDetailsModal');
const closeDayDetailsModalBtn = document.getElementById('closeDayDetailsModal');
const dayDetailsTitle = document.getElementById('dayDetailsTitle');
const dayDetailsDate = document.getElementById('dayDetailsDate');
const dayDetailsPetCount = document.getElementById('dayDetailsPetCount');
const dayDetailsPetsList = document.getElementById('dayDetailsPetsList');

const editModal = document.getElementById('editModal');
const closeEditModalBtn = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editAgendamentoForm = document.getElementById('editAgendamentoForm');
const deleteAgendamentoBtn = document.getElementById('deleteAgendamentoBtn');

// Modal management functions
function showDayDetailsModal() {
    dayDetailsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideDayDetailsModal() {
    dayDetailsModal.classList.remove('active');
    document.body.style.overflow = '';
}

function showEditModal() {
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideEditModal() {
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    editAgendamentoForm.reset();
}

// API functions for new features
async function fetchAgendamentosPorData(data) {
    try {
        const response = await fetch(`/api/agendamentos/data/${data}`);
        if (!response.ok) throw new Error('Erro ao buscar agendamentos da data');
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar agendamentos da data:', error);
        return [];
    }
}

async function updateAgendamento(id, data) {
    try {
        showLoading();
        const response = await fetch(`/api/agendamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar agendamento');
        }
        
        const updatedAgendamento = await response.json();
        
        // Update local data
        const index = agendamentos.findIndex(a => a.id === id);
        if (index !== -1) {
            agendamentos[index] = updatedAgendamento;
        }
        
        // Refresh data and calendar
        await fetchContagemDiaria();
        renderCalendar();
        hideEditModal();
        
        alert('Agendamento atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        alert(`Erro ao atualizar agendamento: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function deleteAgendamento(id) {
    try {
        showLoading();
        const response = await fetch(`/api/agendamentos/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir agendamento');
        }
        
        // Remove from local data
        agendamentos = agendamentos.filter(a => a.id !== id);
        
        // Refresh data and calendar
        await fetchContagemDiaria();
        renderCalendar();
        hideEditModal();
        hideDayDetailsModal();
        
        alert('Agendamento excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        alert(`Erro ao excluir agendamento: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Day details functions
async function showDayDetails(date) {
    const dateStr = formatDate(date);
    const agendamentosData = await fetchAgendamentosPorData(dateStr);
    const petCount = contagemDiaria[dateStr] || 0;
    
    // Format date for display
    const dateFormatted = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    dayDetailsTitle.textContent = 'Detalhes do Dia';
    dayDetailsDate.textContent = dateFormatted;
    dayDetailsPetCount.textContent = `${petCount} ${petCount === 1 ? 'pet' : 'pets'}`;
    
    // Populate pets list
    dayDetailsPetsList.innerHTML = '';
    
    if (agendamentosData.length === 0) {
        dayDetailsPetsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h4>Nenhum pet agendado</h4>
                <p>Não há pets hospedados neste dia.</p>
            </div>
        `;
    } else {
        agendamentosData.forEach(agendamento => {
            const petCard = createPetCard(agendamento);
            dayDetailsPetsList.appendChild(petCard);
        });
    }
    
    showDayDetailsModal();
}

function createPetCard(agendamento) {
    const card = document.createElement('div');
    card.className = 'pet-card';
    
    const dataInicio = new Date(agendamento.data_inicio).toLocaleDateString('pt-BR');
    const dataFim = new Date(agendamento.data_fim).toLocaleDateString('pt-BR');
    
    card.innerHTML = `
        <div class="pet-card-header">
            <div class="pet-name">
                <i class="fas fa-paw"></i>
                ${agendamento.nome_pet}
            </div>
            <div class="pet-actions">
                <button class="btn-icon btn-edit" onclick="editAgendamento(${agendamento.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="confirmDeleteAgendamento(${agendamento.id})" title="Excluir">
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
        <div class="pet-status">${agendamento.status}</div>
    `;
    
    return card;
}

// Edit functions
function editAgendamento(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    if (!agendamento) {
        alert('Agendamento não encontrado');
        return;
    }
    
    // Populate edit form
    document.getElementById('editAgendamentoId').value = agendamento.id;
    document.getElementById('editNomePet').value = agendamento.nome_pet;
    document.getElementById('editDataInicio').value = agendamento.data_inicio;
    document.getElementById('editDataFim').value = agendamento.data_fim;
    document.getElementById('editValorPorDia').value = agendamento.valor_por_dia || 0.00;
    document.getElementById('editObservacoes').value = agendamento.observacoes || '';
    
    hideDayDetailsModal();
    showEditModal();
}

function confirmDeleteAgendamento(id) {
    const agendamento = agendamentos.find(a => a.id === id);
    if (!agendamento) {
        alert('Agendamento não encontrado');
        return;
    }
    
    const confirmMessage = `Tem certeza que deseja excluir completamente a estadia de ${agendamento.nome_pet}?\n\nEsta ação não pode ser desfeita.`;
    
    if (confirm(confirmMessage)) {
        deleteAgendamento(id);
    }
}

// Event handlers for new modals
function handleEditFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const id = parseInt(document.getElementById('editAgendamentoId').value);
    
    // Get raw date values and ensure they're in YYYY-MM-DD format
    let dataInicio = formData.get('dataInicio');
    let dataFim = formData.get('dataFim');
    
    // Convert dates to YYYY-MM-DD format if needed
    if (dataInicio && !dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const inicioDate = new Date(dataInicio);
        dataInicio = formatDate(inicioDate);
    }
    
    if (dataFim && !dataFim.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const fimDate = new Date(dataFim);
        dataFim = formatDate(fimDate);
    }
    
    const data = {
        nome_pet: formData.get('nomePet'),
        data_inicio: dataInicio,
        data_fim: dataFim,
        valor_por_dia: parseFloat(formData.get('valorPorDia')) || 0.00,
        observacoes: formData.get('observacoes') || ''
    };
    
    // Validation
    if (!data.nome_pet || !data.data_inicio || !data.data_fim) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const inicio = new Date(data.data_inicio);
    const fim = new Date(data.data_fim);
    
    if (inicio > fim) {
        alert('A data de início deve ser anterior à data de fim.');
        return;
    }
    
    updateAgendamento(id, data);
}

// Update createDayElement to add click handler
function createDayElement(date, dayNum, isOtherMonth = false, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    // Get pets for this date
    const petsForDate = getAgendamentosForDate(date);
    const dateStr = formatDate(date);
    const petCount = contagemDiaria[dateStr] || 0;
    
    // Add occupancy class
    if (!isOtherMonth && !isToday) {
        const occupancyClass = getOccupancyClass(petCount);
        if (occupancyClass) {
            dayElement.classList.add(occupancyClass);
        }
    }
    
    // Add click handler for day details
    if (!isOtherMonth) {
        dayElement.addEventListener('click', () => showDayDetails(date));
        dayElement.style.cursor = 'pointer';
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = dayNum;
    dayElement.appendChild(dayNumber);
    
    // Pet count badge
    if (petCount > 0) {
        const petCountElement = document.createElement('div');
        petCountElement.className = 'pet-count';
        petCountElement.textContent = petCount;
        dayElement.appendChild(petCountElement);
    }
    
    // Pets list
    const petsContainer = document.createElement('div');
    petsContainer.className = 'day-pets';
    
    // Show up to 3 pets, then show "..." if more
    const visiblePets = petsForDate.slice(0, 3);
    visiblePets.forEach(agendamento => {
        const petElement = document.createElement('div');
        petElement.className = 'pet-item';
        petElement.textContent = agendamento.nome_pet;
        petsContainer.appendChild(petElement);
    });
    
    if (petsForDate.length > 3) {
        const moreElement = document.createElement('div');
        moreElement.className = 'pet-item';
        moreElement.textContent = `+${petsForDate.length - 3} mais`;
        moreElement.style.fontStyle = 'italic';
        petsContainer.appendChild(moreElement);
    }
    
    dayElement.appendChild(petsContainer);
    
    return dayElement;
}

// Additional event listeners
closeDayDetailsModalBtn.addEventListener('click', hideDayDetailsModal);
closeEditModalBtn.addEventListener('click', hideEditModal);
cancelEditBtn.addEventListener('click', hideEditModal);
editAgendamentoForm.addEventListener('submit', handleEditFormSubmit);

deleteAgendamentoBtn.addEventListener('click', () => {
    const id = parseInt(document.getElementById('editAgendamentoId').value);
    confirmDeleteAgendamento(id);
});

// Close modals when clicking outside
dayDetailsModal.addEventListener('click', (event) => {
    if (event.target === dayDetailsModal) {
        hideDayDetailsModal();
    }
});

editModal.addEventListener('click', (event) => {
    if (event.target === editModal) {
        hideEditModal();
    }
});

// Update keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (dayDetailsModal.classList.contains('active')) {
            hideDayDetailsModal();
        } else if (editModal.classList.contains('active')) {
            hideEditModal();
        } else if (modalOverlay.classList.contains('active')) {
            hideModal();
        }
    }
});


// Dashboard Financial Variables
let receitaMensalChart = null;
let topPetsChart = null;
let currentView = 'calendar';

// Dashboard DOM Elements
const calendarViewBtn = document.getElementById('calendarViewBtn');
const dashboardViewBtn = document.getElementById('dashboardViewBtn');
const dashboardSection = document.getElementById('dashboardSection');
const mainContent = document.querySelector('.main-content');

// Dashboard Functions
function showCalendarView() {
    currentView = 'calendar';
    mainContent.style.display = 'block';
    dashboardSection.style.display = 'none';
    calendarViewBtn.classList.add('active');
    dashboardViewBtn.classList.remove('active');
}

function showDashboardView() {
    currentView = 'dashboard';
    mainContent.style.display = 'none';
    dashboardSection.style.display = 'block';
    calendarViewBtn.classList.remove('active');
    dashboardViewBtn.classList.add('active');
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        showLoading();
        
        // Load financial summary
        const resumoResponse = await fetch('/api/financeiro/resumo');
        const resumo = await resumoResponse.json();
        
        // Load monthly revenue
        const mensalResponse = await fetch('/api/financeiro/por-mes');
        const dadosMensais = await mensalResponse.json();
        
        // Load top pets
        const petsResponse = await fetch('/api/financeiro/top-pets');
        const topPets = await petsResponse.json();
        
        // Update summary cards
        updateSummaryCards(resumo);
        
        // Update charts
        updateMonthlyChart(dadosMensais);
        updateTopPetsChart(topPets);
        
        // Update details table
        updateDetailsTable(dadosMensais);
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        alert('Erro ao carregar dados financeiros');
    } finally {
        hideLoading();
    }
}

function updateSummaryCards(resumo) {
    document.getElementById('receitaTotal').textContent = `€${resumo.receita_total.toFixed(2)}`;
    document.getElementById('totalAgendamentos').textContent = resumo.total_agendamentos;
    document.getElementById('totalDias').textContent = resumo.total_dias_hospedagem;
    document.getElementById('valorMedio').textContent = `€${resumo.valor_medio_por_dia.toFixed(2)}`;
}

function updateMonthlyChart(dadosMensais) {
    const ctx = document.getElementById('receitaMensalChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (receitaMensalChart) {
        receitaMensalChart.destroy();
    }
    
    const labels = dadosMensais.map(item => item.mes);
    const data = dadosMensais.map(item => item.receita);
    
    receitaMensalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Receita (€)',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toFixed(0);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            }
        }
    });
}

function updateTopPetsChart(topPets) {
    const ctx = document.getElementById('topPetsChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (topPetsChart) {
        topPetsChart.destroy();
    }
    
    // Take top 5 pets
    const top5Pets = topPets.slice(0, 5);
    const labels = top5Pets.map(pet => pet.nome_pet);
    const data = top5Pets.map(pet => pet.receita_total);
    
    // Generate colors
    const colors = [
        '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'
    ];
    
    topPetsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: €${value.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function updateDetailsTable(dadosMensais) {
    const tbody = document.getElementById('detalhesTableBody');
    tbody.innerHTML = '';
    
    dadosMensais.forEach(item => {
        const row = document.createElement('tr');
        const mediaPorDia = item.dias_hospedagem > 0 ? item.receita / item.dias_hospedagem : 0;
        
        row.innerHTML = `
            <td>${item.mes}</td>
            <td class="currency">€${item.receita.toFixed(2)}</td>
            <td>${item.total_agendamentos}</td>
            <td>${item.dias_hospedagem}</td>
            <td class="currency">€${mediaPorDia.toFixed(2)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Event Listeners for Dashboard
calendarViewBtn.addEventListener('click', showCalendarView);
dashboardViewBtn.addEventListener('click', showDashboardView);

// Initialize with calendar view
document.addEventListener('DOMContentLoaded', () => {
    showCalendarView();
});

