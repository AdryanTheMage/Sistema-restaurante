const API_URL = 'http://localhost:5260/api';

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erro na API (${response.status}): ${err}`);
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function clearData() {
  console.log('--- LIMPANDO DADOS ANTIGOS ---');
  // Obter e excluir todas as listas de espera
  const esperas = await fetchAPI('/lista-espera');
  for (let e of esperas) await fetchAPI(`/lista-espera/${e.id || e.Id}`, { method: 'DELETE' });

  // Obter e excluir todas as reservas
  const reservas = await fetchAPI('/reservas');
  for (let r of reservas) await fetchAPI(`/reservas/${r.id || r.Id}`, { method: 'DELETE' });

  // Obter e excluir todos os clientes
  const clientes = await fetchAPI('/clientes');
  for (let c of clientes) await fetchAPI(`/clientes/${c.id || c.Id}`, { method: 'DELETE' });

  // Obter e excluir todas as mesas
  const mesas = await fetchAPI('/mesas');
  for (let m of mesas) await fetchAPI(`/mesas/${m.id || m.Id}`, { method: 'DELETE' });
}

async function seedData() {
  console.log('--- INSERINDO DADOS REAIS ---');

  // MESAS
  console.log('Adicionando mesas...');
  const m1 = await fetchAPI('/mesas', { method: 'POST', body: JSON.stringify({ numero: 1, capacidade: 2, localizacao: 'Varanda', status: 'Disponivel' }) });
  const m2 = await fetchAPI('/mesas', { method: 'POST', body: JSON.stringify({ numero: 2, capacidade: 4, localizacao: 'Salão Principal', status: 'Disponivel' }) });
  const m3 = await fetchAPI('/mesas', { method: 'POST', body: JSON.stringify({ numero: 3, capacidade: 6, localizacao: 'Área VIP', status: 'Disponivel' }) });
  const m4 = await fetchAPI('/mesas', { method: 'POST', body: JSON.stringify({ numero: 4, capacidade: 2, localizacao: 'Salão Principal', status: 'Disponivel' }) });

  // CLIENTES
  console.log('Adicionando clientes...');
  const c1 = await fetchAPI('/clientes', { method: 'POST', body: JSON.stringify({ nome: 'João Pedro da Silva', telefone: '(11) 98888-1111', email: 'joao@email.com' }) });
  const c2 = await fetchAPI('/clientes', { method: 'POST', body: JSON.stringify({ nome: 'Maria Clara Oliveira', telefone: '(11) 97777-2222', email: 'maria@email.com' }) });
  const c3 = await fetchAPI('/clientes', { method: 'POST', body: JSON.stringify({ nome: 'Carlos Eduardo Souza', telefone: '(21) 96666-3333', email: 'carlos@email.com' }) });
  const c4 = await fetchAPI('/clientes', { method: 'POST', body: JSON.stringify({ nome: 'Ana Beatriz (Atrasada)', telefone: '(31) 95555-4444', email: 'ana@email.com' }) });

  // RESERVAS
  console.log('Adicionando reservas...');
  const today = new Date().toISOString().split('T')[0];
  
  // Reserva confirmada para agora
  await fetchAPI('/reservas', { method: 'POST', body: JSON.stringify({ idCliente: c1.id || c1.Id, idMesa: m1.id || m1.Id, quantidadePessoas: 2, dataReserva: today, horaInicio: '19:00:00' }) });
  
  // Reserva em andamento
  const res2 = await fetchAPI('/reservas', { method: 'POST', body: JSON.stringify({ idCliente: c2.id || c2.Id, idMesa: m2.id || m2.Id, quantidadePessoas: 4, dataReserva: today, horaInicio: '20:00:00' }) });
  await fetchAPI(`/reservas/${res2.id || res2.Id}/confirmar`, { method: 'PUT' });
  await fetchAPI(`/reservas/${res2.id || res2.Id}/em-atendimento`, { method: 'PUT' });

  // Reserva de quem sempre dá no show
  const res3 = await fetchAPI('/reservas', { method: 'POST', body: JSON.stringify({ idCliente: c4.id || c4.Id, idMesa: m4.id || m4.Id, quantidadePessoas: 2, dataReserva: today, horaInicio: '18:00:00' }) });
  await fetchAPI(`/reservas/${res3.id || res3.Id}/confirmar`, { method: 'PUT' });
  await fetchAPI(`/reservas/${res3.id || res3.Id}/no-show`, { method: 'PUT' });

  console.log('--- BANCO PRONTO PARA A APRESENTAÇÃO ---');
}

clearData().then(seedData).catch(console.error);
