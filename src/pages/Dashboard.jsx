import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { 
  Calendar, 
  Percent, 
  AlertCircle, 
  Users, 
  Hourglass, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

export default function Dashboard({ triggerToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const result = await apiService.getDashboardData(selectedDate);
        setData(result);
      } catch (err) {
        triggerToast('destructive', 'Erro', 'Não foi possível carregar os dados do painel.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [selectedDate]);

  if (loading || !data) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid hsl(var(--border))', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%' }}></div>
      </div>
    );
  }

  // Calculate coordinates for custom SVG chart
  const peakHoursData = data.peakHours.length > 0 ? data.peakHours : [
    { time: '12:00', count: 0 },
    { time: '13:00', count: 0 },
    { time: '14:00', count: 0 },
    { time: '18:00', count: 0 },
    { time: '19:00', count: 0 },
    { time: '20:00', count: 0 },
    { time: '21:00', count: 0 },
    { time: '22:00', count: 0 }
  ];

  // Sort chronological for display in chart
  const chronHours = [...peakHoursData].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const maxVal = Math.max(...chronHours.map(d => d.count), 1);
  const svgWidth = 500;
  const svgHeight = 200;
  const padding = 30;
  const graphWidth = svgWidth - padding * 2;
  const graphHeight = svgHeight - padding * 2;
  const barWidth = chronHours.length > 0 ? (graphWidth / chronHours.length) - 10 : 30;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do fluxo e ocupação do restaurante.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="label" htmlFor="dashboard-date-picker">Filtrar Data:</label>
          <input 
            type="date" 
            id="dashboard-date-picker"
            className="input-field" 
            style={{ width: 'auto' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Reservas do Dia</span>
            <span className="kpi-value">{data.totalReservasDia}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Ocupação Atual</span>
            <span className="kpi-value">{data.taxaOcupacao}%</span>
            <span className="card-subtitle" style={{ fontSize: '0.75rem' }}>{data.occupiedCount} de {data.totalTables} mesas ocupadas</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))' }}>
            <Percent size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Taxa de Não Compareceu</span>
            <span className="kpi-value">{data.taxaNoShow}%</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}>
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Pessoas em Espera</span>
            <span className="kpi-value">{data.waitingToday}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning-foreground))' }}>
            <Hourglass size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-label">Média Pessoas / Reserva</span>
            <span className="kpi-value">{data.mediaPessoas}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Peak Hours Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><TrendingUp size={18} /> Horários de Pico</h3>
            <span className="card-subtitle">Reservas ativas agrupadas por horário.</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
            {data.peakHours.length === 0 ? (
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Nenhum dado registrado para esta data.</p>
            ) : (
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary) / 0.4)" />
                  </linearGradient>
                </defs>
                {/* Y Gridlines and Labels */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = padding + graphHeight * (1 - ratio);
                  const labelVal = Math.round(maxVal * ratio);
                  return (
                    <g key={i}>
                      <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                      <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="600">
                        {labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {chronHours.map((d, index) => {
                  const x = padding + index * (graphWidth / chronHours.length) + 5;
                  const ratio = d.count / maxVal;
                  const barHeight = graphHeight * ratio;
                  const y = padding + graphHeight - barHeight;

                  return (
                    <g key={d.time} style={{ cursor: 'pointer' }}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill="url(#barGradient)"
                        rx="4"
                        style={{ transition: 'all 0.3s ease' }}
                      />
                      <text
                        x={x + barWidth / 2}
                        y={padding + graphHeight + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="hsl(var(--muted-foreground))"
                      >
                        {d.time}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="hsl(var(--foreground))"
                      >
                        {d.count > 0 ? d.count : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Daily Bookings List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Clock size={18} /> Reservas para {selectedDate.split('-').reverse().join('/')}</h3>
            <span className="badge badge-confirmed">{data.todayBookings.length} Reservas</span>
          </div>
          <div className="card-body" style={{ overflowY: 'auto', maxHeight: '240px', padding: 0 }}>
            {data.todayBookings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                Nenhuma reserva registrada para hoje.
              </div>
            ) : (
              <table className="custom-table" style={{ border: 'none' }}>
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Mesa</th>
                    <th>Pessoas</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.todayBookings.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: '600' }}>{b.hora_inicio} - {b.hora_fim}</td>
                      <td>Mesa {b.id_mesa}</td>
                      <td>{b.quantidade_pessoas} pessoas</td>
                      <td>
                        <span className={`badge badge-${
                          b.status === 'Confirmada' ? 'confirmed' :
                          b.status === 'Pendente' ? 'pending' :
                          b.status === 'Em Atendimento' ? 'active' :
                          b.status === 'Finalizada' ? 'finished' :
                          b.status === 'No Show' ? 'noshow' : 'cancelled'
                        }`}>
                          {b.status === 'No Show' ? 'Não Compareceu' : b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
