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

// LocalStorage keys
const STORAGE_KEYS = {
    AGENDAMENTOS: 'patudos_agendamentos',
    CONTAGEM_DIARIA: 'patudos_contagem_diaria'
};

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

// LocalStorage functions
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

function loadFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return defaultValue;
    }
}

// Data functions
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function calculateDays(dataInicio, dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function calculateReceitaTotal(agendamento) {
    if (agendamento.data_inicio && agendamento.data_fim && agendamento.valor_por_dia) {
        const dias = calculateDays(agendamento.data_inicio, agendamento.data_fim);
        return parseFloat(agendamento.valor_por_dia) * dias;
    }
    return 0.0;
}

function updateContagemDiaria() {
    const contagem = {};
    
    agendamentos.forEach(agendamento => {
        const dataInicio = new Date(agendamento.data_inicio);
        const dataFim = new Date(agendamento.data_fim);
        
        for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d);
            contagem[dateStr] = (contagem[dateStr] || 0) + 1;
        }
    });
    
    contagemDiaria = contagem;
    saveToStorage(STORAGE_KEYS.CONTAGEM_DIARIA, contagem);
}

// API simulation functions
async function fetchAgendamentos() {
    try {
        agendamentos = loadFromStorage(STORAGE_KEYS.AGENDAMENTOS, []);
        
        // Add sample data if empty
        if (agendamentos.length === 0) {
            const sampleData = [
                {
                    id: generateId(),
                    nome_pet: "Bolinha",
                    data_inicio: "2025-07-10",
                    data_fim: "2025-07-15",
                    valor_por_dia: 25.0,
                    observacoes: "Cachorro muito dócil, gosta de brincar no jardim.",
                    status: "Confirmado",
                    created_at: new Date().toISOString()
                },
                {
                    id: generateId(),
                    nome_pet: "Rex",
                    data_inicio: "2025-07-12",
                    data_fim: "2025-07-18",
                    valor_por_dia: 30.0,
                    observacoes: "Precisa de medicação às 8h e 20h. Muito carinhoso.",
                    status: "Confirmado",
                    created_at: new Date().toISOString()
                },
                {
                    id: generateId(),
                    nome_pet: "Luna",
                    data_inicio: "2025-07-12",
                    data_fim: "2025-07-14",
                    valor_por_dia: 35.0,
                    observacoes: "Gata independente, apenas alimentação e carinho.",
                    status: "Confirmado",
                    created_at: new Date().toISOString()
                },
                {
                    id: generateId(),
                    nome_pet: "Max",
                    data_inicio: "2025-07-13",
                    data_fim: "2025-07-13",
                    valor_por_dia: 40.0,
                    observacoes: "Apenas um dia, cachorro muito ativo.",
                    status: "Confirmado",
                    created_at: new Date().toISOString()
                }
            ];
            
            agendamentos = sampleData;
            saveToStorage(STORAGE_KEYS.AGENDAMENTOS, agendamentos);
        }
        
        // Add receita_total to each agendamento
        agendamentos = agendamentos.map(agendamento => ({
            ...agendamento,
            receita_total: calculateReceitaTotal(agendamento)
        }));
        
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        alert('Erro ao carregar agendamentos. Tente novamente.');
    }
}

async function fetchContagemDiaria() {
    try {
        contagemDiaria = loadFromStorage(STORAGE_KEYS.CONTAGEM_DIARIA, {});
        updateContagemDiaria();
    } catch (error) {
        console.error('Erro ao buscar contagem diária:', error);
    }
}

