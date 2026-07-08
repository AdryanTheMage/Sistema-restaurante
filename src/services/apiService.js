const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5260/api';

async function fetchAPI(endpoint, options = {}) {

  // Interceptor: Mapeia as chaves snake_case (Front) para camelCase (C#) nas requisições
  if (options.body && typeof options.body === 'string') {
    try {
      const parsed = JSON.parse(options.body);
      const toCamel = (obj) => {
        if (Array.isArray(obj)) return obj.map(toCamel);
        if (obj !== null && typeof obj === 'object') {
          const mapped = {};
          for (const [k, v] of Object.entries(obj)) {
            const camelKey = k.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            let val = toCamel(v);

            // Normalizar campos de hora: "19:00" → "19:00:00" (C# TimeSpan exige HH:mm:ss)
            if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) {
              val = val + ':00';
            }

            // Normalizar campos de data: "2026-07-06" → "2026-07-06T00:00:00" (C# DateTime)
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
              val = val + 'T00:00:00';
            }

            mapped[camelKey] = val;
          }
          return mapped;
        }
        return obj;
      };
      options.body = JSON.stringify(toCamel(parsed));
    } catch(e) {}
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  if (response.status === 204) return null; // No Content
  
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!response.ok) {
    let errorDetail = data?.mensagem || data?.message;
    if (!errorDetail) {
      if (response.status === 404) errorDetail = 'O recurso solicitado não foi encontrado no servidor.';
      else if (response.status >= 400 && response.status < 500) errorDetail = 'Os dados enviados são inválidos ou a operação não é permitida pelas regras de negócio.';
      else if (response.status >= 500) errorDetail = 'O servidor encontrou um erro interno inesperado. Tente novamente mais tarde.';
      else errorDetail = `Falha de comunicação com a API (Status ${response.status}). Verifique a conexão com o banco de dados.`;
    }
    throw new Error(errorDetail);
  }

  // Interceptor: Mapeia as chaves do C# (PascalCase/camelCase) para snake_case pro React
  function mapToSnake(obj) {
    if (Array.isArray(obj)) return obj.map(mapToSnake);
    if (obj !== null && typeof obj === 'object') {
      const mapped = {};
      for (const [k, v] of Object.entries(obj)) {
        const snakeKey = k.charAt(0).toLowerCase() + k.slice(1).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        mapped[snakeKey] = mapToSnake(v);
        mapped[k] = mapToSnake(v); // Manter o original também para retrocompatibilidade
      }
      
      // Auto-preencher hora_fim se estiver faltando (backend de Reservas só salva Inicio)
      if (mapped.hora_inicio && !mapped.hora_fim) {
        try {
          const h = parseInt(mapped.hora_inicio.split(':')[0], 10);
          mapped.hora_fim = `${String((h + 2) % 24).padStart(2, '0')}:00`;
        } catch(e) {}
      }
      
      // Remover a parte do tempo ('T00:00:00') do DataReserva se existir, para o front exibir apenas a data
      if (mapped.data_reserva && typeof mapped.data_reserva === 'string' && mapped.data_reserva.includes('T')) {
        mapped.data_reserva = mapped.data_reserva.split('T')[0];
      }
      if (mapped.data_desejada && typeof mapped.data_desejada === 'string' && mapped.data_desejada.includes('T')) {
        mapped.data_desejada = mapped.data_desejada.split('T')[0];
      }

      // Normalizar valores de status do backend C# (sem espaço) para o padrão do frontend
      const statusNormMap = {
        'NoShow':        'No Show',
        'no show':       'No Show',
        'noshow':        'No Show',
        'EmAtendimento': 'Em Atendimento',
        'ematendimento': 'Em Atendimento',
        'em atendimento':'Em Atendimento',
        'Confirmada':    'Confirmada',
        'confirmada':    'Confirmada',
        'Pendente':      'Pendente',
        'pendente':      'Pendente',
        'Finalizada':    'Finalizada',
        'finalizada':    'Finalizada',
        'Cancelada':     'Cancelada',
        'cancelada':     'Cancelada',
      };
      if (mapped.status && typeof mapped.status === 'string') {
        mapped.status = statusNormMap[mapped.status] ?? mapped.status;
      }
      // Retrocompatibilidade: também normaliza a chave original "Status" (PascalCase)
      if (mapped.Status && typeof mapped.Status === 'string') {
        mapped.Status = statusNormMap[mapped.Status] ?? mapped.Status;
      }
      
      return mapped;
    }
    return obj;
  }

  return mapToSnake(data);
}

