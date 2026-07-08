import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { History, Trash2, HelpCircle, ShieldCheck, CalendarRange, Clock, Settings, AlertTriangle, Sparkles } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HistoricoLogs({ triggerToast, refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs'); // logs, regras
  const [showConfirm, setShowConfirm] = useState(false);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await apiService.getLogs();
      setLogs(data);
    } catch (err) {
      triggerToast('destructive', 'Erro', 'Não foi possível carregar os logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [refreshTrigger]);

  const handleClearLogs = () => {
    setShowConfirm(true);
  };

  const confirmClearLogs = async () => {
    try {
      await apiService.clearLogs();
      triggerToast('success', 'Histórico Limpo', 'Os logs foram reiniciados.');
      loadLogs();
    } catch (err) {
      triggerToast('destructive', 'Erro', 'Erro ao limpar logs.');
    } finally {
      setShowConfirm(false);
    }
  };

  const getLogBadgeClass = (event) => {
    switch (event) {
      case 'SISTEMA': return 'badge-active';
      case 'CLIENTE': return 'badge-confirmed';
      case 'MESA': return 'badge-maintenance';
      case 'RESERVA': return 'badge-pending';
      case 'ESPERA': return 'badge-pending';
      case 'NO-SHOW': return 'badge-noshow';
      case 'BLOQUEIO': return 'badge-noshow';
      case 'ALERTA': return 'badge-noshow';
      default: return 'badge-finished';
    }
  };

  const formatTimestamp = (isoStr) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Histórico & Regras</h1>
          <p className="page-subtitle">Consulte o log de auditoria do banco de dados e as regras de validação.</p>
        </div>
        {activeTab === 'logs' && (
          <button className="btn btn-destructive btn-sm btn-icon" onClick={handleClearLogs} title="Limpar Logs">
            <Trash2 size={16} /> Limpar Auditoria
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-list">
        <button 
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs de Auditoria ({logs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'regras' ? 'active' : ''}`}
          onClick={() => setActiveTab('regras')}
        >
          Validador de Regras de Negócio (12 Regras)
        </button>
      </div>

      {activeTab === 'logs' ? (
        /* Logs Viewer */
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><History size={18} /> Histórico de Alterações</h3>
            <span className="card-subtitle">Operações e validações de regras registradas no banco em tempo real.</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto' }}></div>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                Nenhum log gravado. As ações no sistema gerarão auditoria aqui.
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Data / Hora</th>
                      <th style={{ width: '120px' }}>Categoria</th>
                      <th>Evento / Ação Realizada</th>
                      <th>Metadados / Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ backgroundColor: log.event === 'ALERTA' || log.event === 'BLOQUEIO' ? 'hsl(var(--destructive) / 0.04)' : 'inherit' }}>
                        <td style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td>
                          <span className={`badge ${getLogBadgeClass(log.event)}`} style={{ fontSize: '0.65rem' }}>
                            {log.event}
                          </span>
                        </td>
                        <td style={{ fontWeight: '550', fontSize: '0.925rem' }}>
                          {log.description}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Business Rules Guide for Presentation */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ backgroundColor: 'hsl(var(--primary) / 0.03)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
            <div className="card-body" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <HelpCircle size={24} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: '0.25rem' }} />
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>Apresentação Acadêmica - Guia Prático</h4>
                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                  Durante a avaliação, o professor poderá solicitar modificações ou explicações sobre as validações abaixo. Este frontend implementa 100% delas no arquivo de serviço em JavaScript para demonstração completa das regras.
                </p>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Rules Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 1. Número da Mesa Único
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  O sistema impede o cadastro ou alteração de mesa com um número duplicado em relação a outras mesas ativas do restaurante.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 2. Duração Padrão de 2 Horas
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Ao preencher a hora de início no agendamento da reserva, o sistema calcula e preenche automaticamente o horário de saída com 2 horas de acréscimo.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 3. Sem Conflitos de Horário
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Verificação de sobreposição de horários `(início &lt; fim_existente e fim &gt; início_existente)` para reservas ativas na mesma mesa na data especificada.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 4. Capacidade da Mesa Respeitada
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  O número de pessoas inserido no formulário de reserva é testado contra a capacidade máxima cadastrada na mesa antes de permitir o salvamento.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 5. Transições Validadas
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  As mudanças de status seguem a máquina de estados: Pendente &rarr; Confirmada &rarr; Em Atendimento &rarr; Finalizada. Caso tente burlar o fluxo (ex: direto de Pendente para Finalizada), a transição é bloqueada.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 6. Atrasos Geram Não Compareceu
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Se o cliente atrasar mais de 20 minutos (simulado no botão de ação da reserva), o sistema permite registrar o Não Compareceu, disparando penalidade.
                </p>
              </div>
            </div>

            {/* Rules Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 7. Bloqueio após 3 Não Comparecimentos
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Se um cliente atingir 3 Não Comparecimentos cadastrados na sua ficha, sua conta é bloqueada por 7 dias. O validador do banco impede novas reservas nesse período.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 8. Fila de Espera Automática
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Sem mesas disponíveis na data/horário em reservas ou no sugestor, o sistema avisa o usuário e oferece um atalho para registrar a demanda na lista de espera.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 9. Cancelamentos Verificam Espera
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Ao cancelar uma reserva ativa, se houver clientes na lista de espera compatíveis com a mesa liberada naquela data, o sistema exibe um alerta interativo oferecendo a acomodação imediata.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 10. Bloqueio por Manutenção
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Mesas marcadas com status "Em Manutenção" são desconsideradas pelo motor de busca de mesas e não podem ser selecionadas manualmente em reservas.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} style={{ color: 'hsl(var(--success))' }} /> 11. Histórico Completo
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Toda criação, alteração de dados, deleção ou modificação de status de mesas, clientes, reservas e fila gera logs automáticos na aba de auditoria.
                </p>
              </div>

              <div className="card" style={{ padding: '1.25rem', border: '2px solid hsl(var(--primary))' }}>
                <h4 style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '1.05rem', fontWeight: '800', color: 'hsl(var(--primary))', marginBottom: '0.75rem' }}>
                  <Sparkles size={18} /> 12. Desafio Obrigatório - Menor Mesa Livre
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Nossa função de sugestão filtra mesas adequadas pelo tamanho do grupo e sem conflitos, ordenando-as por capacidade de forma ascendente, alocando a menor mesa disponível e prevenindo o desperdício de mesas grandes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={showConfirm} 
        title="Limpar Histórico" 
        message="Tem certeza que deseja limpar todo o histórico de logs de auditoria? Esta ação é permanente." 
        onConfirm={confirmClearLogs} 
        onCancel={() => setShowConfirm(false)} 
      />
    </div>
  );
}
