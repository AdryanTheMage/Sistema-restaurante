-- =====================================================================
-- SCRIPT SQL - SISTEMA AVANÇADO DE RESERVAS DE RESTAURANTE (QUESTÃO 09)
-- Compatível com PostgreSQL / MySQL
-- =====================================================================

-- 1. Criação das tabelas principais

-- Tabela de Mesas (Regra 1: Número da mesa único)
CREATE TABLE mesa (
    id SERIAL PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    capacidade INT NOT NULL CHECK (capacidade > 0),
    localizacao VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupada', 'manutencao'))
);

-- Tabela de Clientes (Regra 8: Bloqueio por no-shows)
CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    quantidade_no_show INT NOT NULL DEFAULT 0 CHECK (quantidade_no_show >= 0),
    bloqueado_ate TIMESTAMP DEFAULT NULL
);

-- Tabela de Reservas (Regra 2, 3, 4, 11: Validações de data, hora, capacidade, manutenção)
CREATE TABLE reserva (
    id SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_mesa INT NOT NULL,
    quantidade_pessoas INT NOT NULL CHECK (quantidade_pessoas > 0),
    data_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (
        status IN ('Pendente', 'Confirmada', 'Em Atendimento', 'Finalizada', 'Cancelada', 'No Show')
    ),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (id_mesa) REFERENCES mesa(id) ON DELETE CASCADE
);

-- Tabela de Lista de Espera (Regra 9: Sem mesas, registrar na fila)
CREATE TABLE lista_espera (
    id SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    data_desejada DATE NOT NULL,
    hora_desejada TIME NOT NULL,
    quantidade_pessoas INT NOT NULL CHECK (quantidade_pessoas > 0),
    posicao INT NOT NULL CHECK (posicao > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente' CHECK (
        status IN ('Pendente', 'Atendido', 'Cancelado')
    ),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE
);

-- Tabela de Histórico/Auditoria (Regra 12: Logs de alteração)
CREATE TABLE historico_auditoria (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    categoria VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    detalhes TEXT
);


-- =====================================================================
-- 2. Gatilhos (Triggers) e Validações de Banco de Dados (PostgreSQL)
-- =====================================================================

-- Trigger A: Validar limites de capacidade (Regra 4) e mesa em manutenção (Regra 11)
CREATE OR REPLACE FUNCTION fn_validar_reserva_detalhes()
RETURNS TRIGGER AS $$
DECLARE
    v_capacidade INT;
    v_status_mesa VARCHAR(50);
    v_bloqueado TIMESTAMP;
BEGIN
    -- Obter detalhes da mesa
    SELECT capacidade, status INTO v_capacidade, v_status_mesa FROM mesa WHERE id = NEW.id_mesa;
    
    -- Regra 11: Mesa em manutenção não pode ser reservada
    IF v_status_mesa = 'manutencao' THEN
        RAISE EXCEPTION 'A mesa selecionada está em manutenção e não pode ser reservada.';
    END IF;

    -- Regra 4: Quantidade de pessoas não ultrapassa capacidade
    IF NEW.quantidade_pessoas > v_capacidade THEN
        RAISE EXCEPTION 'A quantidade de pessoas (%) ultrapassa a capacidade máxima da mesa (%).', 
            NEW.quantidade_pessoas, v_capacidade;
    END IF;

    -- Regra 8: Verificar se cliente está bloqueado por no-shows
    SELECT bloqueado_ate INTO v_bloqueado FROM cliente WHERE id = NEW.id_cliente;
    IF v_bloqueado IS NOT NULL AND v_bloqueado > CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Cliente bloqueado de realizar novas reservas até % devido a no-shows.', v_bloqueado;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_validar_reserva_detalhes
BEFORE INSERT OR UPDATE ON reserva
FOR EACH ROW EXECUTE FUNCTION fn_validar_reserva_detalhes();


-- Trigger B: Prevenir conflitos de horário na mesma mesa (Regra 3)
CREATE OR REPLACE FUNCTION fn_prevenir_conflito_mesa()
RETURNS TRIGGER AS $$
DECLARE
    v_conflito INT;
BEGIN
    SELECT COUNT(*) INTO v_conflito
    FROM reserva
    WHERE id_mesa = NEW.id_mesa
      AND data_reserva = NEW.data_reserva
      AND status IN ('Pendente', 'Confirmada', 'Em Atendimento')
      AND id <> COALESCE(NEW.id, 0) -- ignora a própria reserva em caso de update
      AND (NEW.hora_inicio < hora_fim AND NEW.hora_fim > hora_inicio);

    IF v_conflito > 0 THEN
        RAISE EXCEPTION 'Conflito de reserva detectado. A mesa já está reservada ou ocupada nesse intervalo de horário.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_prevenir_conflito_mesa
BEFORE INSERT OR UPDATE ON reserva
FOR EACH ROW EXECUTE FUNCTION fn_prevenir_conflito_mesa();


-- Trigger C: Registrar auditoria de alterações (Regra 12)
CREATE OR REPLACE FUNCTION fn_auditar_reservas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO historico_auditoria (categoria, descricao, detalhes)
        VALUES ('RESERVA', 'Criada reserva #' || NEW.id || ' para mesa ' || NEW.id_mesa, ROW_TO_JSON(NEW)::TEXT);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO historico_auditoria (categoria, descricao, detalhes)
        VALUES ('RESERVA', 'Atualizada reserva #' || NEW.id || ' de status ' || OLD.status || ' para ' || NEW.status, ROW_TO_JSON(NEW)::TEXT);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_auditar_reservas
