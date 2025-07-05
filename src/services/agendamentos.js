import { supabase, calculateReceitaTotal, testSupabaseConnection } from '../lib/supabase.js'

// Buscar todos os agendamentos
export async function fetchAgendamentos() {
  try {
    console.log('🔄 Buscando agendamentos...')
    
    // Testar conexão primeiro
    await testSupabaseConnection()
    
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos:', error)
      throw error
    }
    
    console.log(`✅ ${data.length} agendamentos carregados com sucesso`)
    
    // Adicionar receita_total calculada
    return data.map(agendamento => ({
      ...agendamento,
      receita_total: calculateReceitaTotal(agendamento)
    }))
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos:', error)
    
    // Verificar se é erro de conexão ou de dados
    if (error.message.includes('relation "agendamentos" does not exist')) {
      throw new Error('Tabela "agendamentos" não existe. Execute as migrações do Supabase.')
    } else if (error.message.includes('Invalid API key')) {
      throw new Error('Chave da API do Supabase inválida. Verifique suas credenciais.')
    } else if (error.message.includes('fetch')) {
      throw new Error('Erro de conexão com Supabase. Verifique sua internet e URL.')
    }
    
    throw new Error(`Erro ao carregar agendamentos: ${error.message}`)
  }
}

// Criar novo agendamento
export async function createAgendamento(agendamentoData) {
  try {
    console.log('🔄 Criando novo agendamento:', agendamentoData)
    
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([agendamentoData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erro ao criar agendamento:', error)
      throw error
    }
    
    console.log('✅ Agendamento criado com sucesso:', data)
    
    return {
      ...data,
      receita_total: calculateReceitaTotal(data)
    }
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error)
    throw new Error(`Erro ao criar agendamento: ${error.message}`)
  }
}

// Atualizar agendamento
export async function updateAgendamento(id, agendamentoData) {
  try {
    console.log('🔄 Atualizando agendamento:', id, agendamentoData)
    
    const { data, error } = await supabase
      .from('agendamentos')
      .update(agendamentoData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erro ao atualizar agendamento:', error)
      throw error
    }
    
    console.log('✅ Agendamento atualizado com sucesso:', data)
    
    return {
      ...data,
      receita_total: calculateReceitaTotal(data)
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error)
    throw new Error(`Erro ao atualizar agendamento: ${error.message}`)
  }
}

// Deletar agendamento
export async function deleteAgendamento(id) {
  try {
    console.log('🔄 Deletando agendamento:', id)
    
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Erro ao deletar agendamento:', error)
      throw error
    }
    
    console.log('✅ Agendamento deletado com sucesso')
    
    return true
  } catch (error) {
    console.error('❌ Erro ao deletar agendamento:', error)
    throw new Error(`Erro ao deletar agendamento: ${error.message}`)
  }
}

// Buscar agendamentos por data
export async function fetchAgendamentosPorData(data) {
  try {
    console.log('🔄 Buscando agendamentos para data:', data)
    
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('*')
      .lte('data_inicio', data)
      .gte('data_fim', data)
      .order('nome_pet')
    
    if (error) {
      console.error('❌ Erro ao buscar agendamentos por data:', error)
      throw error
    }
    
    console.log(`✅ ${agendamentos.length} agendamentos encontrados para ${data}`)
    
    return agendamentos.map(agendamento => ({
      ...agendamento,
      receita_total: calculateReceitaTotal(agendamento)
    }))
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos por data:', error)
    return []
  }
}