import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Verificando variáveis de ambiente do Supabase:')
console.log('URL:', supabaseUrl ? '✅ Definida' : '❌ Não encontrada')
console.log('Anon Key:', supabaseAnonKey ? '✅ Definida' : '❌ Não encontrada')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Verifique se o arquivo .env contém:')
  console.log('VITE_SUPABASE_URL=sua_url_aqui')
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave_aqui')
  throw new Error('Variáveis de ambiente do Supabase não encontradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Testar conexão com Supabase
export async function testSupabaseConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...')
    
    // Testar se conseguimos fazer uma query simples
    const { data, error } = await supabase
      .from('agendamentos')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Erro na conexão com Supabase:', error)
      throw error
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    console.log(`📊 Total de registros na tabela agendamentos: ${data || 0}`)
    return true
  } catch (error) {
    console.error('❌ Falha ao conectar com Supabase:', error.message)
    throw new Error(`Erro de conexão: ${error.message}`)
  }
}

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