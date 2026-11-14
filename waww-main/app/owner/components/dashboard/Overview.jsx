import React, { useContext } from 'react';
import s from './Overview.module.css';
import { LangContext } from './LangContext';

export default function Overview({ owner, dashboardData }) {
  const { t, lang } = useContext(LangContext);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? (t.goodMorning || 'Good morning') : hour < 18 ? (t.goodAfternoon || 'Good afternoon') : (t.goodEvening || 'Good evening');
  
  // Localize date formatting automatically based on selected language
  const locale = lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB';
  const dateStr = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Use the dynamic dashboard data
  const KPI_DATA = [
    { label: t.totalSpaces || 'Total Spaces', value: dashboardData?.total_places?.toString() || '0', note: t.noteTotal || 'Based on your capacity', icon: 'P', iconBg: 'rgba(77,204,231,0.12)' },
    { label: t.available || 'Available', value: dashboardData?.available_places?.toString() || '0', note: t.noteAvailable || 'Ready for booking', icon: '○', iconBg: 'rgba(16,185,129,0.10)' },
    { label: t.occupied || 'Occupied', value: dashboardData?.occupied_places?.toString() || '0', note: t.noteOccupied || 'Currently in use', icon: '●', iconBg: 'rgba(26,47,168,0.10)' },
    { label: t.unavailable || 'Unavailable', value: dashboardData?.unavailable_places?.toString() || '0', note: t.noteUnavailable || 'Disabled / Maintenance', icon: '✕', iconBg: 'rgba(239,68,68,0.10)' },
    { label: t.revenue || 'Monthly Revenue', value: `${dashboardData?.revenue || 0} DZD`, note: t.noteRevenue || 'Actual stored data', icon: '◈', iconBg: 'rgba(245,158,11,0.10)' },
    { label: t.reservationsCount || 'Reservations Count', value: dashboardData?.reservations_count?.toString() || '0', note: t.noteReservations || 'Real reservations', icon: '⊡', iconBg: 'rgba(77,204,231,0.10)' },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const occData = dashboardData?.occupancy_trend || [0, 0, 0, 0, 0, 0, 0];
  const hasOccData = occData.some(v => v > 0);
  const occPoints = occData.map((val, i) => {
    const x = 32 + i * 76.3;
    const y = 168 - (Math.min(100, Math.max(0, val)) / 100) * 120;
    return `${x},${y}`;
  }).join(' ');

  const revData = dashboardData?.revenue_trend || [0, 0, 0, 0, 0, 0, 0];
  const maxRev = Math.max(...revData, 1);
  const hasRevData = revData.some(v => v > 0);

  const activities = dashboardData?.recent_activity || [];

  return (
    <div className={s.overview}>
      <div className={s.header}>
        <div>
          <h1 className={s.greeting}>{greeting}, {owner.fullName}</h1>
          <p className={s.subtitle}>{t.performanceOverview || 'Here is your parking performance overview'}</p>
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
          <h3>{t.occupancyTrend || 'Occupancy Trend'}</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 200" className={s.svgChart}>
              {hasOccData && (
                <polygon 
                  points={`32,168 ${occPoints} 490,168`} 
                  fill="url(#grad1)" 
                />
              )}
              <polyline 
                fill="none" 
                stroke="#1A2FA8" 
                strokeWidth="3" 
                points={hasOccData ? occPoints : "32,168 100,168 178,168 256,168 334,168 412,168 490,168"} 
              />
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
            {!hasOccData && <div className={s.overlayText}>{t.noDataYet || 'No data yet'}</div>}
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>{t.revenueTrend || 'Revenue Trend'}</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 200" className={s.svgChart}>
              <line x1="32" y1="168" x2="490" y2="168" stroke="#E5E7EB" strokeWidth="2" />
              {days.map((d, i) => {
                const val = revData[i] || 0;
                const barHeight = hasRevData ? (val / maxRev) * 120 : 0;
                return (
                  <g key={d}>
                    <rect 
                      x={16 + i * 76.3} 
                      y={168 - barHeight} 
                      width="32" 
                      height={barHeight} 
                      fill="url(#grad2)" 
                      rx="4" 
                    />
                    <text x={32 + i * 76.3} y="190" fontSize="12" fill="#6B7280" textAnchor="middle">{d}</text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4DCCE7', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#1A2FA8', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
            </svg>
            {!hasRevData && <div className={s.overlayText}>{t.noRevenueDataYet || 'No revenue data yet'}</div>}
          </div>
        </div>
      </div>

      <div className={s.recentActivity}>
        <h3>{t.recentActivity || 'Recent Activity'}</h3>
        {activities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
            {activities.map((act) => (
              <div 
                key={act.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: '#F9FAFB', 
                  padding: '14px 18px', 
                  borderRadius: '12px', 
                  border: '1px solid #E5E7EB' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(26,47,168,0.1)', color: '#1A2FA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    P
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#111827' }}>{act.driver_name}</strong>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>
                      {act.plate_number} • Spot {act.spot_name} ({act.parking_name})
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#1A2FA8', fontSize: '14px' }}>{act.price} DZD</div>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 8px', 
                    borderRadius: '10px', 
                    fontWeight: '600',
                    background: act.status === 'active' ? '#ECFDF5' : act.status === 'checked_in' ? '#EFF6FF' : '#F3F4F6',
                    color: act.status === 'active' ? '#059669' : act.status === 'checked_in' ? '#2563EB' : '#4B5563'
                  }}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={s.emptyActivity}>
            <div className={s.emptyIcon}>◷</div>
            <p className={s.emptyTitle}>{t.noActivityYet || 'No activity yet'}</p>
            <p className={s.emptyText}>{t.activityWillAppear || 'Activity will appear here once drivers start using your parking.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
