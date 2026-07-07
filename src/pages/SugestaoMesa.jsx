import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Sparkles, Calendar, Clock, Users, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function SugestaoMesa({ triggerToast, setActivePage, setPreFillData }) {
  const [formData, setFormData] = useState({
    quantidade_pessoas: '3',
    data_reserva: new Date().toISOString().split('T')[0],
    hora_inicio: '19:30',
    hora_fim: '21:30'
  });
  
  const [suggestedTable, setSuggestedTable] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Rule 2: Automatically calculate end time as +2 hours when starting time is changed
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.quantidade_pessoas || !formData.data_reserva || !formData.hora_inicio || !formData.hora_fim) {
      triggerToast('warning', 'Aviso', 'Preencha todos os campos da consulta.');
      return;
    }

    setLoading(true);
    setHasSearched(false);
    try {
      const res = await apiService.suggestTable(
        formData.quantidade_pessoas,
        formData.data_reserva,
        formData.hora_inicio,
        formData.hora_fim
      );
      setSuggestedTable(res);
      setHasSearched(true);
    } catch (err) {
      triggerToast('destructive', 'Erro', err.message || 'Erro ao processar sugestão.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    if (!suggestedTable) return;
    
    // Pass pre-fill data to main App context
    setPreFillData({
      id_mesa: suggestedTable.id,
      quantidade_pessoas: formData.quantidade_pessoas,
      data_reserva: formData.data_reserva,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim
    });
    
    // Redirect to Reservations page
    setActivePage('reservas');
    triggerToast('success', 'Mesa Pré-Selecionada', `A mesa ${suggestedTable.numero} foi reservada provisoriamente no formulário de agendamento.`);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Sugestão de Mesa</h1>
          <p className="page-subtitle">Algoritmo inteligente para sugerir a menor mesa livre ideal.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Suggestion Form Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Sparkles size={18} /> Detalhes da Reserva</h3>
            <span className="card-subtitle">Insira o tamanho do grupo e o horário desejado.</span>
          </div>
          <form onSubmit={handleSearch} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="sug-guests" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={16} /> Quantidade de Clientes
              </label>
              <input 
                type="number" 
                id="sug-guests"
                className="input-field" 
                required
                min="1"
                placeholder="Ex: 4"
                value={formData.quantidade_pessoas}
                onChange={(e) => setFormData({ ...formData, quantidade_pessoas: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="sug-date" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={16} /> Data Desejada
              </label>
              <input 
                type="date" 
                id="sug-date"
                className="input-field" 
                required
                value={formData.data_reserva}
                onChange={(e) => setFormData({ ...formData, data_reserva: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label" htmlFor="sug-start" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={16} /> Hora de Chegada
                </label>
                <input 
                  type="time" 
                  id="sug-start"
                  className="input-field" 
                  required
                  value={formData.hora_inicio}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="sug-end" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={16} /> Hora de Saída
                </label>
                <input 
                  type="time" 
                  id="sug-end"
                  className="input-field" 
                  required
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Consultar Menor Mesa Livre'}
            </button>
          </form>
        </div>

        {/* Suggestion Result Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {loading ? (
            <div className="card glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
              <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%' }}></div>
            </div>
          ) : !hasSearched ? (
            <div className="card glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))', borderStyle: 'dashed' }}>
              <Sparkles size={48} style={{ marginBottom: '1rem', color: 'hsl(var(--primary) / 0.5)' }} />
              <h3>Aguardando Consulta</h3>
              <p style={{ maxWidth: '300px', fontSize: '0.9rem', marginTop: '0.5rem' }}>Preencha os dados ao lado e clique em buscar para processar o algoritmo de sugestão.</p>
            </div>
          ) : suggestedTable ? (
            /* Table suggestion matches! */
            <div className="card glass-panel animate-pulse-glow" style={{ flex: 1, border: '2px solid hsl(var(--success))', display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ borderBottomColor: 'hsl(var(--success) / 0.2)' }}>
                <h3 className="card-title" style={{ color: 'hsl(var(--success))' }}>
                  <ShieldCheck size={20} /> Mesa Recomendada Encontrada!
                </h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid hsl(var(--success) / 0.4)' }}>
                    <span style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-title)' }}>{suggestedTable.numero}</span>
                  </div>
                  <strong style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>Mesa {suggestedTable.numero}</strong>
                </div>

                <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem' }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Capacidade da Mesa:</span>
                    <strong>{suggestedTable.capacidade} Pessoas</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem' }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Setor / Localização:</span>
                    <strong>{suggestedTable.localizacao}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.925rem' }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Tamanho do Grupo:</span>
                    <strong>{formData.quantidade_pessoas} Pessoas</strong>
                  </div>
                </div>

                <button className="btn btn-success" onClick={handleBook} style={{ width: '100%', maxWidth: '320px', display: 'flex', gap: '0.5rem', padding: '0.75rem', marginTop: '0.5rem' }}>
                  Avançar para Agendamento <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* No suggestion found (fully occupied/maintenance) */
            <div className="card glass-panel" style={{ flex: 1, border: '2px solid hsl(var(--destructive) / 0.5)', display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ borderBottomColor: 'hsl(var(--destructive) / 0.2)' }}>
                <h3 className="card-title" style={{ color: 'hsl(var(--destructive))' }}>
                  <ShieldAlert size={20} /> Sem Mesas Livres
                </h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', textAlign: 'center', flex: 1 }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={36} />
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Capacidade Limite Atingida</h4>
                <p style={{ maxWidth: '320px', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                  Não há nenhuma mesa livre com capacidade para {formData.quantidade_pessoas} pessoas sem conflito de horário em {formData.data_reserva.split('-').reverse().join('/')} às {formData.hora_inicio}.
                </p>

                <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-outline" onClick={() => { setActivePage('espera'); triggerToast('info', 'Lista de Espera', 'Adicione o cliente informando o horário de preferência.'); }} style={{ width: '100%' }}>
                    Ir para Lista de Espera
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
