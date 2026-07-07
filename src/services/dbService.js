// GourmetReserve Database and Business Rules Engine (Local Storage Database Service)

const STORAGE_KEYS = {
  MESAS: 'gourmet_mesas',
  CLIENTES: 'gourmet_clientes',
  RESERVAS: 'gourmet_reservas',
  LISTA_ESPERA: 'gourmet_lista_espera',
  LOGS: 'gourmet_logs'
};

// HELPER FUNCTIONS FOR LOCALSTORAGE
const memoryStorage = {};

const getStorageItem = (key, defaultValue) => {
  if (typeof localStorage === 'undefined') {
    return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : defaultValue;
  }
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorageItem = (key, value) => {
  if (typeof localStorage === 'undefined') {
    memoryStorage[key] = JSON.stringify(value);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
};

const hasStorageItem = (key) => {
  if (typeof localStorage === 'undefined') {
    return !!memoryStorage[key];
  }
  return !!localStorage.getItem(key);
};

// INITIAL SEED DATA
const seedDatabase = () => {
  if (!hasStorageItem(STORAGE_KEYS.MESAS)) {
    const defaultMesas = [
      { id: 1, numero: 10, capacidade: 2, localizacao: 'Salão Principal', status: 'disponivel' },
      { id: 2, numero: 11, capacidade: 2, localizacao: 'Terraço', status: 'disponivel' },
      { id: 3, numero: 12, capacidade: 4, localizacao: 'Salão Principal', status: 'disponivel' },
      { id: 4, numero: 13, capacidade: 4, localizacao: 'Salão Principal', status: 'disponivel' },
      { id: 5, numero: 14, capacidade: 6, localizacao: 'Área VIP', status: 'disponivel' },
      { id: 6, numero: 15, capacidade: 8, localizacao: 'Área VIP', status: 'disponivel' },
      { id: 7, numero: 16, capacidade: 10, localizacao: 'Jardim Interno', status: 'manutencao' },
      { id: 8, numero: 17, capacidade: 4, localizacao: 'Terraço', status: 'disponivel' }
    ];
    setStorageItem(STORAGE_KEYS.MESAS, defaultMesas);
  }

  if (!hasStorageItem(STORAGE_KEYS.CLIENTES)) {
    // Blocks for 3 days in the past or future to simulate
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const defaultClientes = [
      { id: 1, nome: 'Adryan Branco', telefone: '(11) 98765-4321', email: 'adryan@email.com', quantidade_no_show: 0, bloqueado_ate: null },
      { id: 2, nome: 'Ana Silva', telefone: '(21) 99999-8888', email: 'ana@email.com', quantidade_no_show: 2, bloqueado_ate: null },
      { id: 3, nome: 'Carlos Souza', telefone: '(31) 98888-7777', email: 'carlos@email.com', quantidade_no_show: 3, bloqueado_ate: threeDaysLater.toISOString() },
      { id: 4, nome: 'Maria Santos', telefone: '(11) 97777-6666', email: 'maria@email.com', quantidade_no_show: 0, bloqueado_ate: null },
      { id: 5, nome: 'João Pereira', telefone: '(11) 96666-5555', email: 'joao@email.com', quantidade_no_show: 1, bloqueado_ate: null }
    ];
    setStorageItem(STORAGE_KEYS.CLIENTES, defaultClientes);
  }

  // Get current date string for seed reservations
  const today = new Date().toISOString().split('T')[0];

  if (!hasStorageItem(STORAGE_KEYS.RESERVAS)) {
    const defaultReservas = [
      {
        id: 1,
        id_cliente: 1,
        id_mesa: 3,
        quantidade_pessoas: 3,
        data_reserva: today,
        hora_inicio: '19:00',
        hora_fim: '21:00',
        status: 'Confirmada'
      },
      {
        id: 2,
        id_cliente: 2,
        id_mesa: 4,
        quantidade_pessoas: 4,
        data_reserva: today,
        hora_inicio: '20:00',
        hora_fim: '22:00',
        status: 'Em Atendimento'
      },
      {
        id: 3,
        id_cliente: 4,
        id_mesa: 1,
        quantidade_pessoas: 2,
        data_reserva: today,
        hora_inicio: '12:00',
        hora_fim: '14:00',
        status: 'Finalizada'
      },
      {
        id: 4,
        id_cliente: 5,
        id_mesa: 5,
        quantidade_pessoas: 5,
        data_reserva: today,
        hora_inicio: '16:00',
        hora_fim: '18:00',
        status: 'No Show'
      }
    ];
    setStorageItem(STORAGE_KEYS.RESERVAS, defaultReservas);
  }

  if (!hasStorageItem(STORAGE_KEYS.LISTA_ESPERA)) {
    const defaultListaEspera = [
      {
        id: 1,
        id_cliente: 5,
        data_desejada: today,
        hora_desejada: '20:30',
        quantidade_pessoas: 2,
        posicao: 1,
        status: 'Pendente'
      },
      {
        id: 2,
        id_cliente: 1,
        data_desejada: today,
        hora_desejada: '21:00',
        quantidade_pessoas: 4,
        posicao: 2,
        status: 'Pendente'
      }
    ];
    setStorageItem(STORAGE_KEYS.LISTA_ESPERA, defaultListaEspera);
  }

  if (!hasStorageItem(STORAGE_KEYS.LOGS)) {
    const defaultLogs = [
      { id: 1, timestamp: new Date().toISOString(), event: 'SISTEMA', description: 'Banco de dados semeado com dados padrão de teste.', details: '8 mesas, 5 clientes e 4 reservas iniciais.' }
    ];
    setStorageItem(STORAGE_KEYS.LOGS, defaultLogs);
  }
};

// Initialize DB
seedDatabase();

// TIME HELPERS
// Convert HH:MM to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Add hours/minutes to time string
const addHoursToTime = (timeStr, hoursToAdd) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = (hours + hoursToAdd) * 60 + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
};

// Check if two time ranges overlap
const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};

