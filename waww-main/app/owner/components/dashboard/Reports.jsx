import React from 'react';
import s from './Reports.module.css';

export default function Reports() {
  const [period, setPeriod] = React.useState('This Week');
  const [isOpen, setIsOpen] = React.useState(false);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePeriodChange = (p) => {
    setPeriod(p);
    setIsOpen(false);
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>Analytics & Reports</h1>
        <div style={{ position: 'relative' }}>
          <div className={s.periodSelector} onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
            {period} ▾
          </div>
          {isOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10, minWidth: '120px' }}>
              {['Today', 'This Week', 'This Month', 'This Year'].map(p => (
                <div key={p} onClick={() => handlePeriodChange(p)} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #F3F4F6' }}>
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={s.summaryCards}>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Total Revenue</p>
          <p className={s.cardValue}>0 DZD</p>
        </div>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Total Reservations</p>
          <p className={s.cardValue}>0</p>
        </div>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Avg Daily Revenue</p>
          <p className={s.cardValue}>0 DZD</p>
        </div>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Peak Occupancy</p>
          <p className={s.cardValue}>0%</p>
        </div>
      </div>

      <div className={s.chartsGrid}>
        <div className={s.chartCard}>
          <h3>Monthly Revenue</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              <line x1="40" y1="200" x2="480" y2="200" stroke="#E5E7EB" strokeWidth="2" />
              <text x="30" y="20" fontSize="12" fill="#6B7280" textAnchor="end">50K DZD</text>
              <text x="30" y="200" fontSize="12" fill="#6B7280" textAnchor="end">0</text>
              {months.map((m, i) => (
                <g key={m}>
                  <rect x={60 + i * 70} y="200" width="40" height="0" fill="#4DCCE7" rx="4" />
                  <text x={80 + i * 70} y="220" fontSize="12" fill="#6B7280" textAnchor="middle">{m}</text>
                </g>
              ))}
            </svg>
            <div className={s.overlayText}>No revenue data yet</div>
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Weekly Occupancy %</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              <line x1="40" y1="200" x2="480" y2="200" stroke="#E5E7EB" strokeWidth="2" />
              <polyline fill="none" stroke="#1A2FA8" strokeWidth="3" points="60,200 130,200 200,200 270,200 340,200 410,200 480,200" />
              {days.map((d, i) => (
                <text key={d} x={60 + i * 70} y="220" fontSize="12" fill="#6B7280" textAnchor="middle">{d}</text>
              ))}
            </svg>
            <div className={s.overlayText}>No occupancy data</div>
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Reservation Status</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              <circle cx="250" cy="125" r="80" fill="none" stroke="#EAEDF7" strokeWidth="20" />
              <text x="250" y="130" fontSize="14" fill="#6B7280" textAnchor="middle">No reservations yet</text>
            </svg>
            <div className={s.legend}>
              <span className={s.legendItem}><span style={{background: '#10B981'}}></span>Completed 0%</span>
              <span className={s.legendItem}><span style={{background: '#EF4444'}}></span>Cancelled 0%</span>
              <span className={s.legendItem}><span style={{background: '#4DCCE7'}}></span>Active 0%</span>
              <span className={s.legendItem}><span style={{background: '#F59E0B'}}></span>Pending 0%</span>
            </div>
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Top Spaces by Revenue</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              {[1,2,3,4,5].map((p, i) => (
                <g key={p}>
                  <text x="40" y={40 + i * 40} fontSize="14" fill="#12183A" textAnchor="end">P{p}</text>
                  <rect x="50" y={28 + i * 40} width="0" height="16" fill="#1A2FA8" rx="4" />
                </g>
              ))}
            </svg>
            <div className={s.overlayText}>No revenue data yet</div>
          </div>
        </div>
      </div>

      <div className={s.exportActions}>
        <button className={s.exportBtn}>↓ Export PDF</button>
        <button className={s.exportBtn}>↓ Export CSV</button>
      </div>
    </div>
  );
}
