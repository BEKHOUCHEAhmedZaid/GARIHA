import React from 'react';
import s from './Overview.module.css';

export default function Overview({ owner, dashboardData }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Use the dynamic dashboard data
  const KPI_DATA = [
    { label: 'Total Spaces', value: dashboardData?.total_places?.toString() || '0', note: 'Based on your capacity', icon: 'P', iconBg: 'rgba(77,204,231,0.12)' },
    { label: 'Available', value: dashboardData?.available_places?.toString() || '0', note: 'Ready for booking', icon: '○', iconBg: 'rgba(16,185,129,0.10)' },
    { label: 'Occupied', value: dashboardData?.occupied_places?.toString() || '0', note: 'Currently in use', icon: '●', iconBg: 'rgba(26,47,168,0.10)' },
    { label: 'Unavailable', value: dashboardData?.unavailable_places?.toString() || '0', note: 'Disabled / Maintenance', icon: '✕', iconBg: 'rgba(239,68,68,0.10)' },
    { label: 'Monthly Revenue', value: `${dashboardData?.revenue || 0} DZD`, note: 'Actual stored data', icon: '◈', iconBg: 'rgba(245,158,11,0.10)' },
    { label: 'Reservations Count', value: dashboardData?.reservations_count?.toString() || '0', note: 'Real reservations', icon: '⊡', iconBg: 'rgba(77,204,231,0.10)' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={s.overview}>
      <div className={s.header}>
        <div>
          <h1 className={s.greeting}>{greeting}, {owner.fullName}</h1>
          <p className={s.subtitle}>Here is your parking performance overview</p>
        </div>
        <div className={s.dateChip}>{dateStr}</div>
      </div>



      <div className={s.kpiGrid}>
        {KPI_DATA.map((kpi, i) => (
          <div key={i} className={s.kpiCard}>
            <div className={s.kpiIcon} style={{ background: kpi.iconBg }}>{kpi.icon}</div>
            <div className={s.kpiBody}>
              <p className={s.kpiLabel}>{kpi.label}</p>
              <p className={s.kpiValue}>{kpi.value}</p>
              <p className={s.kpiNote}>{kpi.note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={s.chartsGrid}>
        <div className={s.chartCard}>
          <h3>Occupancy Trend</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 200" className={s.svgChart}>
              <path d="M 32 168 L 100 168 L 178 168 L 256 168 L 334 168 L 412 168 L 490 168 L 490 168 L 32 168 Z" fill="url(#grad1)" />
              <polyline fill="none" stroke="#1A2FA8" strokeWidth="3" points="32,168 100,168 178,168 256,168 334,168 412,168 490,168" />
              <line x1="32" y1="168" x2="490" y2="168" stroke="#E5E7EB" strokeWidth="2" />
              {days.map((d, i) => (
                <text key={d} x={32 + i * 76.3} y="190" fontSize="12" fill="#6B7280" textAnchor="middle">{d}</text>
              ))}
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#1A2FA8', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#1A2FA8', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className={s.overlayText}>No data yet</div>
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Revenue Trend</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 200" className={s.svgChart}>
              <line x1="32" y1="168" x2="490" y2="168" stroke="#E5E7EB" strokeWidth="2" />
              {days.map((d, i) => (
                <g key={d}>
                  <rect x={16 + i * 76.3} y="168" width="32" height="0" fill="url(#grad2)" rx="4" />
                  <text x={32 + i * 76.3} y="190" fontSize="12" fill="#6B7280" textAnchor="middle">{d}</text>
                </g>
              ))}
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4DCCE7', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#1A2FA8', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className={s.overlayText}>No revenue data yet</div>
          </div>
        </div>
      </div>

      <div className={s.recentActivity}>
        <h3>Recent Activity</h3>
        <div className={s.emptyActivity}>
          <div className={s.emptyIcon}>◷</div>
          <p className={s.emptyTitle}>No activity yet</p>
          <p className={s.emptyText}>Activity will appear here once drivers start using your parking.</p>
        </div>
      </div>
    </div>
  );
}
