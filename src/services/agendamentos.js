import { supabase, calculateReceitaTotal } from '../lib/supabase.js'

// Buscar todos os agendamentos
export async function fetchAgendamentos() {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Adicionar receita_total calculada
    return data.map(agendamento => ({
      ...agendamento,
      receita_total: calculateReceitaTotal(agendamento)
    }))
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
    throw new Error('Erro ao carregar agendamentos')
  }
}

// Criar novo agendamento
export async function createAgendamento(agendamentoData) {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([agendamentoData])
      .select()
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      receita_total: calculateReceitaTotal(data)
    }
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)
    throw new Error('Erro ao criar agendamento')
  }
}

// Atualizar agendamento
export async function updateAgendamento(id, agendamentoData) {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .update(agendamentoData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      receita_total: calculateReceitaTotal(data)
    }
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error)
    throw new Error('Erro ao atualizar agendamento')
  }
}

// Deletar agendamento
export async function deleteAgendamento(id) {
  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error)
    throw new Error('Erro ao deletar agendamento')
  }
}

// Buscar agendamentos por data
export async function fetchAgendamentosPorData(data) {
  try {
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('*')
      .lte('data_inicio', data)
      .gte('data_fim', data)
      .order('nome_pet')
    
    if (error) throw error
    
    return agendamentos.map(agendamento => ({
      ...agendamento,
      receita_total: calculateReceitaTotal(agendamento)
    }))
  } catch (error) {
    console.error('Erro ao buscar agendamentos por data:', error)
    return []
  }
}