async function createAgendamento(data) {
    try {
        showLoading();
        
        const newAgendamento = {
            id: generateId(),
            ...data,
            status: data.status || 'Confirmado',
            created_at: new Date().toISOString(),
            receita_total: calculateReceitaTotal(data)
        };
        
        agendamentos.push(newAgendamento);
        saveToStorage(STORAGE_KEYS.AGENDAMENTOS, agendamentos);
        
        updateContagemDiaria();
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

async function updateAgendamento(id, data) {
    try {
        showLoading();
        
        const index = agendamentos.findIndex(a => a.id === id);
        if (index === -1) {
            throw new Error('Agendamento não encontrado');
        }
        
        agendamentos[index] = {
            ...agendamentos[index],
            ...data,
            receita_total: calculateReceitaTotal({ ...agendamentos[index], ...data })
        };
        
        saveToStorage(STORAGE_KEYS.AGENDAMENTOS, agendamentos);
        updateContagemDiaria();
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
        
        agendamentos = agendamentos.filter(a => a.id !== id);
        saveToStorage(STORAGE_KEYS.AGENDAMENTOS, agendamentos);
        
        updateContagemDiaria();
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

async function fetchAgendamentosPorData(data) {
    try {
        const targetDate = new Date(data + 'T00:00:00');
        return agendamentos.filter(agendamento => {
            const inicio = new Date(agendamento.data_inicio + 'T00:00:00');
            const fim = new Date(agendamento.data_fim + 'T00:00:00');
            return targetDate >= inicio && targetDate <= fim;
        });
    } catch (error) {
        console.error('Erro ao buscar agendamentos da data:', error);
        return [];
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
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return agendamentos.filter(agendamento => {
        const inicio = new Date(agendamento.data_inicio + 'T00:00:00');
        const fim = new Date(agendamento.data_fim + 'T00:00:00');
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
                <button class="btn-icon btn-edit" onclick="editAgendamento('${agendamento.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="confirmDeleteAgendamento('${agendamento.id}')" title="Excluir">
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
    const id = document.getElementById('editAgendamentoId').value;
    
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

// Additional event listeners
closeDayDetailsModalBtn.addEventListener('click', hideDayDetailsModal);
closeEditModalBtn.addEventListener('click', hideEditModal);
cancelEditBtn.addEventListener('click', hideEditModal);
editAgendamentoForm.addEventListener('submit', handleEditFormSubmit);

deleteAgendamentoBtn.addEventListener('click', () => {
    const id = document.getElementById('editAgendamentoId').value;
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
        
        // Calculate financial summary
        const resumo = calculateResumoFinanceiro();
        
        // Calculate monthly revenue
        const dadosMensais = calculateReceitaPorMes();
        
        // Calculate top pets
        const topPets = calculateTopPets();
        
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

function calculateResumoFinanceiro() {
    let receita_total = 0;
    let total_dias_hospedagem = 0;
    
    agendamentos.forEach(agendamento => {
        const dias = calculateDays(agendamento.data_inicio, agendamento.data_fim);
        const receita = (agendamento.valor_por_dia || 0) * dias;
        receita_total += receita;
        total_dias_hospedagem += dias;
    });
    
    const valor_medio_por_dia = total_dias_hospedagem > 0 ? receita_total / total_dias_hospedagem : 0;
    
    return {
        receita_total: Math.round(receita_total * 100) / 100,
        total_agendamentos: agendamentos.length,
        total_dias_hospedagem,
        valor_medio_por_dia: Math.round(valor_medio_por_dia * 100) / 100
    };
}

function calculateReceitaPorMes() {
    const receitaPorMes = {};
    
    agendamentos.forEach(agendamento => {
        const dataInicio = new Date(agendamento.data_inicio);
        const dataFim = new Date(agendamento.data_fim);
        
        for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
            const mesAno = d.toISOString().slice(0, 7); // YYYY-MM
            const mes = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            if (!receitaPorMes[mesAno]) {
                receitaPorMes[mesAno] = {
                    mes: mes,
                    mes_ano: mesAno,
                    receita: 0,
                    dias_hospedagem: 0,
                    agendamentos: new Set()
                };
            }
            
            receitaPorMes[mesAno].receita += (agendamento.valor_por_dia || 0);
            receitaPorMes[mesAno].dias_hospedagem += 1;
            receitaPorMes[mesAno].agendamentos.add(agendamento.id);
        }
    });
    
    return Object.values(receitaPorMes).map(item => ({
        mes: item.mes,
        mes_ano: item.mes_ano,
        receita: Math.round(item.receita * 100) / 100,
        dias_hospedagem: item.dias_hospedagem,
        total_agendamentos: item.agendamentos.size
    })).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
}

function calculateTopPets() {
    const petsReceita = {};
    
    agendamentos.forEach(agendamento => {
        const nome_pet = agendamento.nome_pet;
        const dias = calculateDays(agendamento.data_inicio, agendamento.data_fim);
        const receita = (agendamento.valor_por_dia || 0) * dias;
        
        if (!petsReceita[nome_pet]) {
            petsReceita[nome_pet] = {
                nome_pet: nome_pet,
                receita_total: 0,
                total_agendamentos: 0,
                total_dias: 0
            };
        }
        
        petsReceita[nome_pet].receita_total += receita;
        petsReceita[nome_pet].total_agendamentos += 1;
        petsReceita[nome_pet].total_dias += dias;
    });
    
    return Object.values(petsReceita)
        .map(pet => ({
            ...pet,
            receita_total: Math.round(pet.receita_total * 100) / 100
        }))
        .sort((a, b) => b.receita_total - a.receita_total);
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

// Make functions global for onclick handlers
window.editAgendamento = editAgendamento;
window.confirmDeleteAgendamento = confirmDeleteAgendamento;