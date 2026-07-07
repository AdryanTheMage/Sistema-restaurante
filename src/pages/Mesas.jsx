import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Plus, Edit2, Trash2, LayoutGrid, List, ShieldAlert, Sparkles } from 'lucide-react';

export default function Mesas({ triggerToast, onTableChange }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ numero: '', capacidade: '', localizacao: 'Salão Principal', status: 'disponivel' });

  async function loadTables() {
    setLoading(true);
    try {
      const data = await apiService.getTables();
      setTables(data.sort((a, b) => a.numero - b.numero));
    } catch (err) {
      triggerToast('destructive', 'Erro', 'Não foi possível carregar as mesas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, []);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setFormData({ 
      numero: '', 
      capacidade: '', 
      localizacao: 'Salão Principal', 
      status: 'disponivel' 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setFormData({ 
      numero: String(table.numero), 
      capacidade: String(table.capacidade), 
      localizacao: table.localizacao, 
      status: table.status 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta mesa?')) return;
    try {
      await apiService.deleteTable(id);
      triggerToast('success', 'Sucesso', 'Mesa removida com sucesso!');
      loadTables();
      if (onTableChange) onTableChange();
    } catch (err) {
      triggerToast('destructive', 'Erro de Validação', err.message || 'Erro ao remover mesa.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.numero.trim() || !formData.capacidade.trim()) {
      triggerToast('warning', 'Campos Obrigatórios', 'Preencha o número e a capacidade da mesa.');
      return;
    }

    try {
      if (editingTable) {
        await apiService.updateTable(editingTable.id, {
          numero: formData.numero,
          capacidade: formData.capacidade,
          localizacao: formData.localizacao,
          status: formData.status
        });
        triggerToast('success', 'Sucesso', 'Mesa atualizada com sucesso!');
      } else {
        await apiService.createTable({
          numero: formData.numero,
          capacidade: formData.capacidade,
          localizacao: formData.localizacao,
          status: formData.status
        });
        triggerToast('success', 'Sucesso', 'Mesa cadastrada com sucesso!');
      }
      setIsModalOpen(false);
      loadTables();
      if (onTableChange) onTableChange();
    } catch (err) {
      triggerToast('destructive', 'Erro de Validação', err.message || 'Erro ao salvar mesa.');
    }
  };

  const locations = ['Salão Principal', 'Terraço', 'Área VIP', 'Jardim Interno'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Mesas</h1>
          <p className="page-subtitle">Configure e monitore as mesas disponíveis no estabelecimento.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ display: 'flex', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button 
              className="btn btn-icon" 
              style={{ borderRadius: 0, backgroundColor: viewMode === 'grid' ? 'hsl(var(--muted))' : 'transparent', color: viewMode === 'grid' ? 'hsl(var(--primary))' : 'inherit', padding: '0.5rem 0.75rem' }}
              onClick={() => setViewMode('grid')}
              title="Visualização em Mapa/Grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className="btn btn-icon" 
              style={{ borderRadius: 0, backgroundColor: viewMode === 'list' ? 'hsl(var(--muted))' : 'transparent', color: viewMode === 'list' ? 'hsl(var(--primary))' : 'inherit', padding: '0.5rem 0.75rem' }}
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
            >
              <List size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Cadastrar Mesa
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto' }}></div>
        </div>
      ) : tables.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
          Nenhuma mesa cadastrada. Adicione sua primeira mesa clicando em "Cadastrar Mesa".
        </div>
      ) : viewMode === 'grid' ? (
        /* Map / Grid View group by location */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {locations.map(loc => {
            const locTables = tables.filter(t => t.localizacao === loc);
            if (locTables.length === 0) return null;
            return (
              <div key={loc} className="card">
                <div className="card-header">
                  <h3 className="card-title">{loc}</h3>
                  <span className="badge badge-confirmed" style={{ textTransform: 'none' }}>
                    {locTables.length} {locTables.length === 1 ? 'Mesa' : 'Mesas'}
                  </span>
                </div>
                <div className="card-body">
                  <div className="tables-map-grid">
                    {locTables.map(table => {
                      const isAvail = table.status === 'disponivel';
                      const isOcc = table.status === 'ocupada';
                      return (
                        <div 
                          key={table.id}
                          className={`table-node table-node-${table.status}`}
                          onClick={() => handleOpenEdit(table)}
                          title={`Clique para editar a Mesa ${table.numero}`}
                        >
                          <span className="table-node-number">{table.numero}</span>
                          <span className="table-node-capacity">
                            <Sparkles size={10} /> Cap: {table.capacidade}
                          </span>
                          <span className="badge" style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.1rem 0.4rem', 
                            backgroundColor: isAvail ? 'hsl(var(--success) / 0.15)' : isOcc ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted-foreground) / 0.15)',
                            color: isAvail ? 'hsl(var(--success))' : isOcc ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                            border: 'none'
                          }}>
                            {table.status === 'disponivel' ? 'Livre' : table.status === 'ocupada' ? 'Ocupada' : 'Manut.'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Table List View */
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Capacidade</th>
                    <th>Localização</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: '700', fontSize: '1.1rem' }}>Mesa {t.numero}</td>
                      <td style={{ fontWeight: '500' }}>{t.capacidade} Pessoas</td>
                      <td>{t.localizacao}</td>
                      <td>
                        <span className={`badge ${
                          t.status === 'disponivel' ? 'badge-active' :
                          t.status === 'ocupada' ? 'badge-confirmed' : 'badge-maintenance'
                        }`}>
                          {t.status === 'disponivel' ? 'Livre' :
                           t.status === 'ocupada' ? 'Ocupada' : 'Manutenção'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-outline btn-icon btn-sm" 
                            onClick={() => handleOpenEdit(t)}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-destructive btn-icon btn-sm" 
                            onClick={() => handleDelete(t.id)}
                            title="Remover"
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
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-content animate-fade-in" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h3>{editingTable ? `Mesa ${editingTable.numero}` : 'Cadastrar Nova Mesa'}</h3>
              <button type="button" className="toast-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label" htmlFor="table-number">Número da Mesa</label>
                <input 
                  type="number" 
                  id="table-number"
                  className="input-field" 
                  required
                  min="1"
                  placeholder="Ex: 24"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="table-capacity">Capacidade (Pessoas)</label>
                <input 
                  type="number" 
                  id="table-capacity"
                  className="input-field" 
                  required
                  min="1"
                  placeholder="Ex: 4"
                  value={formData.capacidade}
                  onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="table-location">Localização / Setor</label>
                <select 
                  id="table-location"
                  className="select-field"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="table-status">Status Inicial</label>
                <select 
                  id="table-status"
                  className="select-field"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="disponivel">Livre / Disponível</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="manutencao">Em Manutenção</option>
                </select>
              </div>

              {editingTable && editingTable.status === 'manutencao' && (
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'hsl(var(--warning) / 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--warning) / 0.3)', color: 'hsl(var(--warning-foreground))', fontSize: '0.85rem' }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Mesa em Manutenção:</strong> Esta mesa não receberá reservas futuras nem sugestões automáticas até voltar a ficar "Livre".
                  </div>
                </div>
              )}
            </div>
            <div className="card-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
