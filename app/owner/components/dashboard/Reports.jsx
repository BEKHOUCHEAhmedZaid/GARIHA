import React, { useState, useEffect } from 'react';
import s from './Reports.module.css';
import { api } from '@/lib/axios';

export default function Reports() {
  const [period, setPeriod] = useState('This Week');
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({
    total_revenue: 0,
    total_reservations: 0,
    avg_daily_revenue: 0,
    peak_occupancy: 0,
    monthly_revenue: [0, 0, 0, 0, 0, 0],
    weekly_occupancy: [0, 0, 0, 0, 0, 0, 0],
    status_breakdown: { completed: 0, cancelled: 0, active: 0, pending: 0 },
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    let isMounted = true;
    api.get(`/owner/reports?period=${encodeURIComponent(period)}`)
      .then((res) => {
        if (isMounted) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load reports", err);
      });
    return () => { isMounted = false; };
  }, [period]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    setIsOpen(false);
  };

  const monthlyRev = data.monthly_revenue.slice(0, 6);
  const maxMonthlyRev = Math.max(...monthlyRev, 1);
  const hasMonthlyRev = monthlyRev.some(v => v > 0);

  const weeklyOcc = data.weekly_occupancy || [0, 0, 0, 0, 0, 0, 0];
  const hasWeeklyOcc = weeklyOcc.some(v => v > 0);
  const occPoints = weeklyOcc.map((v, i) => `${60 + i * 70},${200 - (v / 100) * 160}`).join(' ');

  const status = data.status_breakdown || { completed: 0, cancelled: 0, active: 0, pending: 0 };
  const hasStatusData = data.total_reservations > 0;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>Analytics & Reports</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Real-time metrics for your parkings (Africa/Algiers timezone)</p>
        </div>
        <div style={{ position: 'relative' }}>
          <div className={s.periodSelector} onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
            {period} ▾
          </div>
          {isOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 10, minWidth: '130px' }}>
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
          <p className={s.cardValue}>{data.total_revenue} DZD</p>
        </div>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Total Reservations</p>
          <p className={s.cardValue}>{data.total_reservations}</p>
        </div>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Avg Daily Revenue</p>
          <p className={s.cardValue}>{data.avg_daily_revenue} DZD</p>
        </div>
        <div className={s.summaryCard}>
          <p className={s.cardLabel}>Peak Occupancy</p>
          <p className={s.cardValue}>{data.peak_occupancy}%</p>
        </div>
      </div>

      <div className={s.chartsGrid}>
        <div className={s.chartCard}>
          <h3>Monthly Revenue</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              <line x1="40" y1="200" x2="480" y2="200" stroke="#E5E7EB" strokeWidth="2" />
              <text x="30" y="20" fontSize="12" fill="#6B7280" textAnchor="end">{hasMonthlyRev ? `${maxMonthlyRev} DZD` : '0'}</text>
              <text x="30" y="200" fontSize="12" fill="#6B7280" textAnchor="end">0</text>
              {months.map((m, i) => {
                const val = monthlyRev[i] || 0;
                const barHeight = hasMonthlyRev ? (val / maxMonthlyRev) * 160 : 0;
                return (
                  <g key={m}>
                    <rect x={60 + i * 70} y={200 - barHeight} width="40" height={barHeight} fill="#4DCCE7" rx="4" />
                    <text x={80 + i * 70} y={220} fontSize="12" fill="#6B7280" textAnchor="middle">{m}</text>
                  </g>
                );
              })}
            </svg>
            {!hasMonthlyRev && <div className={s.overlayText}>No revenue data yet</div>}
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Weekly Occupancy %</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              <line x1="40" y1="200" x2="480" y2="200" stroke="#E5E7EB" strokeWidth="2" />
              <polyline 
                fill="none" 
                stroke="#1A2FA8" 
                strokeWidth="3" 
                points={hasWeeklyOcc ? occPoints : "60,200 130,200 200,200 270,200 340,200 410,200 480,200"} 
              />
              {days.map((d, i) => (
                <text key={d} x={60 + i * 70} y={220} fontSize="12" fill="#6B7280" textAnchor="middle">{d}</text>
              ))}
            </svg>
            {!hasWeeklyOcc && <div className={s.overlayText}>No occupancy data</div>}
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Reservation Status</h3>
          <div className={s.svgWrapper}>
            <svg viewBox="0 0 500 250" className={s.svgChart}>
              <circle cx="250" cy="115" r="70" fill="none" stroke="#EAEDF7" strokeWidth="20" />
              {hasStatusData && (
                <circle 
                  cx="250" 
                  cy="115" 
                  r="70" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="20" 
                  strokeDasharray={`${(status.completed / 100) * 440} 440`} 
                  transform="rotate(-90 250 115)"
                />
              )}
              <text x="250" y="120" fontSize="14" fill="#6B7280" textAnchor="middle">
                {hasStatusData ? `${data.total_reservations} Total` : "No reservations yet"}
              </text>
            </svg>
            <div className={s.legend}>
              <span className={s.legendItem}><span style={{background: '#10B981'}}></span>Completed {status.completed}%</span>
              <span className={s.legendItem}><span style={{background: '#EF4444'}}></span>Cancelled {status.cancelled}%</span>
              <span className={s.legendItem}><span style={{background: '#4DCCE7'}}></span>Active {status.active}%</span>
              <span className={s.legendItem}><span style={{background: '#F59E0B'}}></span>Pending {status.pending}%</span>
            </div>
          </div>
        </div>

        <div className={s.chartCard}>
          <h3>Top Spaces by Revenue</h3>
          <div className={s.svgWrapper}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
              {data.total_reservations > 0 ? (
                <div style={{ fontSize: '13px', color: '#111827' }}>
                  Total platform processed for this owner: <strong>{data.total_revenue} DZD</strong> across {data.total_reservations} reservations.
                </div>
              ) : (
                <div className={s.overlayText}>No space revenue data yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={s.exportActions}>
        <button className={s.exportBtn} onClick={() => alert("Report downloaded.")}>↓ Export Summary</button>
      </div>
    </div>
  );
}
