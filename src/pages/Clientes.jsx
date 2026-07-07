import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Plus, Search, Edit2, Trash2, ShieldAlert, User, Phone, Mail } from 'lucide-react';

export default function Clientes({ triggerToast, onClientChange }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ nome: '', telefone: '', email: '' });

  const handlePhoneChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    
    if (v.length > 2 && v.length <= 6) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length > 6 && v.length <= 10) v = `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    else if (v.length > 10) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    
    setFormData({ ...formData, telefone: v });
  };

  async function loadClients() {
    setLoading(true);
    try {
      const data = await apiService.getClients();
      setClients(data);
    } catch (err) {
      triggerToast('destructive', 'Erro', 'Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ nome: '', telefone: '', email: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({ nome: client.nome, telefone: client.telefone, email: client.email });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este cliente?')) return;
    try {
      await apiService.deleteClient(id);
      triggerToast('success', 'Sucesso', 'Cliente removido com sucesso!');
      loadClients();
      if (onClientChange) onClientChange();
    } catch (err) {
      triggerToast('destructive', 'Erro de Validação', err.message || 'Erro ao remover cliente.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.email.trim()) {
      triggerToast('warning', 'Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      if (editingClient) {
        await apiService.updateClient(editingClient.id, formData);
        triggerToast('success', 'Sucesso', 'Cliente atualizado com sucesso!');
      } else {
        await apiService.createClient(formData);
        triggerToast('success', 'Sucesso', 'Cliente cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      loadClients();
      if (onClientChange) onClientChange();
    } catch (err) {
      triggerToast('destructive', 'Erro', err.message || 'Erro ao salvar cliente.');
    }
  };

  const isBlocked = (client) => {
    if (!client.bloqueado_ate) return false;
    return new Date(client.bloqueado_ate) > new Date();
  };

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search)
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerencie os clientes cadastrados e consulte seus históricos.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Cadastrar Cliente
        </button>
      </div>

      {/* Filter and Table Container */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '350px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--muted-foreground))' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou telefone..." 
              className="input-field" 
              style={{ paddingLeft: '34px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="card-subtitle" style={{ fontWeight: '500' }}>Exibindo {filteredClients.length} de {clients.length} clientes</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto' }}></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Não Comp.</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(c => {
                    const blocked = isBlocked(c);
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'none' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center' }}>
                            <User size={16} />
                          </div>
                          <span>{c.nome}</span>
                        </td>
                        <td>{c.telefone}</td>
                        <td>{c.email}</td>
                        <td style={{ fontWeight: '600' }}>
                          <span style={{ color: c.quantidade_no_show >= 2 ? 'hsl(var(--destructive))' : 'inherit' }}>
                            {c.quantidade_no_show}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}> / 3</span>
                        </td>
                        <td>
                          {blocked ? (
                            <span className="badge badge-noshow" style={{ display: 'inline-flex', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                              <ShieldAlert size={12} /> Bloqueado
                            </span>
                          ) : (
                            <span className="badge badge-active">Ativo</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-outline btn-icon btn-sm" 
                              onClick={() => handleOpenEdit(c)}
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-destructive btn-icon btn-sm" 
                              onClick={() => handleDelete(c.id)}
                              title="Remover"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-content animate-fade-in" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h3>{editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h3>
              <button type="button" className="toast-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label" htmlFor="client-name">Nome Completo</label>
                <input 
                  type="text" 
                  id="client-name"
                  className="input-field" 
                  required
                  placeholder="Ex: João da Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="client-phone">Telefone de Contato</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', color: 'hsl(var(--primary))' }} />
                  <input 
                    type="text" 
                    id="client-phone"
                    className="input-field" 
                    required
                    placeholder="(XX) XXXXX-XXXX"
                    style={{ paddingLeft: '40px', fontWeight: '500', letterSpacing: '0.5px' }}
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="client-email">E-mail</label>
                <input 
                  type="email" 
                  id="client-email"
                  className="input-field" 
                  required
                  placeholder="Ex: joao@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {editingClient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'hsl(var(--muted) / 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Quantidade de Não Comparecimentos:</span>
                    <strong style={{ color: editingClient.quantidade_no_show >= 2 ? 'hsl(var(--destructive))' : 'inherit' }}>
                      {editingClient.quantidade_no_show}
                    </strong>
                  </div>
                  {editingClient.bloqueado_ate && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'hsl(var(--destructive))' }}>
                      <span>Bloqueado até:</span>
                      <strong>{new Date(editingClient.bloqueado_ate).toLocaleString('pt-BR')}</strong>
                    </div>
                  )}
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
