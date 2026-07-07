import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Utensils, 
  Calendar, 
  Clock, 
  Sparkles, 
  History,
  Sun, 
  Moon,
  ChefHat
} from 'lucide-react';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  theme, 
  toggleTheme, 
  stats = { occupiedCount: 0, totalTables: 0, waitingCount: 0 } 
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'mesas', label: 'Mesas', icon: Utensils },
    { id: 'reservas', label: 'Reservas', icon: Calendar },
    { id: 'espera', label: 'Lista de Espera', icon: Clock, badge: stats.waitingCount },
    { id: 'sugestao', label: 'Sugerir Mesa', icon: Sparkles },
    { id: 'logs', label: 'Histórico & Regras', icon: History }
  ];

  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <ChefHat size={28} />
        </div>
        <div className="brand-name">
          <h2>GourmetReserve</h2>
          <span>Sistema Avançado</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button 
                  onClick={() => setActivePage(item.id)}
                  className={`nav-link-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info & Theme Toggle */}
      <div className="sidebar-footer">
        {stats.totalTables > 0 && (
          <div className="sidebar-occupancy-widget">
            <div className="widget-header">
              <span>Ocupação de Mesas</span>
              <span>{stats.occupiedCount}/{stats.totalTables}</span>
            </div>
            <div className="widget-bar-bg">
              <div 
                className="widget-bar-fill" 
                style={{ width: `${(stats.occupiedCount / stats.totalTables) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="theme-toggle-row">
          <span>Modo {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title="Alternar tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
