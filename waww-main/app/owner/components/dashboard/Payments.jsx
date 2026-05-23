import React, { useState } from 'react';
import s from './Payments.module.css';

export default function Payments() {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Paid', 'Pending', 'Overdue'];

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>Payments</h1>
        <p>Manage your transaction history</p>
      </div>

      <div className={s.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`${s.tabBtn} ${activeTab === tab ? s.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={s.content}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>◈</div>
          <h3 className={s.emptyTitle}>No payments yet</h3>
          <p className={s.emptyText}>Payment records will appear here once drivers make reservations.</p>
        </div>
      </div>

      <div className={s.summaryFooter}>
        <div className={s.summaryItem}>
          <span className={s.summaryLabel}>Total Collected:</span>
          <span className={s.summaryValue}>0 DZD</span>
        </div>
        <div className={s.summaryDivider}>|</div>
        <div className={s.summaryItem}>
          <span className={s.summaryLabel}>Total Pending:</span>
          <span className={s.summaryValue}>0 DZD</span>
        </div>
        <div className={s.summaryDivider}>|</div>
        <div className={s.summaryItem}>
          <span className={s.summaryLabel}>Total Overdue:</span>
          <span className={s.summaryValue}>0 DZD</span>
        </div>
      </div>
    </div>
  );
}
