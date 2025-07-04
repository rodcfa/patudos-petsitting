import os
from flask import Flask, send_from_directory
from src.models.user import db
from src.routes.user import user_bp
from src.models.agendamento import Agendamento, ContagemDiaria
from src.routes.agendamento import agendamento_bp
from flask_cors import CORS

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuração do banco de dados
if os.environ.get('DATABASE_URL'):
    # Produção - PostgreSQL
    database_url = os.environ.get('DATABASE_URL')
    # Corrigir URL do PostgreSQL se necessário
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Desenvolvimento - SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurar CORS
CORS(app)

# Inicializar banco
db.init_app(app)

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(agendamento_bp, url_prefix='/api')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Adicionar dados de exemplo apenas em desenvolvimento
        if not os.environ.get('DATABASE_URL'):
            # Verificar se já existem agendamentos
            existing = Agendamento.query.first()
            if not existing:
                # Criar agendamentos de exemplo
                from datetime import datetime
                
                agendamentos_exemplo = [
                    Agendamento(
                        nome_pet="Bolinha",
                        data_inicio=datetime(2025, 7, 10).date(),
                        data_fim=datetime(2025, 7, 15).date(),
                        valor_por_dia=25.0,
                        observacoes="Cachorro muito dócil, gosta de brincar no jardim."
                    ),
                    Agendamento(
                        nome_pet="Rex",
                        data_inicio=datetime(2025, 7, 12).date(),
                        data_fim=datetime(2025, 7, 18).date(),
                        valor_por_dia=30.0,
                        observacoes="Precisa de medicação às 8h e 20h. Muito carinhoso."
                    ),
                    Agendamento(
                        nome_pet="Luna",
                        data_inicio=datetime(2025, 7, 12).date(),
                        data_fim=datetime(2025, 7, 14).date(),
                        valor_por_dia=35.0,
                        observacoes="Gata independente, apenas alimentação e carinho."
                    ),
                    Agendamento(
                        nome_pet="Max",
                        data_inicio=datetime(2025, 7, 13).date(),
                        data_fim=datetime(2025, 7, 13).date(),
                        valor_por_dia=40.0,
                        observacoes="Apenas um dia, cachorro muito ativo."
                    )
                ]
                
                for agendamento in agendamentos_exemplo:
                    db.session.add(agendamento)
                
                db.session.commit()
    
    # Configuração de porta para produção
    port = int(os.environ.get('PORT', 5000))
    debug_mode = not os.environ.get('DATABASE_URL')  # Debug apenas em desenvolvimento
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)

