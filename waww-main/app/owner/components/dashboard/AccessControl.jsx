import React, { useState, useEffect } from 'react';
import s from './AccessControl.module.css';

function WhitelistCard({ driver, onRemove }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = driver.whitelistedAt + 7 * 24 * 3600 * 1000;
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1000;
        if (next <= 0) { clearInterval(interval); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progress = timeLeft / (7 * 24 * 3600 * 1000);

  const barColor = progress > 0.3 ? '#10B981' : progress > 0.1 ? '#F59E0B' : '#EF4444';

  return (
    <div className={s.driverCard}>
      <div className={s.driverAvatar}>{driver.initials}</div>
      <div className={s.driverInfo}>
        <div className={s.driverHeader}>
          <p className={s.driverName}>{driver.name}</p>
          <button className={s.removeBtn} onClick={() => onRemove(driver.id)}>Remove</button>
        </div>
        <p className={s.driverPlate}>{driver.plate}</p>
        <div className={s.countdown}>
          <div className={s.countdownTime}>
            {days}d {hours}h {minutes}m {seconds}s remaining
          </div>
          <div className={s.progressTrack}>
            <div className={s.progressBar} style={{ width: `${progress * 100}%`, background: barColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BlacklistCard({ driver, onRemove }) {
  return (
    <div className={s.driverCard}>
      <div className={s.driverAvatar} style={{ background: '#EF4444' }}>{driver.initials}</div>
      <div className={s.driverInfo}>
        <div className={s.driverHeader}>
          <p className={s.driverName}>{driver.name}</p>
          <button className={s.removeBtn} onClick={() => onRemove(driver.id)}>Remove</button>
        </div>
        <p className={s.driverPlate}>{driver.plate}</p>
      </div>
    </div>
  );
}

export default function AccessControl() {
  const [whitelisted, setWhitelisted] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);

  const handleRemoveWhitelist = (id) => {
    setWhitelisted(prev => prev.filter(d => d.id !== id));
  };

  const handleRemoveBlacklist = (id) => {
    setBlacklisted(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>Access Control</h1>
        <p>Manage driver permissions and free access limits</p>
      </div>

      <div className={s.panel}>
        <div className={s.panelHeader}>
          <h2>Pending Access Requests</h2>
        </div>
        <div className={s.emptyState}>
          <h3 className={s.emptyTitle}>No pending access requests</h3>
          <p className={s.emptyText}>New driver requests will appear here when the Driver system connects.</p>
        </div>
      </div>

      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <h2>✅ Whitelisted Drivers</h2>
            <span className={s.panelBadge} style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)' }}>Free 7-day access</span>
          </div>
          {whitelisted.length === 0 ? (
            <div className={s.emptyStateSmall}>
              <p>No whitelisted drivers. Grant free weekly access to trusted drivers.</p>
            </div>
          ) : (
            whitelisted.map(driver => <WhitelistCard key={driver.id} driver={driver} onRemove={handleRemoveWhitelist} />)
          )}
        </div>

        <div className={s.panel}>
          <div className={s.panelHeader}>
            <h2>🚫 Blacklisted Drivers</h2>
          </div>
          {blacklisted.length === 0 ? (
            <div className={s.emptyStateSmall}>
              <p>No blacklisted drivers.</p>
            </div>
          ) : (
            blacklisted.map(driver => <BlacklistCard key={driver.id} driver={driver} onRemove={handleRemoveBlacklist} />)
          )}
        </div>
      </div>
    </div>
  );
}
