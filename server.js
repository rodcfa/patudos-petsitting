const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database setup
const db = new sqlite3.Database('./database.db');

// Initialize database tables
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL
    )`);

    // Agendamentos table
    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_pet TEXT NOT NULL,
        data_inicio DATE NOT NULL,
        data_fim DATE NOT NULL,
        valor_por_dia DECIMAL(10, 2) DEFAULT 0.00,
        observacoes TEXT,
        status TEXT DEFAULT 'Confirmado',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Contagem diaria table
    db.run(`CREATE TABLE IF NOT EXISTS contagem_diaria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data DATE UNIQUE NOT NULL,
        contagem_pets INTEGER DEFAULT 0
    )`);

    // Insert sample data
    db.get("SELECT COUNT(*) as count FROM agendamentos", (err, row) => {
        if (err) {
            console.error('Error checking agendamentos:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('📝 Adicionando dados de exemplo...');
            
            const agendamentos = [
                ['Bolinha', '2025-07-10', '2025-07-15', 25.0, 'Cachorro muito dócil, gosta de brincar no jardim.'],
                ['Rex', '2025-07-12', '2025-07-18', 30.0, 'Precisa de medicação às 8h e 20h. Muito carinhoso.'],
                ['Luna', '2025-07-12', '2025-07-14', 35.0, 'Gata independente, apenas alimentação e carinho.'],
                ['Max', '2025-07-13', '2025-07-13', 40.0, 'Apenas um dia, cachorro muito ativo.']
            ];

            const stmt = db.prepare(`INSERT INTO agendamentos (nome_pet, data_inicio, data_fim, valor_por_dia, observacoes) VALUES (?, ?, ?, ?, ?)`);
            
            agendamentos.forEach(agendamento => {
                stmt.run(agendamento);
            });
            
            stmt.finalize(() => {
                console.log('✅ Dados de exemplo adicionados!');
                updateContagemDiaria();
            });
        } else {
            updateContagemDiaria();
        }
    });
});

// Helper function to update daily count
function updateContagemDiaria() {
    // Clear existing counts
    db.run("DELETE FROM contagem_diaria", (err) => {
        if (err) {
            console.error('Error clearing contagem_diaria:', err);
            return;
        }

        // Get all agendamentos and calculate daily counts
        db.all("SELECT * FROM agendamentos", (err, agendamentos) => {
            if (err) {
                console.error('Error fetching agendamentos:', err);
                return;
            }

            const contagemPorData = {};

            agendamentos.forEach(agendamento => {
                const dataInicio = new Date(agendamento.data_inicio);
                const dataFim = new Date(agendamento.data_fim);
                
                for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    contagemPorData[dateStr] = (contagemPorData[dateStr] || 0) + 1;
                }
            });

            // Insert new counts
            const stmt = db.prepare("INSERT INTO contagem_diaria (data, contagem_pets) VALUES (?, ?)");
            
            Object.entries(contagemPorData).forEach(([data, contagem]) => {
                stmt.run([data, contagem]);
            });
            
            stmt.finalize();
        });
    });
}

// Helper function to calculate days between dates
function calculateDays(dataInicio, dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// API Routes - MUST come before static file serving

// User routes
app.get('/api/users', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/users', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { username, email } = req.body;
    
    db.run("INSERT INTO users (username, email) VALUES (?, ?)", [username, email], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json(row);
        });
    });
});

// Agendamentos routes
app.get('/api/agendamentos', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM agendamentos ORDER BY data_inicio", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const agendamentos = rows.map(row => ({
            ...row,
            receita_total: (row.valor_por_dia || 0) * calculateDays(row.data_inicio, row.data_fim)
        }));
        
        res.json(agendamentos);
    });
});

app.post('/api/agendamentos', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { nome_pet, data_inicio, data_fim, valor_por_dia, observacoes, status } = req.body;
    
    if (!nome_pet || !data_inicio || !data_fim) {
        res.status(400).json({ error: 'Campos obrigatórios: nome_pet, data_inicio, data_fim' });
        return;
    }
    
    if (new Date(data_inicio) > new Date(data_fim)) {
        res.status(400).json({ error: 'Data de início deve ser anterior à data de fim' });
        return;
    }
    
    db.run(
        "INSERT INTO agendamentos (nome_pet, data_inicio, data_fim, valor_por_dia, observacoes, status) VALUES (?, ?, ?, ?, ?, ?)",
        [nome_pet, data_inicio, data_fim, valor_por_dia || 0.00, observacoes || '', status || 'Confirmado'],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            db.get("SELECT * FROM agendamentos WHERE id = ?", [this.lastID], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                updateContagemDiaria();
                
                const agendamento = {
                    ...row,
                    receita_total: (row.valor_por_dia || 0) * calculateDays(row.data_inicio, row.data_fim)
                };
                
                res.status(201).json(agendamento);
            });
        }
    );
});

app.put('/api/agendamentos/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { id } = req.params;
    const { nome_pet, data_inicio, data_fim, valor_por_dia, observacoes, status } = req.body;
    
    if (data_inicio && data_fim && new Date(data_inicio) > new Date(data_fim)) {
        res.status(400).json({ error: 'Data de início deve ser anterior à data de fim' });
        return;
    }
    
    db.run(
        "UPDATE agendamentos SET nome_pet = ?, data_inicio = ?, data_fim = ?, valor_por_dia = ?, observacoes = ?, status = ? WHERE id = ?",
        [nome_pet, data_inicio, data_fim, valor_por_dia, observacoes, status, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (this.changes === 0) {
                res.status(404).json({ error: 'Agendamento não encontrado' });
                return;
            }
            
            db.get("SELECT * FROM agendamentos WHERE id = ?", [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                updateContagemDiaria();
                
                const agendamento = {
                    ...row,
                    receita_total: (row.valor_por_dia || 0) * calculateDays(row.data_inicio, row.data_fim)
                };
                
                res.json(agendamento);
            });
        }
    );
});

app.delete('/api/agendamentos/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { id } = req.params;
    
    db.run("DELETE FROM agendamentos WHERE id = ?", [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Agendamento não encontrado' });
            return;
        }
        
        updateContagemDiaria();
        res.json({ message: 'Agendamento deletado com sucesso' });
    });
});

app.get('/api/contagem-diaria', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM contagem_diaria ORDER BY data", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/contagem-diaria/:data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { data } = req.params;
    
    db.get("SELECT * FROM contagem_diaria WHERE data = ?", [data], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (row) {
            res.json(row);
        } else {
            res.json({ data: data, contagem_pets: 0 });
        }
    });
});

app.get('/api/agendamentos/data/:data', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const { data } = req.params;
    
    db.all(
        "SELECT * FROM agendamentos WHERE ? BETWEEN data_inicio AND data_fim ORDER BY nome_pet",
        [data],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const agendamentos = rows.map(row => ({
                ...row,
                receita_total: (row.valor_por_dia || 0) * calculateDays(row.data_inicio, row.data_fim)
            }));
            
            res.json(agendamentos);
        }
    );
});

// Financial routes
app.get('/api/financeiro/resumo', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM agendamentos", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        let receita_total = 0;
        let total_dias_hospedagem = 0;
        
        rows.forEach(agendamento => {
            const dias = calculateDays(agendamento.data_inicio, agendamento.data_fim);
            const receita = (agendamento.valor_por_dia || 0) * dias;
            receita_total += receita;
            total_dias_hospedagem += dias;
        });
        
        const valor_medio_por_dia = total_dias_hospedagem > 0 ? receita_total / total_dias_hospedagem : 0;
        
        res.json({
            receita_total: Math.round(receita_total * 100) / 100,
            total_agendamentos: rows.length,
            total_dias_hospedagem,
            valor_medio_por_dia: Math.round(valor_medio_por_dia * 100) / 100
        });
    });
});

app.get('/api/financeiro/por-mes', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM agendamentos", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const receitaPorMes = {};
        
        rows.forEach(agendamento => {
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
        
        const resultado = Object.values(receitaPorMes).map(item => ({
            mes: item.mes,
            mes_ano: item.mes_ano,
            receita: Math.round(item.receita * 100) / 100,
            dias_hospedagem: item.dias_hospedagem,
            total_agendamentos: item.agendamentos.size
        })).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
        
        res.json(resultado);
    });
});

app.get('/api/financeiro/top-pets', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    db.all("SELECT * FROM agendamentos", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const petsReceita = {};
        
        rows.forEach(agendamento => {
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
        
        const resultado = Object.values(petsReceita)
            .map(pet => ({
                ...pet,
                receita_total: Math.round(pet.receita_total * 100) / 100
            }))
            .sort((a, b) => b.receita_total - a.receita_total);
        
        res.json(resultado);
    });
});

// Static files - MUST come after API routes
app.use(express.static(path.join(__dirname, 'src', 'static')));

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'src', 'static', 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`✅ Aplicação disponível em http://localhost:${PORT}`);
});