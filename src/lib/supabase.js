import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para calcular receita total de um agendamento
export function calculateReceitaTotal(agendamento) {
  if (agendamento.data_inicio && agendamento.data_fim && agendamento.valor_por_dia) {
    const inicio = new Date(agendamento.data_inicio)
    const fim = new Date(agendamento.data_fim)
    const dias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)) + 1
    return parseFloat(agendamento.valor_por_dia) * dias
  }
  return 0.0
}

// Função para calcular contagem diária
export function calculateContagemDiaria(agendamentos) {
  const contagem = {}
  
  agendamentos.forEach(agendamento => {
    const dataInicio = new Date(agendamento.data_inicio)
    const dataFim = new Date(agendamento.data_fim)
    
    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      contagem[dateStr] = (contagem[dateStr] || 0) + 1
    }
  })
  
  return contagem
}