import os
from flask import Flask, send_from_directory
from src.models.user import db
from src.routes.user import user_bp
from src.models.agendamento import Agendamento, ContagemDiaria
from src.routes.agendamento import agendamento_bp
from flask_cors import CORS

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuração do banco de dados
database_url = os.environ.get('DATABASE_URL')

if database_url:
    # Produção - PostgreSQL
    # Corrigir URL do PostgreSQL se necessário (Heroku usa postgres://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    print(f"✅ Usando PostgreSQL em produção")
else:
    # Desenvolvimento - SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    print(f"⚠️ Usando SQLite em desenvolvimento")

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
        try:
            # Criar tabelas
            db.create_all()
            print("✅ Tabelas criadas com sucesso!")
            
            # Adicionar dados de exemplo apenas em desenvolvimento
            if not database_url:  # SQLite = desenvolvimento
                existing = Agendamento.query.first()
                if not existing:
                    print("📝 Adicionando dados de exemplo...")
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
                    print("✅ Dados de exemplo adicionados!")
                    
        except Exception as e:
            print(f"❌ Erro ao configurar banco: {e}")
    
    # Configuração de porta para produção
    port = int(os.environ.get('PORT', 5000))
    debug_mode = not database_url  # Debug apenas em desenvolvimento
    
    print(f"🚀 Iniciando servidor na porta {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
