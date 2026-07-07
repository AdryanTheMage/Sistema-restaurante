import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Plus, Search, Trash2, ArrowUpRight, Clock, User, Users, Calendar } from 'lucide-react';

export default function ListaEspera({ triggerToast, onWaitlistChange }) {
  const [waitlist, setWaitlist] = useState([]);
  const [clients, setClients] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [promoTableId, setPromoTableId] = useState('');

  const [formData, setFormData] = useState({
    id_cliente: '',
    data_desejada: new Date().toISOString().split('T')[0],
    hora_desejada: '20:00',
    quantidade_pessoas: '2'
  });

  async function loadData() {
    setLoading(true);
    try {
      const [wlData, clData, tbData] = await Promise.all([
        apiService.getWaitingList(),
        apiService.getClients(),
        apiService.getTables()
      ]);
      setWaitlist(wlData);
      setClients(clData);
      setTables(tbData);
    } catch (err) {
      triggerToast('destructive', 'Erro', 'Não foi possível carregar os dados da lista de espera.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (clients.length === 0) {
      triggerToast('warning', 'Sem Clientes', 'Cadastre pelo menos um cliente antes de adicionar à lista de espera.');
      return;
    }

    setFormData({
      id_cliente: clients[0].id,
      data_desejada: new Date().toISOString().split('T')[0],
      hora_desejada: '20:00',
      quantidade_pessoas: '2'
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.id_cliente || !formData.quantidade_pessoas) {
      triggerToast('warning', 'Campos Incompletos', 'Preencha todos os campos do formulário.');
      return;
    }

    try {
      await apiService.addToWaitingList(formData);
      triggerToast('success', 'Adicionado!', 'Cliente colocado na lista de espera com sucesso!');
      setIsModalOpen(false);
      loadData();
      if (onWaitlistChange) onWaitlistChange();
    } catch (err) {
      triggerToast('destructive', 'Erro de Validação', err.message || 'Erro ao entrar na lista de espera.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja remover este cliente da lista de espera?')) return;
    try {
      await apiService.deleteWaitingEntry(id);
      triggerToast('success', 'Sucesso', 'Entrada da lista de espera removida.');
      loadData();
      if (onWaitlistChange) onWaitlistChange();
    } catch (err) {
      triggerToast('destructive', 'Erro', err.message || 'Erro ao remover da lista de espera.');
    }
  };

  const handleOpenPromote = (entry) => {
    setSelectedEntry(entry);
    setPromoTableId('');
    setIsPromoModalOpen(true);
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (!promoTableId) {
      triggerToast('warning', 'Mesa Necessária', 'Por favor, selecione uma mesa para alocar o cliente.');
      return;
    }

    try {
      await apiService.promoteFromWaitingList(selectedEntry.id, promoTableId);
      triggerToast('success', 'Promovido!', 'Cliente promovido da lista de espera para mesa reservada com sucesso!');
      setIsPromoModalOpen(false);
      loadData();
      if (onWaitlistChange) onWaitlistChange();
    } catch (err) {
      triggerToast('destructive', 'Erro de Reserva', err.message || 'Não foi possível alocar mesa.');
    }
  };

  const getClientName = (id) => clients.find(c => c.id === parseInt(id))?.nome || `Cliente #${id}`;

  const filteredQueue = waitlist.filter(w => {
    const matchDate = searchDate ? w.data_desejada === searchDate : true;
    return matchDate && w.status === 'Pendente';
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Lista de Espera</h1>
          <p className="page-subtitle">Monitore os clientes aguardando mesas liberadas.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Adicionar à Espera
        </button>
      </div>

      {/* Filter Row */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="label" htmlFor="filter-espera-date">Filtrar Data:</label>
            <input 
              type="date" 
              id="filter-espera-date"
              className="input-field" 
              style={{ width: 'auto' }}
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
            {searchDate && (
              <button className="btn btn-outline btn-sm" onClick={() => setSearchDate('')}>Limpar</button>
            )}
          </div>
          <span className="card-subtitle" style={{ fontWeight: '500' }}>{filteredQueue.length} clientes aguardando</span>
        </div>

        {/* Waitlist content */}
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto' }}></div>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Nenhum cliente aguardando na lista de espera para esta data.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Cliente</th>
                    <th>Qtd Pessoas</th>
                    <th>Data Desejada</th>
                    <th>Horário Desejado</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map(w => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: '800', fontSize: '1.25rem', color: 'hsl(var(--primary))', paddingLeft: '1.5rem' }}>
                        #{w.posicao}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={14} style={{ color: 'hsl(var(--primary))' }} />
                          <span>{getClientName(w.id_cliente)}</span>
                        </div>
                      </td>
                      <td>{w.quantidade_pessoas} pessoas</td>
                      <td>{w.data_desejada.split('-').reverse().join('/')}</td>
                      <td>
                        <span style={{ fontWeight: '550', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} style={{ color: 'hsl(var(--muted-foreground))' }} /> {w.hora_desejada}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-pending">Aguardando</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleOpenPromote(w)}
                            style={{ display: 'inline-flex', gap: '0.25rem' }}
                          >
                            <ArrowUpRight size={14} /> Acomodar
                          </button>
                          <button 
                            className="btn btn-destructive btn-icon btn-sm"
                            onClick={() => handleDelete(w.id)}
                            title="Remover da Fila"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Add to waitlist Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-content animate-fade-in" onSubmit={handleCreate}>
            <div className="modal-header">
              <h3>Adicionar à Lista de Espera</h3>
              <button type="button" className="toast-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label" htmlFor="wl-client">Selecionar Cliente</label>
                <select 
                  id="wl-client"
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
              <div className="form-group">
                <label className="label" htmlFor="wl-guests">Quantidade de Pessoas</label>
                <input 
                  type="number" 
                  id="wl-guests"
                  className="input-field" 
                  required
                  min="1"
                  value={formData.quantidade_pessoas}
                  onChange={(e) => setFormData({ ...formData, quantidade_pessoas: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label" htmlFor="wl-date">Data Desejada</label>
                  <input 
                    type="date" 
                    id="wl-date"
                    className="input-field" 
                    required
                    value={formData.data_desejada}
                    onChange={(e) => setFormData({ ...formData, data_desejada: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="wl-time">Horário de Chegada</label>
                  <input 
                    type="time" 
                    id="wl-time"
                    className="input-field" 
                    required
                    value={formData.hora_desejada}
                    onChange={(e) => setFormData({ ...formData, hora_desejada: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Adicionar à Fila</button>
            </div>
          </form>
        </div>
      )}

      {/* Promotion / Accommodation Modal */}
      {isPromoModalOpen && selectedEntry && (
        <div className="modal-backdrop">
          <form className="modal-content animate-fade-in" onSubmit={handlePromoteSubmit}>
            <div className="modal-header">
              <h3>Acomodar Cliente em Mesa</h3>
              <button type="button" className="toast-close" onClick={() => setIsPromoModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ backgroundColor: 'hsl(var(--primary) / 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--primary) / 0.2)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Cliente:</span>
                  <strong>{getClientName(selectedEntry.id_cliente)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Quantidade de Pessoas:</span>
                  <strong>{selectedEntry.quantidade_pessoas} pessoas</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Horário Pretendido:</span>
                  <strong>{selectedEntry.hora_desejada} do dia {selectedEntry.data_desejada.split('-').reverse().join('/')}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="promo-table">Selecione a Mesa Disponível</label>
                <select 
                  id="promo-table"
                  className="select-field"
                  required
                  value={promoTableId}
                  onChange={(e) => setPromoTableId(e.target.value)}
                >
                  <option value="">-- Escolha uma mesa --</option>
                  {tables.map(t => {
                    const isDisabled = t.status === 'manutencao' || t.capacidade < selectedEntry.quantidade_pessoas;
                    return (
                      <option key={t.id} value={t.id} disabled={isDisabled}>
                        Mesa {t.numero} (Capacidade: {t.capacidade} - {t.localizacao}) {t.status === 'manutencao' ? ' [MANUTENÇÃO]' : t.capacidade < selectedEntry.quantidade_pessoas ? ' [MUITO PEQUENA]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="card-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsPromoModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Confirmar Acomodação</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