// DB AUDIT LOGGER
const logEvent = (event, description, details = '') => {
  const logs = getStorageItem(STORAGE_KEYS.LOGS, []);
  const newLog = {
    id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
    timestamp: new Date().toISOString(),
    event,
    description,
    details: typeof details === 'object' ? JSON.stringify(details) : details
  };
  logs.unshift(newLog); // Show newest logs first
  setStorageItem(STORAGE_KEYS.LOGS, logs);
  return newLog;
};

export const dbService = {
  // --- GENERAL LOGS ---
  getLogs: () => getStorageItem(STORAGE_KEYS.LOGS, []),
  clearLogs: () => {
    setStorageItem(STORAGE_KEYS.LOGS, []);
    logEvent('SISTEMA', 'Histórico de logs limpo pelo usuário.');
  },

  // --- CLIENT SERVICE ---
  getClients: () => getStorageItem(STORAGE_KEYS.CLIENTES, []),
  
  getClientById: (id) => {
    const clients = getStorageItem(STORAGE_KEYS.CLIENTES, []);
    return clients.find(c => c.id === parseInt(id));
  },

  createClient: (clientData) => {
    const clients = getStorageItem(STORAGE_KEYS.CLIENTES, []);
    const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    const newClient = {
      id: newId,
      nome: clientData.nome,
      telefone: clientData.telefone,
      email: clientData.email,
      quantidade_no_show: 0,
      bloqueado_ate: null
    };
    clients.push(newClient);
    setStorageItem(STORAGE_KEYS.CLIENTES, clients);
    logEvent('CLIENTE', `Cliente cadastrado: ${newClient.nome}`, newClient);
    return newClient;
  },

  updateClient: (id, clientData) => {
    const clients = getStorageItem(STORAGE_KEYS.CLIENTES, []);
    const idx = clients.findIndex(c => c.id === parseInt(id));
    if (idx === -1) throw new Error('Cliente não encontrado');
    
    const original = clients[idx];
    clients[idx] = {
      ...original,
      nome: clientData.nome ?? original.nome,
      telefone: clientData.telefone ?? original.telefone,
      email: clientData.email ?? original.email,
      quantidade_no_show: clientData.quantidade_no_show ?? original.quantidade_no_show,
      bloqueado_ate: clientData.bloqueado_ate !== undefined ? clientData.bloqueado_ate : original.bloqueado_ate
    };
    setStorageItem(STORAGE_KEYS.CLIENTES, clients);
    logEvent('CLIENTE', `Cliente atualizado: ${clients[idx].nome}`, { original, updated: clients[idx] });
    return clients[idx];
  },

  deleteClient: (id) => {
    const clients = getStorageItem(STORAGE_KEYS.CLIENTES, []);
    const client = clients.find(c => c.id === parseInt(id));
    if (!client) throw new Error('Cliente não encontrado');

    // Check if client has active bookings
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);
    const activeBookings = bookings.filter(b => b.id_cliente === parseInt(id) && ['Pendente', 'Confirmada', 'Em Atendimento'].includes(b.status));
    if (activeBookings.length > 0) {
      throw new Error('Não é possível excluir um cliente com reservas pendentes ou ativas.');
    }

    const filtered = clients.filter(c => c.id !== parseInt(id));
    setStorageItem(STORAGE_KEYS.CLIENTES, filtered);
    logEvent('CLIENTE', `Cliente removido: ${client.nome}`, client);
    return true;
  },

  // Check if client is blocked
  isClientBlocked: (clientId) => {
    const client = dbService.getClientById(clientId);
    if (!client) return false;
    if (!client.bloqueado_ate) return false;
    
    const blockedUntil = new Date(client.bloqueado_ate);
    const now = new Date();
    if (blockedUntil > now) {
      return blockedUntil;
    }
    // Block expired
    return false;
  },

  // --- TABLE SERVICE ---
  getTables: () => getStorageItem(STORAGE_KEYS.MESAS, []),
  
  getTableById: (id) => {
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    return tables.find(t => t.id === parseInt(id));
  },

  createTable: (tableData) => {
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    
    // Rule 1: Unique table number
    const numeroStr = parseInt(tableData.numero);
    const exists = tables.some(t => t.numero === numeroStr);
    if (exists) {
      throw new Error(`A mesa de número ${numeroStr} já existe. Os números das mesas devem ser únicos.`);
    }

    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const newTable = {
      id: newId,
      numero: numeroStr,
      capacidade: parseInt(tableData.capacidade),
      localizacao: tableData.localizacao,
      status: tableData.status || 'disponivel' // disponivel, ocupada, manutencao
    };
    tables.push(newTable);
    setStorageItem(STORAGE_KEYS.MESAS, tables);
    logEvent('MESA', `Mesa número ${newTable.numero} cadastrada.`, newTable);
    return newTable;
  },

  updateTable: (id, tableData) => {
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    const idx = tables.findIndex(t => t.id === parseInt(id));
    if (idx === -1) throw new Error('Mesa não encontrada');

    const original = tables[idx];
    const newNum = tableData.numero !== undefined ? parseInt(tableData.numero) : original.numero;
    
    // Rule 1: Unique table number (excluding self)
    if (newNum !== original.numero) {
      const exists = tables.some(t => t.numero === newNum && t.id !== parseInt(id));
      if (exists) {
        throw new Error(`A mesa de número ${newNum} já está cadastrada. O número deve ser único.`);
      }
    }

    tables[idx] = {
      ...original,
      numero: newNum,
      capacidade: tableData.capacidade !== undefined ? parseInt(tableData.capacidade) : original.capacidade,
      localizacao: tableData.localizacao ?? original.localizacao,
      status: tableData.status ?? original.status
    };
    
    setStorageItem(STORAGE_KEYS.MESAS, tables);
    logEvent('MESA', `Mesa número ${tables[idx].numero} atualizada.`, { original, updated: tables[idx] });
    return tables[idx];
  },

  deleteTable: (id) => {
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    const table = tables.find(t => t.id === parseInt(id));
    if (!table) throw new Error('Mesa não encontrada');

    // Prevent deletion if table has future reservations
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);
    const activeBookings = bookings.filter(b => b.id_mesa === parseInt(id) && ['Pendente', 'Confirmada'].includes(b.status));
    if (activeBookings.length > 0) {
      throw new Error('Não é possível deletar uma mesa com reservas pendentes ou confirmadas ativas.');
    }

    const filtered = tables.filter(t => t.id !== parseInt(id));
    setStorageItem(STORAGE_KEYS.MESAS, filtered);
    logEvent('MESA', `Mesa número ${table.numero} deletada.`, table);
    return true;
  },

  // --- RESERVATION SERVICE ---
  getReservas: () => getStorageItem(STORAGE_KEYS.RESERVAS, []),
  
  getReservaById: (id) => {
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);
    return bookings.find(b => b.id === parseInt(id));
  },

  // Suggesting smallest available table
  suggestTable: (quantidadePessoas, dataReserva, horaInicio, horaFim = null) => {
    const q = parseInt(quantidadePessoas);
    if (!q || q <= 0) return null;
    
    // Rule 2: Default 2-hour reservation duration
    const end = horaFim || addHoursToTime(horaInicio, 2);
    
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);

    // Filter tables:
    // 1. Capacity >= requested guests (Rule 4)
    // 2. Status is NOT maintenance (Rule 11)
    const validTables = tables.filter(t => t.capacidade >= q && t.status !== 'manutencao');

    if (validTables.length === 0) return null;

    // 3. Table does NOT conflict with existing active reservations (Rule 3)
    const availableTables = validTables.filter(t => {
      const tableBookings = bookings.filter(b => 
        b.id_mesa === t.id && 
        b.data_reserva === dataReserva &&
        ['Pendente', 'Confirmada', 'Em Atendimento'].includes(b.status)
      );
      
      const hasConflict = tableBookings.some(b => isOverlapping(horaInicio, end, b.hora_inicio, b.hora_fim));
      return !hasConflict;
    });

    if (availableTables.length === 0) return null;

    // Desafio Obrigatório: Suggest the SMALLEST table that fits the group (Rule 4 - smallest capacity)
    // Sort by capacity (ascending), then by table number (ascending)
    availableTables.sort((a, b) => {
      if (a.capacidade !== b.capacidade) {
        return a.capacidade - b.capacidade;
      }
      return a.numero - b.numero;
    });

    return availableTables[0];
  },

  createReserva: (reservaData) => {
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);
    const clientId = parseInt(reservaData.id_cliente);
    const tableId = parseInt(reservaData.id_mesa);
    const guests = parseInt(reservaData.quantidade_pessoas);
    const date = reservaData.data_reserva;
    const start = reservaData.hora_inicio;
    
    // Rule 2: Default 2-hour reservation
    const end = reservaData.hora_fim || addHoursToTime(start, 2);

    // Rule 8: Check if customer is blocked
    const blockedUntil = dbService.isClientBlocked(clientId);
    if (blockedUntil) {
      const formattedDate = new Date(blockedUntil).toLocaleString('pt-BR');
      throw new Error(`Este cliente está BLOQUEADO de realizar novas reservas até ${formattedDate} devido a acúmulo de No Shows.`);
    }

    const table = dbService.getTableById(tableId);
    if (!table) throw new Error('Mesa não encontrada.');

    // Rule 11: Table in maintenance cannot be reserved
    if (table.status === 'manutencao') {
      throw new Error('A mesa selecionada está em manutenção e não pode ser reservada.');
    }

    // Rule 4: Party size must not exceed table capacity
    if (guests > table.capacidade) {
      throw new Error(`A quantidade de pessoas (${guests}) ultrapassa a capacidade máxima da mesa (${table.capacidade}).`);
    }

    // Rule 3: Conflict detection
    const tableBookings = bookings.filter(b => 
      b.id_mesa === tableId && 
      b.data_reserva === date &&
      ['Pendente', 'Confirmada', 'Em Atendimento'].includes(b.status)
    );
    const hasConflict = tableBookings.some(b => isOverlapping(start, end, b.hora_inicio, b.hora_fim));
    if (hasConflict) {
      throw new Error(`Conflito de reserva detectado. A mesa ${table.numero} já está ocupada ou reservada neste horário.`);
    }

    // Check if client already has another booking overlapping this timeslot
    const clientBookings = bookings.filter(b =>
      b.id_cliente === clientId &&
      b.data_reserva === date &&
      ['Pendente', 'Confirmada', 'Em Atendimento'].includes(b.status)
    );
    const clientConflict = clientBookings.some(b => isOverlapping(start, end, b.hora_inicio, b.hora_fim));
    if (clientConflict) {
      throw new Error(`Este cliente já possui outra reserva confirmada que sobrepõe este horário.`);
    }

    const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    const newReserva = {
      id: newId,
      id_cliente: clientId,
      id_mesa: tableId,
      quantidade_pessoas: guests,
      data_reserva: date,
      hora_inicio: start,
      hora_fim: end,
      status: reservaData.status || 'Pendente' // Pendente, Confirmada, Em Atendimento, Finalizada, Cancelada, No Show
    };

    bookings.push(newReserva);
    setStorageItem(STORAGE_KEYS.RESERVAS, bookings);

    const client = dbService.getClientById(clientId);
    logEvent('RESERVA', `Reserva #${newReserva.id} criada para o cliente ${client?.nome} na mesa ${table.numero}.`, newReserva);

    // If reservation is immediately set to "Em Atendimento", mark table as occupied
    if (newReserva.status === 'Em Atendimento') {
      dbService.updateTableStatus(tableId, 'ocupada');
    }

    return newReserva;
  },

  updateReserva: (id, reservaData) => {
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);
    const idx = bookings.findIndex(b => b.id === parseInt(id));
    if (idx === -1) throw new Error('Reserva não encontrada.');

    const original = bookings[idx];
    const newStatus = reservaData.status || original.status;

    // Rule 6: Validate state transitions
    validateStatusTransition(original.status, newStatus);

    const clientId = reservaData.id_cliente !== undefined ? parseInt(reservaData.id_cliente) : original.id_cliente;
    const tableId = reservaData.id_mesa !== undefined ? parseInt(reservaData.id_mesa) : original.id_mesa;
    const guests = reservaData.quantidade_pessoas !== undefined ? parseInt(reservaData.quantidade_pessoas) : original.quantidade_pessoas;
    const date = reservaData.data_reserva ?? original.data_reserva;
    const start = reservaData.hora_inicio ?? original.hora_inicio;
    const end = reservaData.hora_fim ?? (reservaData.hora_inicio ? addHoursToTime(start, 2) : original.hora_fim);

    const client = dbService.getClientById(clientId);
    const table = dbService.getTableById(tableId);

    if (newStatus !== original.status && ['Confirmada', 'Pendente', 'Cancelada', 'No Show', 'Em Atendimento', 'Finalizada'].includes(newStatus)) {
      // Execute side-effects of status transition
      handleStatusTransitionSideEffects(original, newStatus, table, client);
    }

    // If making edits to date/time/table/guests, revalidate capacity and conflicts (if still active status)
    if (['Pendente', 'Confirmada', 'Em Atendimento'].includes(newStatus)) {
      if (guests > table.capacidade) {
        throw new Error(`A quantidade de pessoas (${guests}) ultrapassa a capacidade máxima da mesa (${table.capacidade}).`);
      }

      // Check conflict excluding this booking
      const hasConflict = bookings.some(b => 
        b.id !== parseInt(id) &&
        b.id_mesa === tableId && 
        b.data_reserva === date &&
        ['Pendente', 'Confirmada', 'Em Atendimento'].includes(b.status) &&
        isOverlapping(start, end, b.hora_inicio, b.hora_fim)
      );
      if (hasConflict) {
        throw new Error(`Conflito de reserva detectado. A mesa ${table.numero} já está ocupada ou reservada neste horário.`);
      }
    }

    bookings[idx] = {
      ...original,
      id_cliente: clientId,
      id_mesa: tableId,
      quantidade_pessoas: guests,
      data_reserva: date,
      hora_inicio: start,
      hora_fim: end,
      status: newStatus
    };

    setStorageItem(STORAGE_KEYS.RESERVAS, bookings);
    logEvent('RESERVA', `Reserva #${id} atualizada (Status: ${newStatus}).`, { original, updated: bookings[idx] });

    return bookings[idx];
  },

  // Fast transitions endpoints
  confirmarReserva: (id) => dbService.updateReserva(id, { status: 'Confirmada' }),
  
  cancelarReserva: (id) => {
    // Rule 10: Cancelamento deverá verificar lista de espera e sugerir ou reatribuir.
    const res = dbService.updateReserva(id, { status: 'Cancelada' });
    const table = dbService.getTableById(res.id_mesa);
    
    // Look up the waiting list for customers who could fit this table
    const waitingList = dbService.getWaitingList().filter(w => w.status === 'Pendente');
    const compatible = waitingList.find(w => w.quantidade_pessoas <= table.capacidade && w.data_desejada === res.data_reserva);

    if (compatible) {
      const waitClient = dbService.getClientById(compatible.id_cliente);
      logEvent('ALERTA', `Mesa ${table.numero} liberada por cancelamento da Reserva #${id}. Cliente '${waitClient?.nome}' está na fila de espera com perfil compatível!`, {
        mesaNumero: table.numero,
        clienteFila: waitClient?.nome,
        filaId: compatible.id
      });
      
      // Store a custom notification in logs so UI can read and prompt
      return { 
        reserva: res, 
        filaSugestao: {
          esperaId: compatible.id,
          clienteNome: waitClient?.nome,
          quantidade: compatible.quantidade_pessoas,
          mesaId: table.id,
          mesaNumero: table.numero,
          data: compatible.data_desejada,
          hora: compatible.hora_desejada
        }
      };
    }

    return { reserva: res, filaSugestao: null };
  },

  noShowReserva: (id) => {
    // Rule 7: Atraso acima de 20 minutos pode gerar No Show.
    // Rule 8: Cliente com 3 No Shows poderá ser bloqueado.
    return dbService.updateReserva(id, { status: 'No Show' });
  },

  // Helper to change table status (disponivel, ocupada, manutencao)
  updateTableStatus: (tableId, newStatus) => {
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    const idx = tables.findIndex(t => t.id === parseInt(tableId));
    if (idx !== -1) {
      const original = tables[idx];
      tables[idx].status = newStatus;
      setStorageItem(STORAGE_KEYS.MESAS, tables);
      logEvent('MESA', `Status da mesa ${original.numero} alterado de '${original.status}' para '${newStatus}'.`);
    }
  },

  // --- WAITING LIST SERVICE ---
  getWaitingList: () => {
    const list = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);
    return list.sort((a, b) => a.posicao - b.posicao);
  },

  addToWaitingList: (waitingData) => {
    const list = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);
    const clientId = parseInt(waitingData.id_cliente);
    const guests = parseInt(waitingData.quantidade_pessoas);
    
    // Check if client is blocked
    const blockedUntil = dbService.isClientBlocked(clientId);
    if (blockedUntil) {
      const formattedDate = new Date(blockedUntil).toLocaleString('pt-BR');
      throw new Error(`Este cliente está BLOQUEADO de entrar na lista de espera até ${formattedDate} por No Shows.`);
    }

    // Get next position in queue
    const activeQueue = list.filter(w => w.status === 'Pendente' && w.data_desejada === waitingData.data_desejada);
    const position = activeQueue.length > 0 ? Math.max(...activeQueue.map(w => w.posicao)) + 1 : 1;

    const newId = list.length > 0 ? Math.max(...list.map(w => w.id)) + 1 : 1;
    const newEntry = {
      id: newId,
      id_cliente: clientId,
      data_desejada: waitingData.data_desejada,
      hora_desejada: waitingData.hora_desejada,
      quantidade_pessoas: guests,
      posicao: position,
      status: waitingData.status || 'Pendente' // Pendente, Atendido, Cancelado
    };

    list.push(newEntry);
    setStorageItem(STORAGE_KEYS.LISTA_ESPERA, list);

    const client = dbService.getClientById(clientId);
    logEvent('ESPERA', `Cliente ${client?.nome} adicionado à lista de espera na posição #${position}.`, newEntry);
    return newEntry;
  },

  updateWaitingStatus: (id, newStatus) => {
    const list = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);
    const idx = list.findIndex(w => w.id === parseInt(id));
    if (idx === -1) throw new Error('Entrada da lista de espera não encontrada.');

    const original = list[idx];
    list[idx].status = newStatus;
    setStorageItem(STORAGE_KEYS.LISTA_ESPERA, list);

    const client = dbService.getClientById(original.id_cliente);
    logEvent('ESPERA', `Status de lista de espera para ${client?.nome} alterado para '${newStatus}'.`);

    // Rearrange positions of remaining items
    reorderWaitingPositions(original.data_desejada);

    return list[idx];
  },

  promoteFromWaitingList: (waitingId, tableId) => {
    const list = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);
    const entry = list.find(w => w.id === parseInt(waitingId));
    if (!entry) throw new Error('Entrada da lista de espera não encontrada.');

    // Create reservation for this customer
    const newReserva = dbService.createReserva({
      id_cliente: entry.id_cliente,
      id_mesa: tableId,
      quantidade_pessoas: entry.quantidade_pessoas,
      data_reserva: entry.data_desejada,
      hora_inicio: entry.hora_desejada,
      status: 'Confirmada'
    });

    // Mark waiting list entry as Atendido
    dbService.updateWaitingStatus(waitingId, 'Atendido');

    const client = dbService.getClientById(entry.id_cliente);
    logEvent('ESPERA', `Cliente ${client?.nome} promovido da fila de espera para a mesa reservada #${newReserva.id}.`);
    
    return newReserva;
  },

  deleteWaitingEntry: (id) => {
    const list = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);
    const entry = list.find(w => w.id === parseInt(id));
    if (!entry) throw new Error('Entrada da lista de espera não encontrada.');

    const filtered = list.filter(w => w.id !== parseInt(id));
    setStorageItem(STORAGE_KEYS.LISTA_ESPERA, filtered);
    
    const client = dbService.getClientById(entry.id_cliente);
    logEvent('ESPERA', `Entrada da lista de espera de ${client?.nome} removida.`, entry);

    reorderWaitingPositions(entry.data_desejada);
    return true;
  },

  // --- DASHBOARD SERVICE ---
  getDashboardData: (selectedDate = null) => {
    const today = selectedDate || new Date().toISOString().split('T')[0];
    const bookings = getStorageItem(STORAGE_KEYS.RESERVAS, []);
    const tables = getStorageItem(STORAGE_KEYS.MESAS, []);
    const waiting = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);

    // 1. Reservas do dia
    const todayBookings = bookings.filter(b => b.data_reserva === today);
    const totalReservasDia = todayBookings.length;

    // 2. Ocupação atual (tables currently occupied, status === 'ocupada')
    const occupiedTables = tables.filter(t => t.status === 'ocupada').length;
    const totalTables = tables.length;
    const taxaOcupacao = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    // 3. Taxa de No Show (all reservations ever that are 'No Show' vs total processed)
    const totalNoShows = bookings.filter(b => b.status === 'No Show').length;
    const finalBookings = bookings.filter(b => ['Finalizada', 'No Show', 'Cancelada'].includes(b.status)).length;
    const taxaNoShow = finalBookings > 0 ? Math.round((totalNoShows / finalBookings) * 100) : 0;

    // 4. Pessoas na lista de espera hoje
    const waitingToday = waiting.filter(w => w.data_desejada === today && w.status === 'Pendente').length;

    // 5. Média de pessoas por reserva
    const activeBookings = bookings.filter(b => b.status !== 'Cancelada');
    const totalPeople = activeBookings.reduce((sum, b) => sum + b.quantidade_pessoas, 0);
    const mediaPessoas = activeBookings.length > 0 ? parseFloat((totalPeople / activeBookings.length).toFixed(1)) : 0;

    // 6. Horários de pico (aggregate active bookings by starting hour)
    const peakHours = {};
    activeBookings.forEach(b => {
      const hour = b.hora_inicio.split(':')[0] + ':00';
      peakHours[hour] = (peakHours[hour] || 0) + 1;
    });

    const parsedPeakHours = Object.keys(peakHours).map(time => ({
      time,
      count: peakHours[time]
    })).sort((a, b) => b.count - a.count);

    return {
      totalReservasDia,
      occupiedTables,
      totalTables,
      taxaOcupacao,
      taxaNoShow,
      waitingToday,
      mediaPessoas,
      peakHours: parsedPeakHours,
      todayBookings
    };
  },

  resetDatabase: () => {
    if (typeof localStorage === 'undefined') {
      for (const k in memoryStorage) delete memoryStorage[k];
    } else {
      localStorage.removeItem(STORAGE_KEYS.MESAS);
      localStorage.removeItem(STORAGE_KEYS.CLIENTES);
      localStorage.removeItem(STORAGE_KEYS.RESERVAS);
      localStorage.removeItem(STORAGE_KEYS.LISTA_ESPERA);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    }
    seedDatabase();
  }
};

