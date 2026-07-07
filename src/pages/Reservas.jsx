import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { 
  Plus, 
  Search, 
  Calendar, 
  Sparkles, 
  Trash2, 
  Clock, 
  Check, 
  User, 
  Utensils, 
  CalendarRange,
  XCircle,
  HelpCircle,
  Play
} from 'lucide-react';

export default function Reservas({ triggerToast, onReservationChange, openWaitingPromotionPrompt }) {
  const [reservations, setReservations] = useState([]);
  const [clients, setClients] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [searchStatus, setSearchStatus] = useState('Todas');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_mesa: '',
    quantidade_pessoas: '',
    data_reserva: new Date().toISOString().split('T')[0],
    hora_inicio: '19:00',
    hora_fim: '21:00'
  });

  async function loadData() {
    setLoading(true);
    try {
      const [resData, clData, tbData] = await Promise.all([
        apiService.getReservas(),
        apiService.getClients(),
        apiService.getTables()
      ]);
      setReservations(resData);
      setClients(clData);
      setTables(tbData);
    } catch (err) {
      triggerToast('destructive', 'Erro', 'Não foi possível carregar os dados de reservas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (clients.length === 0) {
      triggerToast('warning', 'Sem Clientes', 'Cadastre pelo menos um cliente antes de criar reservas.');
      return;
    }
    if (tables.length === 0) {
      triggerToast('warning', 'Sem Mesas', 'Cadastre pelo menos uma mesa antes de criar reservas.');
      return;
    }

    setFormData({
      id_cliente: clients[0].id,
      id_mesa: '',
      quantidade_pessoas: '2',
      data_reserva: new Date().toISOString().split('T')[0],
      hora_inicio: '19:00',
      hora_fim: '21:00'
    });
    setIsModalOpen(true);
  };

  // Rule 2: Set hora_fim to +2h when changing hora_inicio
  const handleStartTimeChange = (startVal) => {
    const [h, m] = startVal.split(':').map(Number);
    const endH = (h + 2) % 24;
    const endVal = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      hora_inicio: startVal,
      hora_fim: endVal
    }));
  };

  // Desafio Obrigatório: Automatic Table Suggestion
  const handleAutoSuggest = async () => {
    const { quantidade_pessoas, data_reserva, hora_inicio, hora_fim } = formData;
    if (!quantidade_pessoas || !hora_inicio) {
      triggerToast('warning', 'Dados Incompletos', 'Informe o número de pessoas e o horário para receber sugestões.');
      return;
    }

    try {
      const suggested = await apiService.suggestTable(
        quantidade_pessoas, 
        data_reserva, 
        hora_inicio, 
        hora_fim
      );

      if (suggested) {
        setFormData(prev => ({ ...prev, id_mesa: suggested.id }));
        triggerToast('success', 'Mesa Sugerida!', `Mesa ${suggested.numero} (Capacidade: ${suggested.capacidade}, Setor: ${suggested.localizacao}) selecionada por ser a menor mesa livre ideal.`);
      } else {
        triggerToast('warning', 'Sem Mesas Disponíveis', 'Nenhuma mesa atende às restrições. Sugerimos colocar o cliente na Lista de Espera.');
      }
    } catch (err) {
      triggerToast('destructive', 'Erro ao sugerir', err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.id_cliente || !formData.id_mesa || !formData.quantidade_pessoas) {
      triggerToast('warning', 'Campos Incompletos', 'Por favor, preencha todos os campos e selecione uma mesa.');
      return;
    }

    try {
      await apiService.createReserva(formData);
      triggerToast('success', 'Sucesso', 'Reserva criada com sucesso!');
      setIsModalOpen(false);
      loadData();
      if (onReservationChange) onReservationChange();
    } catch (err) {
      triggerToast('destructive', 'Erro de Validação', err.message || 'Erro ao criar reserva.');
    }
  };

  // Status Transitions (Rule 6)
  const handleTransition = async (id, statusAction) => {
    try {
      if (statusAction === 'Confirmar') {
        await apiService.confirmarReserva(id);
        triggerToast('success', 'Reserva Confirmada', `Reserva #${id} foi confirmada.`);
      } else if (statusAction === 'Atendimento') {
        await apiService.atendimentoReserva(id);
        triggerToast('success', 'Cliente em Mesa', `Mesa está em atendimento.`);
      } else if (statusAction === 'Finalizar') {
        await apiService.finalizarReserva(id);
        triggerToast('success', 'Atendimento Finalizado', `Mesa liberada com sucesso.`);
      } else if (statusAction === 'NoShow') {
        // Rule 7 & 8: Late check + blocking
        await apiService.noShowReserva(id);
        triggerToast('destructive', 'Não Compareceu Registrado', `O cliente não compareceu. Penalidade aplicada.`);
      } else if (statusAction === 'Cancelar') {
        // Rule 10: Cancelamento verifica lista de espera
        const res = await apiService.cancelarReserva(id);
        triggerToast('warning', 'Reserva Cancelada', `A mesa está livre.`);
        
        // If waitlist matching client is found, prompt in App
        if (res.filaSugestao && openWaitingPromotionPrompt) {
          openWaitingPromotionPrompt(res.filaSugestao);
        }
      }
      loadData();
      if (onReservationChange) onReservationChange();
    } catch (err) {
      triggerToast('destructive', 'Transição Inválida', err.message || 'Erro ao transicionar status.');
    }
  };

  const getClientName = (id) => clients.find(c => c.id === parseInt(id))?.nome || `Cliente #${id}`;
  const getTableNumber = (id) => tables.find(t => t.id === parseInt(id))?.numero || `#${id}`;

  const filteredReservations = reservations.filter(r => {
    const matchDate = searchDate ? r.data_reserva === searchDate : true;
    const matchStatus = searchStatus === 'Todas' ? true : r.status === searchStatus;
    return matchDate && matchStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Reservas</h1>
          <p className="page-subtitle">Acompanhe e lance reservas, controlando horários e conflitos.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Nova Reserva
        </button>
      </div>

      {/* Filter panel */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="label" htmlFor="filter-reserva-date">Filtrar Data:</label>
              <input 
                type="date" 
                id="filter-reserva-date"
                className="input-field" 
                style={{ width: 'auto' }}
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
              {searchDate && (
                <button className="btn btn-outline btn-sm" onClick={() => setSearchDate('')}>Limpar</button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="label" htmlFor="filter-reserva-status">Status:</label>
              <select
                id="filter-reserva-status"
                className="select-field"
                style={{ width: 'auto' }}
                value={searchStatus}
                onChange={(e) => setSearchStatus(e.target.value)}
              >
                <option value="Todas">Todas</option>
                <option value="Pendente">Pendente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Finalizada">Finalizada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="No Show">Não Compareceu</option>
              </select>
            </div>
          </div>
          <span className="card-subtitle" style={{ fontWeight: '500' }}>{filteredReservations.length} reservas correspondentes</span>
        </div>

        {/* Reservations Table */}
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto' }}></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Nenhuma reserva cadastrada para os filtros selecionados.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Cliente</th>
                    <th>Mesa</th>
                    <th>Pessoas</th>
                    <th>Data / Hora</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Gerenciar Fluxo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.sort((a, b) => b.id - a.id).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>#{r.id}</td>
                      <td style={{ fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} style={{ color: 'hsl(var(--primary))' }} />
                          <span>{getClientName(r.id_cliente)}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Utensils size={14} style={{ color: 'hsl(var(--success))' }} />
                          <span>Mesa {getTableNumber(r.id_mesa)}</span>
                        </div>
                      </td>
                      <td>{r.quantidade_pessoas} pessoas</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: '550' }}>{r.data_reserva.split('-').reverse().join('/')}</span>
                          <span style={{ color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}>
                            <Clock size={12} /> {r.hora_inicio} - {r.hora_fim}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${
                          r.status === 'Confirmada' ? 'confirmed' :
                          r.status === 'Pendente' ? 'pending' :
                          r.status === 'Em Atendimento' ? 'active' :
                          r.status === 'Finalizada' ? 'finished' :
                          r.status === 'No Show' ? 'noshow' : 'cancelled'
                        }`}>
                          {r.status === 'No Show' ? 'Não Compareceu' : r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {r.status === 'Pendente' && (
                            <>
                              <button 
                                className="btn btn-success btn-sm btn-icon" 
                                onClick={() => handleTransition(r.id, 'Confirmar')}
                                title="Confirmar Reserva"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                className="btn btn-destructive btn-sm btn-icon" 
                                onClick={() => handleTransition(r.id, 'Cancelar')}
                                title="Cancelar Reserva"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {r.status === 'Confirmada' && (
                            <>
                              <button 
                                className="btn btn-primary btn-sm btn-icon" 
                                onClick={() => handleTransition(r.id, 'Atendimento')}
                                title="Sentar Cliente (Iniciar Atendimento)"
                              >
                                <Play size={14} />
                              </button>
                              <button 
                                className="btn btn-outline btn-sm btn-icon" 
                                onClick={() => handleTransition(r.id, 'NoShow')}
                                title="Registrar Não Compareceu (Atraso > 20m)"
                                style={{ borderColor: 'hsl(var(--destructive) / 0.4)', color: 'hsl(var(--destructive))' }}
                              >
                                <Clock size={14} />
                              </button>
                              <button 
                                className="btn btn-destructive btn-sm btn-icon" 
                                onClick={() => handleTransition(r.id, 'Cancelar')}
                                title="Cancelar Reserva"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          {r.status === 'Em Atendimento' && (
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => handleTransition(r.id, 'Finalizar')}
                            >
                              Finalizar
                            </button>
                          )}
                          {['Finalizada', 'Cancelada', 'No Show'].includes(r.status) && (
                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', paddingRight: '0.5rem' }}>Encerrada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-content animate-fade-in" onSubmit={handleCreate} style={{ overflow: 'visible' }}>
            <div className="modal-header">
              <h3>Fazer Nova Reserva</h3>
              <button type="button" className="toast-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label className="label" htmlFor="reserva-client">Selecione o Cliente</label>
                <select 
                  id="reserva-client"
                  className="select-field"
                  value={formData.id_cliente}
                  onChange={(e) => setFormData({ ...formData, id_cliente: e.target.value })}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.bloqueado_ate && new Date(c.bloqueado_ate) > new Date() ? ' (BLOQUEADO)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="reserva-date">Data</label>
                  <input 
                    type="date" 
                    id="reserva-date"
                    className="input-field" 
                    required
                    value={formData.data_reserva}
                    onChange={(e) => setFormData({ ...formData, data_reserva: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="reserva-guests">Qtd Pessoas</label>
                  <input 
                    type="number" 
                    id="reserva-guests"
                    className="input-field" 
                    required
                    min="1"
                    value={formData.quantidade_pessoas}
                    onChange={(e) => setFormData({ ...formData, quantidade_pessoas: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="reserva-start">Hora de Início</label>
                  <input 
                    type="time" 
                    id="reserva-start"
                    className="input-field" 
                    required
                    value={formData.hora_inicio}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="reserva-end">Hora Fim (Padrão 2h)</label>
                  <input 
                    type="time" 
                    id="reserva-end"
                    className="input-field" 
                    required
                    value={formData.hora_fim}
                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  />
                </div>
              </div>

              {/* Table selection row */}
              <div style={{ backgroundColor: 'hsl(var(--muted) / 0.25)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid hsl(var(--border))', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" htmlFor="reserva-table" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Utensils size={16} /> Selecionar Mesa
                  </label>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm" 
                    style={{ color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary) / 0.4)', padding: '0.25rem 0.5rem' }}
                    onClick={handleAutoSuggest}
                  >
                    <Sparkles size={12} /> Sugerir Menor Mesa Livre
                  </button>
                </div>
                
                <select 
                  id="reserva-table"
                  className="select-field"
                  value={formData.id_mesa}
                  onChange={(e) => setFormData({ ...formData, id_mesa: e.target.value })}
                >
                  <option value="">-- Escolha uma mesa --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id} disabled={t.status === 'manutencao'}>
                      Mesa {t.numero} (Capacidade: {t.capacidade} - {t.localizacao}) {t.status === 'manutencao' ? ' [EM MANUTENÇÃO]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-footer" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Agendar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
