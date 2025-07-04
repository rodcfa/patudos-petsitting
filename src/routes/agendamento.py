from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from src.models.agendamento import db, Agendamento, ContagemDiaria

agendamento_bp = Blueprint('agendamento', __name__)

def atualizar_contagem_diaria():
    """Recalcula a contagem diária de pets para todas as datas"""
    # Limpa a tabela de contagem diária
    ContagemDiaria.query.delete()
    
    # Busca todos os agendamentos
    agendamentos = Agendamento.query.all()
    
    # Dicionário para contar pets por data
    contagem_por_data = {}
    
    for agendamento in agendamentos:
        # Itera por cada dia do agendamento
        data_atual = agendamento.data_inicio
        while data_atual <= agendamento.data_fim:
            if data_atual not in contagem_por_data:
                contagem_por_data[data_atual] = 0
            contagem_por_data[data_atual] += 1
            data_atual += timedelta(days=1)
    
    # Salva as contagens no banco
    for data, contagem in contagem_por_data.items():
        nova_contagem = ContagemDiaria(data=data, contagem_pets=contagem)
        db.session.add(nova_contagem)
    
    db.session.commit()

@agendamento_bp.route('/agendamentos', methods=['GET'])
def listar_agendamentos():
    """Lista todos os agendamentos"""
    agendamentos = Agendamento.query.all()
    return jsonify([agendamento.to_dict() for agendamento in agendamentos])

@agendamento_bp.route('/agendamentos', methods=['POST'])
def criar_agendamento():
    """Cria um novo agendamento"""
    try:
        data = request.get_json()
        
        # Validação básica
        if not data.get('nome_pet') or not data.get('data_inicio') or not data.get('data_fim'):
            return jsonify({'error': 'Campos obrigatórios: nome_pet, data_inicio, data_fim'}), 400
        
        # Converte strings de data para objetos date
        data_inicio = datetime.strptime(data['data_inicio'], '%Y-%m-%d').date()
        data_fim = datetime.strptime(data['data_fim'], '%Y-%m-%d').date()
        
        # Validação de datas
        if data_inicio > data_fim:
            return jsonify({'error': 'Data de início deve ser anterior à data de fim'}), 400
        
        # Cria o agendamento
        agendamento = Agendamento(
            nome_pet=data['nome_pet'],
            data_inicio=data_inicio,
            data_fim=data_fim,
            valor_por_dia=data.get('valor_por_dia', 0.00),
            observacoes=data.get('observacoes', ''),
            status=data.get('status', 'Confirmado')
        )
        
        db.session.add(agendamento)
        db.session.commit()
        
        # Atualiza a contagem diária
        atualizar_contagem_diaria()
        
        return jsonify(agendamento.to_dict()), 201
        
    except ValueError as e:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@agendamento_bp.route('/agendamentos/<int:agendamento_id>', methods=['PUT'])
def atualizar_agendamento(agendamento_id):
    """Atualiza um agendamento existente"""
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        data = request.get_json()
        
        # Atualiza os campos se fornecidos
        if 'nome_pet' in data:
            agendamento.nome_pet = data['nome_pet']
        if 'data_inicio' in data:
            agendamento.data_inicio = datetime.strptime(data['data_inicio'], '%Y-%m-%d').date()
        if 'data_fim' in data:
            agendamento.data_fim = datetime.strptime(data['data_fim'], '%Y-%m-%d').date()
        if 'valor_por_dia' in data:
            agendamento.valor_por_dia = data['valor_por_dia']
        if 'observacoes' in data:
            agendamento.observacoes = data['observacoes']
        if 'status' in data:
            agendamento.status = data['status']
        
        # Validação de datas
        if agendamento.data_inicio > agendamento.data_fim:
            return jsonify({'error': 'Data de início deve ser anterior à data de fim'}), 400
        
        db.session.commit()
        
        # Atualiza a contagem diária
        atualizar_contagem_diaria()
        
        return jsonify(agendamento.to_dict())
        
    except ValueError as e:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agendamento_bp.route('/agendamentos/<int:agendamento_id>', methods=['DELETE'])
