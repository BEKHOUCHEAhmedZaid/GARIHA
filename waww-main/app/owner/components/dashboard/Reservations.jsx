import React, { useState } from 'react';
import s from './Reservations.module.css';

export default function Reservations() {
  const [period, setPeriod] = useState('This Week');

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>Reservations</h1>
          <p>Track your upcoming and past bookings</p>
        </div>
        <div className={s.periodToggle}>
          <button 
            className={`${s.toggleBtn} ${period === 'This Week' ? s.active : ''}`}
            onClick={() => setPeriod('This Week')}
          >
            This Week
          </button>
          <button 
            className={`${s.toggleBtn} ${period === 'This Month' ? s.active : ''}`}
            onClick={() => setPeriod('This Month')}
          >
            This Month
          </button>
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="7">
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>⊡</div>
                  <h3 className={s.emptyTitle}>No reservations found</h3>
                  <p className={s.emptyText}>Reservations will appear here once drivers book your spaces.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