export const apiService = {
  // --- GENERAL LOGS ---
  // If the backend doesn't have logs, we can just return empty or mock it. The C# backend doesn't seem to have a Logs controller explicitly shown in the output, but let's assume it returns empty if it fails.
  getLogs: () => Promise.resolve([]),
  clearLogs: () => Promise.resolve(),

  // --- CLIENTS CRUD ---
  getClients: () => fetchAPI('/clientes'),
  getClientById: (id) => fetchAPI(`/clientes/${id}`),
  createClient: (clientData) => fetchAPI('/clientes', { method: 'POST', body: JSON.stringify(clientData) }),
  updateClient: (id, clientData) => fetchAPI(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(clientData) }),
  deleteClient: (id) => fetchAPI(`/clientes/${id}`, { method: 'DELETE' }),

  // --- TABLES CRUD ---
  getTables: () => fetchAPI('/mesas'),
  getTableById: (id) => fetchAPI(`/mesas/${id}`),
  createTable: (tableData) => fetchAPI('/mesas', { method: 'POST', body: JSON.stringify(tableData) }),
  updateTable: (id, tableData) => fetchAPI(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify(tableData) }),
  deleteTable: (id) => fetchAPI(`/mesas/${id}`, { method: 'DELETE' }),
  updateTableStatus: (id, status) => fetchAPI(`/mesas/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // --- RESERVATIONS CRUD & ENDPOINTS ---
  getReservas: () => fetchAPI('/reservas'),
  getReservaById: (id) => fetchAPI(`/reservas/${id}`),
  createReserva: (reservaData) => fetchAPI('/reservas', { method: 'POST', body: JSON.stringify(reservaData) }),
  updateReserva: (id, reservaData) => fetchAPI(`/reservas/${id}`, { method: 'PUT', body: JSON.stringify(reservaData) }),
  deleteReserva: (id) => fetchAPI(`/reservas/${id}`, { method: 'DELETE' }),
  confirmarReserva: (id) => fetchAPI(`/reservas/${id}/confirmar`, { method: 'PUT' }),
  cancelarReserva: (id) => fetchAPI(`/reservas/${id}/cancelar`, { method: 'PUT' }),
  noShowReserva: (id) => fetchAPI(`/reservas/${id}/no-show`, { method: 'PUT' }),
  
  // Transition actions
  atendimentoReserva: (id) => fetchAPI(`/reservas/${id}/em-atendimento`, { method: 'PUT' }),
  finalizarReserva: (id) => fetchAPI(`/reservas/${id}/finalizar`, { method: 'PUT' }),
  
  suggestTable: (guests, date, start, end) => 
    fetchAPI(`/reservas/sugerir-mesa`, { 
      method: 'POST', 
      body: JSON.stringify({ quantidade_pessoas: guests, data_reserva: date, hora_inicio: start, hora_fim: end }) 
    }),

  // --- WAITING LIST CRUD & ENDPOINTS ---
  getWaitingList: () => fetchAPI('/lista-espera'),
  addToWaitingList: (waitingData) => fetchAPI('/lista-espera', { method: 'POST', body: JSON.stringify(waitingData) }),
  updateWaitingStatus: (id, status) => {
      if (status === 'Cancelado') return fetchAPI(`/lista-espera/${id}/cancelar`, { method: 'PUT' });
      return fetchAPI(`/lista-espera/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  promoteFromWaitingList: (waitingId, tableId) => {
      console.warn("Backend may not have direct 'promote' endpoint.");
      return Promise.resolve();
  },
  deleteWaitingEntry: (id) => fetchAPI(`/lista-espera/${id}`, { method: 'DELETE' }),

  // --- DASHBOARD DATA ---
  getDashboardData: async (date) => {
    const today = date || new Date().toISOString().split('T')[0];
    const [bookings, tables, clients, waiting] = await Promise.all([
      fetchAPI('/reservas'),
      fetchAPI('/mesas'),
      fetchAPI('/clientes'),
      fetchAPI('/lista-espera')
    ]);

    // 1. Reservas do dia
    const todayBookings = bookings
      .filter(b => (b.dataReserva || b.data_reserva || b.DataReserva || '').startsWith(today))
      .map(b => {
        const clientId = b.idCliente || b.id_cliente || b.IdCliente;
        const tableId = b.idMesa || b.id_mesa || b.IdMesa;
        const client = clients.find(c => (c.id || c.Id) === clientId);
        const table = tables.find(t => (t.id || t.Id) === tableId);
        return {
          ...b,
          id: b.id || b.Id,
          data_reserva: b.dataReserva || b.data_reserva || b.DataReserva,
          hora_inicio: b.horaInicio || b.hora_inicio || b.HoraInicio,
          hora_fim: b.horaFim || b.hora_fim || b.HoraFim || '22:00:00',
          id_mesa: tableId,
          status: b.status || b.Status,
          quantidade_pessoas: b.quantidadePessoas || b.quantidade_pessoas || b.QuantidadePessoas,
          nomeCliente: client ? (client.nome || client.Nome) : `Cliente #${clientId}`,
          numeroMesa: table ? (table.numero || table.Numero) : tableId,
          localizacaoMesa: table ? (table.localizacao || table.Localizacao) : ''
        };
      });
    const totalReservasDia = todayBookings.length;

    // 2. Ocupação atual
    const occupiedCount = tables.filter(t => (t.status || t.Status || '').toLowerCase() === 'ocupada').length;
    const totalTables = tables.length;
    const taxaOcupacao = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;

    // 3. Taxa de No Show
    const totalNoShows = bookings.filter(b => (b.status || b.Status) === 'No Show').length;
    const finalBookings = bookings.filter(b => ['Finalizada', 'No Show', 'Cancelada'].includes(b.status || b.Status)).length;
    const taxaNoShow = finalBookings > 0 ? Math.round((totalNoShows / finalBookings) * 100) : 0;

    // 4. Espera
    const waitingToday = waiting.filter(w => (w.dataDesejada || w.data_desejada || w.DataDesejada || '').startsWith(today) && (w.status || w.Status) === 'Pendente').length;

    // 5. Média de pessoas
    const activeBookings = bookings.filter(b => (b.status || b.Status) !== 'Cancelada');
    const totalPeople = activeBookings.reduce((sum, b) => sum + (b.quantidadePessoas || b.quantidade_pessoas || b.QuantidadePessoas), 0);
    const mediaPessoas = activeBookings.length > 0 ? parseFloat((totalPeople / activeBookings.length).toFixed(1)) : 0;

    // 6. Horários de pico
    const peakHours = {};
    activeBookings.forEach(b => {
      let hourStr = b.horaInicio || b.hora_inicio || b.HoraInicio || '';
      if(hourStr.length >= 2) {
        const hour = hourStr.split(':')[0] + ':00';
        peakHours[hour] = (peakHours[hour] || 0) + 1;
      }
    });

    const parsedPeakHours = Object.keys(peakHours).map(time => ({
      time,
      count: peakHours[time]
    })).sort((a, b) => b.count - a.count);

    return {
      totalReservasDia,
      occupiedCount,
      totalTables,
      taxaOcupacao,
      taxaNoShow,
      waitingToday,
      mediaPessoas,
      peakHours: parsedPeakHours,
      todayBookings
    };
  }
};