def deletar_agendamento(agendamento_id):
    """Deleta um agendamento"""
    try:
        agendamento = Agendamento.query.get_or_404(agendamento_id)
        db.session.delete(agendamento)
        db.session.commit()
        
        # Atualiza a contagem diária
        atualizar_contagem_diaria()
        
        return jsonify({'message': 'Agendamento deletado com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agendamento_bp.route('/contagem-diaria', methods=['GET'])
def obter_contagem_diaria():
    """Obtém a contagem diária de pets"""
    contagens = ContagemDiaria.query.all()
    return jsonify([contagem.to_dict() for contagem in contagens])

@agendamento_bp.route('/contagem-diaria/<string:data>', methods=['GET'])
def obter_contagem_por_data(data):
    """Obtém a contagem de pets para uma data específica"""
    try:
        data_obj = datetime.strptime(data, '%Y-%m-%d').date()
        contagem = ContagemDiaria.query.filter_by(data=data_obj).first()
        
        if contagem:
            return jsonify(contagem.to_dict())
        else:
            return jsonify({'data': data, 'contagem_pets': 0})
            
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400


@agendamento_bp.route('/agendamentos/data/<string:data>', methods=['GET'])
def obter_agendamentos_por_data(data):
    """Obtém todos os agendamentos para uma data específica"""
    try:
        data_obj = datetime.strptime(data, '%Y-%m-%d').date()
        
        # Busca agendamentos que incluem esta data
        agendamentos = Agendamento.query.filter(
            Agendamento.data_inicio <= data_obj,
            Agendamento.data_fim >= data_obj
        ).all()
        
        return jsonify([agendamento.to_dict() for agendamento in agendamentos])
        
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400



# APIs Financeiras
@agendamento_bp.route('/financeiro/resumo', methods=['GET'])
def obter_resumo_financeiro():
    """Obtém resumo financeiro geral"""
    try:
        agendamentos = Agendamento.query.all()
        
        receita_total = 0
        total_agendamentos = len(agendamentos)
        total_dias_hospedagem = 0
        
        for agendamento in agendamentos:
            receita_total += agendamento.calcular_receita_total()
            if agendamento.data_inicio and agendamento.data_fim:
                total_dias_hospedagem += (agendamento.data_fim - agendamento.data_inicio).days + 1
        
        valor_medio_por_dia = receita_total / total_dias_hospedagem if total_dias_hospedagem > 0 else 0
        
        return jsonify({
            'receita_total': round(receita_total, 2),
            'total_agendamentos': total_agendamentos,
            'total_dias_hospedagem': total_dias_hospedagem,
            'valor_medio_por_dia': round(valor_medio_por_dia, 2)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamento_bp.route('/financeiro/por-mes', methods=['GET'])
def obter_receita_por_mes():
    """Obtém receita agrupada por mês"""
    try:
        agendamentos = Agendamento.query.all()
        receita_por_mes = {}
        
        for agendamento in agendamentos:
            if agendamento.data_inicio and agendamento.data_fim and agendamento.valor_por_dia:
                # Itera por cada dia do agendamento
                data_atual = agendamento.data_inicio
                while data_atual <= agendamento.data_fim:
                    mes_ano = data_atual.strftime('%Y-%m')
                    
                    if mes_ano not in receita_por_mes:
                        receita_por_mes[mes_ano] = {
                            'mes': data_atual.strftime('%B %Y'),
                            'receita': 0,
                            'dias': 0,
                            'agendamentos': set()
                        }
                    
                    receita_por_mes[mes_ano]['receita'] += float(agendamento.valor_por_dia)
                    receita_por_mes[mes_ano]['dias'] += 1
                    receita_por_mes[mes_ano]['agendamentos'].add(agendamento.id)
                    
                    data_atual += timedelta(days=1)
        
        # Converte sets para contagem
        resultado = []
        for mes_ano, dados in sorted(receita_por_mes.items()):
            resultado.append({
                'mes': dados['mes'],
                'mes_ano': mes_ano,
                'receita': round(dados['receita'], 2),
                'dias_hospedagem': dados['dias'],
                'total_agendamentos': len(dados['agendamentos'])
            })
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamento_bp.route('/financeiro/por-periodo', methods=['GET'])
def obter_receita_por_periodo():
    """Obtém receita para um período específico"""
    try:
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        if not data_inicio or not data_fim:
            return jsonify({'error': 'Parâmetros data_inicio e data_fim são obrigatórios'}), 400
        
        data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
        data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d').date()
        
        # Busca agendamentos que se sobrepõem com o período
        agendamentos = Agendamento.query.filter(
            Agendamento.data_inicio <= data_fim_obj,
            Agendamento.data_fim >= data_inicio_obj
        ).all()
        
        receita_total = 0
        dias_no_periodo = 0
        agendamentos_detalhes = []
        
        for agendamento in agendamentos:
            # Calcula apenas os dias que estão dentro do período solicitado
            inicio_periodo = max(agendamento.data_inicio, data_inicio_obj)
            fim_periodo = min(agendamento.data_fim, data_fim_obj)
            
            dias_agendamento = (fim_periodo - inicio_periodo).days + 1
            receita_agendamento = float(agendamento.valor_por_dia or 0) * dias_agendamento
            
            receita_total += receita_agendamento
            dias_no_periodo += dias_agendamento
            
            agendamentos_detalhes.append({
                'id': agendamento.id,
                'nome_pet': agendamento.nome_pet,
                'data_inicio': agendamento.data_inicio.isoformat(),
                'data_fim': agendamento.data_fim.isoformat(),
                'valor_por_dia': float(agendamento.valor_por_dia or 0),
                'dias_no_periodo': dias_agendamento,
                'receita_no_periodo': round(receita_agendamento, 2)
            })
        
        return jsonify({
            'periodo': {
                'data_inicio': data_inicio,
                'data_fim': data_fim
            },
            'receita_total': round(receita_total, 2),
            'dias_hospedagem': dias_no_periodo,
            'total_agendamentos': len(agendamentos),
            'agendamentos': agendamentos_detalhes
        })
        
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agendamento_bp.route('/financeiro/top-pets', methods=['GET'])
def obter_top_pets():
    """Obtém os pets que mais geraram receita"""
    try:
        agendamentos = Agendamento.query.all()
        pets_receita = {}
        
        for agendamento in agendamentos:
            nome_pet = agendamento.nome_pet
            receita = agendamento.calcular_receita_total()
            
            if nome_pet not in pets_receita:
                pets_receita[nome_pet] = {
                    'nome_pet': nome_pet,
                    'receita_total': 0,
                    'total_agendamentos': 0,
                    'total_dias': 0
                }
            
            pets_receita[nome_pet]['receita_total'] += receita
            pets_receita[nome_pet]['total_agendamentos'] += 1
            
            if agendamento.data_inicio and agendamento.data_fim:
                dias = (agendamento.data_fim - agendamento.data_inicio).days + 1
                pets_receita[nome_pet]['total_dias'] += dias
        
        # Ordena por receita total
        resultado = sorted(pets_receita.values(), key=lambda x: x['receita_total'], reverse=True)
        
        # Arredonda valores
        for pet in resultado:
            pet['receita_total'] = round(pet['receita_total'], 2)
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