AFTER INSERT OR UPDATE ON reserva
FOR EACH ROW EXECUTE FUNCTION fn_auditar_reservas();


-- Trigger D: Tratar No Show e Bloqueio Automático de Clientes (Regra 7, 8)
CREATE OR REPLACE FUNCTION fn_processar_noshow()
RETURNS TRIGGER AS $$
DECLARE
    v_noshows INT;
BEGIN
    -- Se o status mudou para 'No Show'
    IF NEW.status = 'No Show' AND OLD.status <> 'No Show' THEN
        -- Incrementar contador do cliente
        UPDATE cliente 
        SET quantidade_no_show = quantidade_no_show + 1 
        WHERE id = NEW.id_cliente;

        -- Obter nova contagem
        SELECT quantidade_no_show INTO v_noshows FROM cliente WHERE id = NEW.id_cliente;

        -- Se atingir 3 no-shows, bloqueia por 7 dias e reseta contador
        IF v_noshows >= 3 THEN
            UPDATE cliente 
            SET bloqueado_ate = CURRENT_TIMESTAMP + INTERVAL '7 days',
                quantidade_no_show = 0
            WHERE id = NEW.id_cliente;
            
            INSERT INTO historico_auditoria (categoria, descricao)
            VALUES ('BLOQUEIO', 'Cliente ID ' || NEW.id_cliente || ' foi bloqueado por 7 dias por atingir 3 no-shows.');
        ELSE
            INSERT INTO historico_auditoria (categoria, descricao)
            VALUES ('NO-SHOW', 'Registrado No Show para cliente ID ' || NEW.id_cliente || '. Total atual: ' || v_noshows || '/3');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_processar_noshow
AFTER UPDATE ON reserva
FOR EACH ROW EXECUTE FUNCTION fn_processar_noshow();


-- =====================================================================
-- 3. Carga Inicial de Dados (Seed / DML)
-- =====================================================================

-- Cadastrando mesas
INSERT INTO mesa (numero, capacidade, localizacao, status) VALUES
(10, 2, 'Salão Principal', 'disponivel'),
(11, 2, 'Terraço', 'disponivel'),
(12, 4, 'Salão Principal', 'disponivel'),
(13, 4, 'Salão Principal', 'disponivel'),
(14, 6, 'Área VIP', 'disponivel'),
(15, 8, 'Área VIP', 'disponivel'),
(16, 10, 'Jardim Interno', 'manutencao'),
(17, 4, 'Terraço', 'disponivel');

-- Cadastrando clientes
INSERT INTO cliente (nome, telefone, email, quantidade_no_show, bloqueado_ate) VALUES
('Adryan Branco', '(11) 98765-4321', 'adryan@email.com', 0, NULL),
('Ana Silva', '(21) 99999-8888', 'ana@email.com', 2, NULL),
('Carlos Souza', '(31) 98888-7777', 'carlos@email.com', 3, CURRENT_TIMESTAMP + INTERVAL '3 days'),
('Maria Santos', '(11) 97777-6666', 'maria@email.com', 0, NULL),
('João Pereira', '(11) 96666-5555', 'joao@email.com', 1, NULL);

-- Cadastrando reservas (Data atual)
INSERT INTO reserva (id_cliente, id_mesa, quantidade_pessoas, data_reserva, hora_inicio, hora_fim, status) VALUES
(1, 3, 3, CURRENT_DATE, '19:00', '21:00', 'Confirmada'),
(2, 4, 4, CURRENT_DATE, '20:00', '22:00', 'Em Atendimento'),
(4, 1, 2, CURRENT_DATE, '12:00', '14:00', 'Finalizada'),
(5, 5, 5, CURRENT_DATE, '16:00', '18:00', 'No Show');

-- Cadastrando lista de espera (Data atual)
INSERT INTO lista_espera (id_cliente, data_desejada, hora_desejada, quantidade_pessoas, posicao, status) VALUES
(5, CURRENT_DATE, '20:30', 2, 1, 'Pendente'),
(1, CURRENT_DATE, '21:00', 4, 2, 'Pendente');


-- =====================================================================
-- 4. Consulta de Desafio Obrigatório - Sugestão de Menor Mesa Disponível
-- =====================================================================
-- Parâmetros da consulta:
-- :quantidade_pessoas = 3
-- :data_reserva = CURRENT_DATE
-- :hora_inicio = '20:00:00'
-- :hora_fim = '22:00:00' (Padrão 2h)

SELECT *
FROM mesa m
WHERE m.capacidade >= 3 -- Regra 4: capacidade suficiente
  AND m.status <> 'manutencao' -- Regra 11: não estar em manutenção
  AND m.id NOT IN (
      -- Regra 3: Subconsulta para retirar mesas com reservas conflitantes
      SELECT r.id_mesa
      FROM reserva r
      WHERE r.data_reserva = CURRENT_DATE
        AND r.status IN ('Pendente', 'Confirmada', 'Em Atendimento')
        AND (r.hora_inicio < '22:00:00'::TIME AND r.hora_fim > '20:00:00'::TIME)
  )
ORDER BY m.capacidade ASC, m.numero ASC -- Desafio: Menor capacidade disponível primeiro, depois número da mesa
LIMIT 1; -- Retorna apenas a melhor sugestão única
