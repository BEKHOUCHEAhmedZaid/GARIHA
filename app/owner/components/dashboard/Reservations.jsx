import React, { useState, useEffect } from 'react';
import s from './Reservations.module.css';
import { api } from '@/lib/axios';

export default function Reservations() {
  const [period, setPeriod] = useState('This Week');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get(`/owner/reservations?period=${encodeURIComponent(period)}`)
      .then((res) => {
        if (isMounted) {
          setReservations(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load owner reservations", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [period]);

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>Reservations</h1>
          <p>Track your upcoming and past bookings in real-time</p>
        </div>
        <div className={s.periodToggle}>
          {['This Week', 'This Month', 'All'].map((p) => (
            <button 
              key={p}
              className={`${s.toggleBtn} ${period === p ? s.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className={s.tableContainer}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Plate Number</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Space</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
                  Loading reservations...
                </td>
              </tr>
            ) : reservations.length > 0 ? (
              reservations.map((r) => {
                const dateObj = new Date(r.created_at);
                const dateStr = dateObj.toLocaleDateString('fr-DZ', { timeZone: 'Africa/Algiers' });
                const timeStr = dateObj.toLocaleTimeString('fr-DZ', { timeZone: 'Africa/Algiers', hour: '2-digit', minute: '2-digit' });
                return (
                  <tr key={r.id}>
                    <td><strong>{r.driver_name}</strong></td>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{r.plate_number}</span></td>
                    <td>{dateStr}</td>
                    <td>{timeStr}</td>
                    <td>{r.duration}</td>
                    <td>{r.spot_name} ({r.parking_name})</td>
                    <td><strong>{r.spot_price || 250} DZD</strong></td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: r.status === 'active' ? '#ECFDF5' : r.status === 'checked_in' ? '#EFF6FF' : r.status === 'cancelled' ? '#FEF2F2' : '#F3F4F6',
                        color: r.status === 'active' ? '#059669' : r.status === 'checked_in' ? '#2563EB' : r.status === 'cancelled' ? '#EF4444' : '#4B5563',
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8">
                  <div className={s.emptyState}>
                    <div className={s.emptyIcon}>⊡</div>
                    <h3 className={s.emptyTitle}>No reservations found for {period.toLowerCase()}</h3>
                    <p className={s.emptyText}>Reservations will appear here once drivers book your spaces.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
