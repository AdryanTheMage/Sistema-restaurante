// Standalone Business Rules Test Suite for GourmetReserve
// Run with: node src/tests/rules.test.js

// Mock browser localStorage for Node environment
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => {
    Object.keys(storage).forEach(key => delete storage[key]);
  }
};

// Import the database engine
import { dbService } from '../services/dbService.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

function assertThrows(fn, expectedMsg, message) {
  try {
    fn();
    console.error(`  ✗ FAIL: Expected error containing "${expectedMsg}", but function succeeded.`);
    failedTests++;
  } catch (err) {
    if (err.message.includes(expectedMsg)) {
      console.log(`  ✓ ${message} (Erro esperado: "${err.message}")`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message} (Erro recebido diferente do esperado: "${err.message}")`);
      failedTests++;
    }
  }
}

async function runTests() {
  console.log('===================================================');
  console.log('  INICIANDO SUÍTE DE TESTES DE REGRAS DE NEGÓCIO');
  console.log('===================================================\n');

  // Clean DB state before starting using environment-agnostic method
  dbService.resetDatabase();
  
  // Reinitialize the seed
  // The service imports and runs seeds on start.
  // Let's reload to ensure fresh database.
  const tables = dbService.getTables();
  const clients = dbService.getClients();
  const bookings = dbService.getReservas();
  
  console.log(`Dados carregados: ${tables.length} mesas, ${clients.length} clientes, ${bookings.length} reservas.\n`);

  // --- TEST CASE 1: NÚMERO DE MESA ÚNICO (REGRA 1) ---
  console.log('TESTANDO REGRA 1: Número da mesa deve ser único');
  assertThrows(
    () => dbService.createTable({ numero: 10, capacidade: 4, localizacao: 'Salão' }),
    'já existe',
    'Impedir cadastro de mesa com número duplicado (Mesa 10)'
  );
  
  // --- TEST CASE 2: RESERVA PADRÃO DE 2 HORAS (REGRA 2) ---
  console.log('\nTESTANDO REGRA 2: Duração padrão da reserva de 2 horas');
  const resDefaultHour = dbService.createReserva({
    id_cliente: 1,
    id_mesa: 2, // capacity 2
    quantidade_pessoas: 2,
    data_reserva: '2026-07-15',
    hora_inicio: '18:00',
    hora_fim: null // should default
  });
  assert(
    resDefaultHour.hora_fim === '20:00',
    `Reserva iniciada às 18:00 deve terminar às 20:00 (obtido: ${resDefaultHour.hora_fim})`
  );

  // --- TEST CASE 3: QUANTIDADE NÃO ULTRAPASSA CAPACIDADE (REGRA 4) ---
  console.log('\nTESTANDO REGRA 4: Quantidade de pessoas não excede capacidade');
  // Table 1 has capacity 2. Let's try booking for 3 people.
  assertThrows(
    () => dbService.createReserva({
      id_cliente: 1,
      id_mesa: 1, // Mesa 10 (capacidade 2)
      quantidade_pessoas: 3,
      data_reserva: '2026-07-15',
      hora_inicio: '12:00'
    }),
    'ultrapassa a capacidade',
    'Impedir reserva com quantidade acima da capacidade'
  );

  // --- TEST CASE 4: CONFLITOS DE RESERVA EVITADOS (REGRA 3) ---
  console.log('\nTESTANDO REGRA 3: Não permitir reservas conflitantes');
  // Let's create an active reservation on Table 3 (Cap 4) from 19:00 to 21:00 on 2026-07-15
  dbService.createReserva({
    id_cliente: 5,
    id_mesa: 3,
    quantidade_pessoas: 3,
    data_reserva: '2026-07-15',
    hora_inicio: '19:00',
    hora_fim: '21:00',
    status: 'Confirmada'
  });

  // Try booking same table, same date, overlapping time (20:00 to 22:00)
  assertThrows(
    () => dbService.createReserva({
      id_cliente: 4,
      id_mesa: 3,
      quantidade_pessoas: 2,
      data_reserva: '2026-07-15',
      hora_inicio: '20:00',
      hora_fim: '22:00'
    }),
    'Conflito de reserva detectado',
    'Impedir sobreposição de horário na mesma mesa (19-21h vs 20-22h)'
  );

  // --- TEST CASE 5: CLIENTE COM 3 NO SHOWS É BLOQUEADO (REGRA 8) ---
  console.log('\nTESTANDO REGRA 8: Cliente com 3 No Shows é bloqueado');
  // Client 2 start with 2 no shows. Let's create a reservation and trigger a no-show status transition.
  const resNoShowTest = dbService.createReserva({
    id_cliente: 2, // Ana Silva (has 2 no-shows)
    id_mesa: 1,
    quantidade_pessoas: 2,
    data_reserva: '2026-07-20',
    hora_inicio: '12:00',
    status: 'Confirmada'
  });

  // Transition to No Show
  dbService.updateReserva(resNoShowTest.id, { status: 'No Show' });

  // Client 2 should now be blocked! Let's check block.
  const client2 = dbService.getClientById(2);
  assert(
    client2.bloqueado_ate !== null,
    'Cliente Ana Silva deve possuir bloqueado_ate preenchido.'
  );

  // Attempting to book a new reservation for blocked Client 2 should fail
  assertThrows(
    () => dbService.createReserva({
      id_cliente: 2,
      id_mesa: 1,
      quantidade_pessoas: 2,
      data_reserva: '2026-07-21',
      hora_inicio: '13:00'
    }),
    'BLOQUEADO',
    'Impedir nova reserva para cliente bloqueado por excesso de No Shows'
  );

  // --- TEST CASE 6: MESA EM MANUTENÇÃO NÃO PODE SER RESERVADA (REGRA 11) ---
  console.log('\nTESTANDO REGRA 11: Mesa em manutenção não pode ser reservada');
  // Mesa 16 (id 7) is in maintenance status.
  assertThrows(
    () => dbService.createReserva({
      id_cliente: 4,
      id_mesa: 7, // Mesa 16 (em manutenção)
      quantidade_pessoas: 4,
      data_reserva: '2026-07-15',
      hora_inicio: '19:00'
    }),
    'em manutenção e não pode ser reservada',
    'Impedir agendamento em mesa sob manutenção'
  );

  // --- TEST CASE 7: ALGORITMO DE SUGESTÃO DE MENOR MESA (DESAFIO) ---
  console.log('\nTESTANDO DESAFIO OBRIGATÓRIO: Sugestão de menor mesa disponível');
  // Available tables with capacity >= 3 on 2026-07-25 20:00:
  // - Mesa 12 (cap 4)
  // - Mesa 13 (cap 4)
  // - Mesa 14 (cap 6)
  // - Mesa 15 (cap 8)
  // We want to suggest the smallest table (which is capacity 4).
  const suggested = dbService.suggestTable(3, '2026-07-25', '20:00');
  assert(
    suggested !== null && suggested.capacidade === 4,
    `Sugestão ideal para grupo de 3 pessoas deve ter capacidade 4 (obtido: Mesa ${suggested?.numero} com cap ${suggested?.capacidade})`
  );

  // If capacity 4 is fully booked, next suggestion should be capacity 6
  dbService.createReserva({ id_cliente: 1, id_mesa: 3, quantidade_pessoas: 3, data_reserva: '2026-07-25', hora_inicio: '19:30', hora_fim: '21:30', status: 'Confirmada' });
  dbService.createReserva({ id_cliente: 4, id_mesa: 4, quantidade_pessoas: 3, data_reserva: '2026-07-25', hora_inicio: '19:30', hora_fim: '21:30', status: 'Confirmada' });
  dbService.createReserva({ id_cliente: 5, id_mesa: 8, quantidade_pessoas: 3, data_reserva: '2026-07-25', hora_inicio: '19:30', hora_fim: '21:30', status: 'Confirmada' });

  // Now Mesa 12, 13 and 17 (all capacity 4) are reserved. Suggestion for 3 people should suggest Mesa 14 (capacity 6).
  const nextSuggest = dbService.suggestTable(3, '2026-07-25', '20:00');
  assert(
    nextSuggest !== null && nextSuggest.capacidade === 6,
    `Se todas as de cap 4 estiverem ocupadas, sugerir a de cap 6 (obtido: Mesa ${nextSuggest?.numero} com cap ${nextSuggest?.capacidade})`
  );

  console.log('\n===================================================');
  console.log('              RESUMO DO CLIENTE DE TESTES');
  console.log(`  Passados: ${passedTests} | Falhados: ${failedTests}`);
  console.log('===================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
