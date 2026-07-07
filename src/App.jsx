import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Mesas from './pages/Mesas';
import Reservas from './pages/Reservas';
import ListaEspera from './pages/ListaEspera';
import SugestaoMesa from './pages/SugestaoMesa';
import HistoricoLogs from './pages/HistoricoLogs';
import { apiService } from './services/apiService';
import { ChefHat, Menu, X, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import './App.css';
import './styles/components.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('gourmet_theme') || 'light');
  const [toasts, setToasts] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Dashboard & Sidebar visual stats
  const [stats, setStats] = useState({ occupiedCount: 0, totalTables: 0, waitingCount: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Prefill suggestion link
  const [preFillData, setPreFillData] = useState(null);

  // Waitlist Promotion Prompts
  const [promotionPrompt, setPromotionPrompt] = useState(null);

  // Sync theme attribute to HTML tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gourmet_theme', theme);
  }, [theme]);

  // Load global stats
  const fetchStats = async () => {
    try {
      const [tData, wData] = await Promise.all([
        apiService.getTables(),
        apiService.getWaitingList()
      ]);
      const occupied = tData.filter(t => t.status === 'ocupada').length;
      const waiting = wData.filter(w => w.status === 'Pendente').length;
      setStats({
        occupiedCount: occupied,
        totalTables: tData.length,
        waitingCount: waiting
      });
    } catch (err) {
      console.error('Erro ao calcular estatísticas', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Toast Management
  const triggerToast = (type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);

    // Refresh general log indicators when an event changes
    setRefreshTrigger(prev => prev + 1);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Execute promotion of waiting customer from release trigger
  const handleExecutePromotion = async () => {
    if (!promotionPrompt) return;
    try {
      await apiService.promoteFromWaitingList(promotionPrompt.esperaId, promotionPrompt.mesaId);
      triggerToast('success', 'Cliente Acomodado!', `O cliente da fila '${promotionPrompt.clienteNome}' foi agendado com sucesso para a Mesa ${promotionPrompt.mesaNumero}.`);
      setPromotionPrompt(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      triggerToast('destructive', 'Erro ao alocar', err.message);
    }
  };

  // Page switcher
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard triggerToast={triggerToast} />;
      case 'clientes':
        return <Clientes triggerToast={triggerToast} onClientChange={() => setRefreshTrigger(prev => prev + 1)} />;
      case 'mesas':
        return <Mesas triggerToast={triggerToast} onTableChange={() => setRefreshTrigger(prev => prev + 1)} />;
      case 'reservas':
        return (
          <Reservas 
            triggerToast={triggerToast} 
            onReservationChange={() => setRefreshTrigger(prev => prev + 1)}
            openWaitingPromotionPrompt={(prompt) => setPromotionPrompt(prompt)}
            preFillData={preFillData}
            clearPreFill={() => setPreFillData(null)}
          />
        );
      case 'espera':
        return <ListaEspera triggerToast={triggerToast} onWaitlistChange={() => setRefreshTrigger(prev => prev + 1)} />;
      case 'sugestao':
        return (
          <SugestaoMesa 
            triggerToast={triggerToast} 
            setActivePage={setActivePage} 
            setPreFillData={setPreFillData} 
          />
        );
      case 'logs':
        return <HistoricoLogs triggerToast={triggerToast} refreshTrigger={refreshTrigger} />;
      default:
        return <Dashboard triggerToast={triggerToast} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <ChefHat size={24} style={{ color: 'hsl(var(--primary))' }} />
          <h3>GourmetReserve</h3>
        </div>
        <button 
          onClick={() => setMobileNavOpen(!mobileNavOpen)} 
          className="mobile-nav-toggle"
          aria-label="Abrir menu"
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <div className={`sidebar-wrapper ${mobileNavOpen ? 'open' : ''}`}>
        {mobileNavOpen && <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)}></div>}
        <Sidebar 
          activePage={activePage} 
          setActivePage={(page) => {
            setActivePage(page);
            setMobileNavOpen(false);
          }} 
          theme={theme}
          toggleTheme={toggleTheme}
          stats={stats}
        />
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Interactive Waiting List Promotion Overlay */}
      {promotionPrompt && (
        <div className="modal-backdrop" style={{ zIndex: 1001 }}>
          <div className="modal-content animate-pulse-glow" style={{ border: '2px solid hsl(var(--primary))', maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))' }}>
                <ArrowUpRight size={20} /> Mesa Disponível Encontrada!
              </h3>
              <button type="button" className="toast-close" onClick={() => setPromotionPrompt(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                A <strong>Mesa {promotionPrompt.mesaNumero}</strong> foi liberada, e identificamos um cliente compatível na fila de espera desejando esta data:
              </p>
              <div style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
                <div>Cliente: <strong>{promotionPrompt.clienteNome}</strong></div>
                <div>Grupo: <strong>{promotionPrompt.quantidade} pessoas</strong></div>
                <div>Horário: <strong>{promotionPrompt.hora}</strong></div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', marginTop: '1rem' }}>
                Deseja acomodar este cliente promovendo-o da fila de espera automaticamente agora?
              </p>
            </div>
            <div className="card-footer">
              <button type="button" className="btn btn-outline" onClick={() => setPromotionPrompt(null)}>Manter Livre</button>
              <button type="button" className="btn btn-primary" onClick={handleExecutePromotion} style={{ display: 'flex', gap: '0.35rem' }}>
                <CheckCircle2 size={16} /> Acomodar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
