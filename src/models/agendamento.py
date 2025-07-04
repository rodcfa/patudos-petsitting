from src.models.user import db
from datetime import datetime

class Agendamento(db.Model):
    __tablename__ = 'agendamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_pet = db.Column(db.String(100), nullable=False)
    data_inicio = db.Column(db.Date, nullable=False)
    data_fim = db.Column(db.Date, nullable=False)
    valor_por_dia = db.Column(db.Numeric(10, 2), nullable=True, default=0.00)  # Valor em Euros
    observacoes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='Confirmado')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Agendamento {self.nome_pet} - {self.data_inicio} a {self.data_fim}>'

    def calcular_receita_total(self):
        """Calcula a receita total do agendamento"""
        if self.data_inicio and self.data_fim and self.valor_por_dia:
            dias = (self.data_fim - self.data_inicio).days + 1
            return float(self.valor_por_dia) * dias
        return 0.0

    def to_dict(self):
        return {
            'id': self.id,
            'nome_pet': self.nome_pet,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_fim': self.data_fim.isoformat() if self.data_fim else None,
            'valor_por_dia': float(self.valor_por_dia) if self.valor_por_dia else 0.0,
            'observacoes': self.observacoes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'receita_total': self.calcular_receita_total()
        }

class ContagemDiaria(db.Model):
    __tablename__ = 'contagem_diaria'
    
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.Date, unique=True, nullable=False)
    contagem_pets = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<ContagemDiaria {self.data} - {self.contagem_pets} pets>'

    def to_dict(self):
        return {
            'id': self.id,
            'data': self.data.isoformat() if self.data else None,
            'contagem_pets': self.contagem_pets
        }