// HELPERS FOR INTERNAL STATE TRANSITIONS
const reorderWaitingPositions = (date) => {
  const list = getStorageItem(STORAGE_KEYS.LISTA_ESPERA, []);
  let pos = 1;
  const reordered = list.map(w => {
    if (w.data_desejada === date && w.status === 'Pendente') {
      return { ...w, posicao: pos++ };
    }
    return w;
  });
  setStorageItem(STORAGE_KEYS.LISTA_ESPERA, reordered);
};

// Rule 6: Validate state transitions
const validateStatusTransition = (oldStatus, newStatus) => {
  if (oldStatus === newStatus) return;

  // Allowed flows:
  // Pendente -> Confirmada / Cancelada
  // Confirmada -> Em Atendimento / Cancelada / No Show
  // Em Atendimento -> Finalizada
  // Cancelada -> (Nenhuma)
  // No Show -> (Nenhuma)
  // Finalizada -> (Nenhuma)

  const transitionMap = {
    'Pendente': ['Confirmada', 'Cancelada'],
    'Confirmada': ['Em Atendimento', 'Cancelada', 'No Show'],
    'Em Atendimento': ['Finalizada'],
    'Cancelada': [],
    'No Show': [],
    'Finalizada': []
  };

  const allowed = transitionMap[oldStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transição de status inválida: não é permitido alterar de '${oldStatus}' para '${newStatus}'.`);
  }
};

// Side effects logic
const handleStatusTransitionSideEffects = (reserva, newStatus, table, client) => {
  // If moving from active to final/inactive state, clear table occupancy
  if (reserva.status === 'Em Atendimento' && newStatus === 'Finalizada') {
    dbService.updateTableStatus(reserva.id_mesa, 'disponivel');
  }

  if (reserva.status === 'Confirmada' && newStatus === 'Em Atendimento') {
    dbService.updateTableStatus(reserva.id_mesa, 'ocupada');
  }

  if (['Pendente', 'Confirmada'].includes(reserva.status) && newStatus === 'Cancelada') {
    // If table was occupied, return to available
    dbService.updateTableStatus(reserva.id_mesa, 'disponivel');
  }

  // Rule 7 & 8: No show counting and block client
  if (reserva.status === 'Confirmada' && newStatus === 'No Show') {
    dbService.updateTableStatus(reserva.id_mesa, 'disponivel');

    const updatedNoShows = client.quantidade_no_show + 1;
    let blockedDateStr = null;

    if (updatedNoShows >= 3) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // Block for 7 days
      blockedDateStr = futureDate.toISOString();
      
      dbService.updateClient(client.id, {
        quantidade_no_show: 0, // Reset counter after block triggers
        bloqueado_ate: blockedDateStr
      });
      logEvent('BLOQUEIO', `Cliente ${client.nome} BLOQUEADO até ${futureDate.toLocaleString('pt-BR')} por atingir 3 No Shows.`, client);
    } else {
      dbService.updateClient(client.id, {
        quantidade_no_show: updatedNoShows
      });
      logEvent('NO-SHOW', `No Show registrado para ${client.nome}. Contagem atual: ${updatedNoShows}/3.`, client);
    }
  }
};
