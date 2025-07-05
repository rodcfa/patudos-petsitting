import { calculateReceitaTotal } from '../lib/supabase.js'

// Calcular resumo financeiro
export function calculateResumoFinanceiro(agendamentos) {
  let receita_total = 0
  let total_dias_hospedagem = 0
  
  agendamentos.forEach(agendamento => {
    const inicio = new Date(agendamento.data_inicio)
    const fim = new Date(agendamento.data_fim)
    const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1
    const receita = (agendamento.valor_por_dia || 0) * dias
    receita_total += receita
    total_dias_hospedagem += dias
  })
  
  const valor_medio_por_dia = total_dias_hospedagem > 0 ? receita_total / total_dias_hospedagem : 0
  
  return {
    receita_total: Math.round(receita_total * 100) / 100,
    total_agendamentos: agendamentos.length,
    total_dias_hospedagem,
    valor_medio_por_dia: Math.round(valor_medio_por_dia * 100) / 100
  }
}

// Calcular receita por mês
export function calculateReceitaPorMes(agendamentos) {
  const receitaPorMes = {}
  
  agendamentos.forEach(agendamento => {
    const dataInicio = new Date(agendamento.data_inicio)
    const dataFim = new Date(agendamento.data_fim)
    
    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
      const mesAno = d.toISOString().slice(0, 7) // YYYY-MM
      const mes = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      
      if (!receitaPorMes[mesAno]) {
        receitaPorMes[mesAno] = {
          mes: mes,
          mes_ano: mesAno,
          receita: 0,
          dias_hospedagem: 0,
          agendamentos: new Set()
        }
      }
      
      receitaPorMes[mesAno].receita += (agendamento.valor_por_dia || 0)
      receitaPorMes[mesAno].dias_hospedagem += 1
      receitaPorMes[mesAno].agendamentos.add(agendamento.id)
    }
  })
  
  return Object.values(receitaPorMes).map(item => ({
    mes: item.mes,
    mes_ano: item.mes_ano,
    receita: Math.round(item.receita * 100) / 100,
    dias_hospedagem: item.dias_hospedagem,
    total_agendamentos: item.agendamentos.size
  })).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano))
}

// Calcular top pets por receita
export function calculateTopPets(agendamentos) {
  const petsReceita = {}
  
  agendamentos.forEach(agendamento => {
    const nome_pet = agendamento.nome_pet
    const inicio = new Date(agendamento.data_inicio)
    const fim = new Date(agendamento.data_fim)
    const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1
    const receita = (agendamento.valor_por_dia || 0) * dias
    
    if (!petsReceita[nome_pet]) {
      petsReceita[nome_pet] = {
        nome_pet: nome_pet,
        receita_total: 0,
        total_agendamentos: 0,
        total_dias: 0
      }
    }
    
    petsReceita[nome_pet].receita_total += receita
    petsReceita[nome_pet].total_agendamentos += 1
    petsReceita[nome_pet].total_dias += dias
  })
  
  return Object.values(petsReceita)
    .map(pet => ({
      ...pet,
      receita_total: Math.round(pet.receita_total * 100) / 100
    }))
    .sort((a, b) => b.receita_total - a.receita_total)
}