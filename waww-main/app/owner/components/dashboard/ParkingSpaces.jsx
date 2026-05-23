import React, { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import s from './ParkingSpaces.module.css';

const STATUS_COLORS = {
  LIBRE: '#10B981',
  RESERVEE: '#4DCCE7',
  OCCUPEE: '#1A2FA8',
  INDISPONIBLE: '#EF4444',
};

export default function ParkingSpaces({ parkingId }) {
  const [spaces, setSpaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-fetch spaces
  useEffect(() => {
    const fetchSpaces = async () => {
      if (!parkingId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/parking/${parkingId}/spots`);
        setSpaces(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
    const intervalId = setInterval(fetchSpaces, 5000);
    return () => clearInterval(intervalId);
  }, [parkingId]);

  // Handle creation of parking if no parkingId exists (creates default parking and spots)
  const handleCreateDefaultParking = async () => {
    try {
      // Create a default parking
      await api.post('/parking/create', {
        parking_name: "Main Parking",
        location: "Default Location",
        total_places: 10,
      });
      window.location.reload(); // Reload to fetch the new parking and spots
    } catch (e) {
      console.error(e);
    }
  };

  const getNextSpaceName = () => `P${spaces.length + 1}`;

  const [formData, setFormData] = useState({
    name: getNextSpaceName(),
    level: 'Ground Floor',
    status: 'LIBRE',
    price: 250,
  });

  const resetForm = () => {
    setFormData({
      name: getNextSpaceName(),
      level: 'Ground Floor',
      status: 'LIBRE',
      price: 250,
    });
    setEditingSpace(null);
  };

  const handleOpenModal = (space = null) => {
    if (space) {
      setEditingSpace(space);
      setFormData(space);
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, name: getNextSpaceName() }));
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingSpace) {
        // PUT /parking/spots/{id}
        const res = await api.put(`/parking/spots/${editingSpace.id}`, formData);
        setSpaces(prev => prev.map(sp => (sp.id === editingSpace.id ? res.data : sp)));
      } else {
        // POST /parking/{id}/spots
        const res = await api.post(`/parking/${parkingId}/spots`, formData);
        setSpaces(prev => [...prev, res.data]);
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Failed to save space. Please try again.");
    }
  };

  const confirmDelete = async (id) => {
    try {
      await api.delete(`/parking/spots/${id}`);
      setSpaces(prev => prev.filter(sp => sp.id !== id));
      setDeletingId(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete space.");
    }
  };

  const toggleAvailability = async (space) => {
    if (space.status === 'OCCUPEE' || space.status === 'RESERVEE') return;
    
    const newStatus = space.status === 'INDISPONIBLE' ? 'LIBRE' : 'INDISPONIBLE';
    try {
      const res = await api.put(`/parking/spots/${space.id}`, 
        { ...space, status: newStatus }
      );
      setSpaces(prev => prev.map(sp => (sp.id === space.id ? res.data : sp)));
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading spaces...</div>;

  if (!parkingId) {
    return (
      <div className={s.container}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>🅿</div>
          <h3 className={s.emptyTitle}>No parking registered</h3>
          <p className={s.emptyText}>Create your main parking structure to automatically generate spots.</p>
          <button className={s.addBtn} onClick={handleCreateDefaultParking}>Generate Main Parking</button>
        </div>
      </div>
    );
  }

  const occupiedCount = spaces.filter(s => s.status === 'OCCUPEE').length;
  const availableCount = spaces.filter(s => s.status === 'LIBRE').length;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>Parking Spaces</h1>
          <p>{spaces.length} spaces · {occupiedCount} occupied · {availableCount} available</p>
        </div>
        <button className={s.addBtn} onClick={() => handleOpenModal()}>+ Add Space</button>
      </div>

      {spaces.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>🅿</div>
          <h3 className={s.emptyTitle}>No parking spaces yet</h3>
          <p className={s.emptyText}>Add your first parking space to begin managing your lot.</p>
          <button className={s.addBtn} onClick={() => handleOpenModal()}>+ Add First Space</button>
        </div>
      ) : (
        <div className={s.tableContainer}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Space Name</th>
                <th>Level</th>
                <th>Status</th>
                <th>Daily Price</th>
                <th className={s.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {spaces.map(space => (
                <React.Fragment key={space.id}>
                  <tr>
                    <td className={s.fw600}>{space.name}</td>
                    <td>{space.level}</td>
                    <td>
                      <span className={s.statusBadge} style={{ color: STATUS_COLORS[space.status] || '#10B981', backgroundColor: `${STATUS_COLORS[space.status] || '#10B981'}1A` }}>
                        {space.status}
                      </span>
                    </td>
                    <td>{space.price} DZD/day</td>
                    <td className={s.actionsCol}>
                      <button 
                        className={s.iconBtn} 
                        onClick={() => toggleAvailability(space)} 
                        title={space.status === 'INDISPONIBLE' ? 'Mark Available' : 'Mark Unavailable'}
                        disabled={space.status === 'OCCUPEE' || space.status === 'RESERVEE'}
                        style={{ opacity: (space.status === 'OCCUPEE' || space.status === 'RESERVEE') ? 0.5 : 1 }}
                      >
                        {space.status === 'INDISPONIBLE' ? '✓' : '⊘'}
                      </button>
                      <button className={s.iconBtn} onClick={() => handleOpenModal(space)} title="Edit Space">✎</button>
                      <button className={s.iconBtnAlert} onClick={() => setDeletingId(space.id)} title="Delete Space">🗑</button>
                    </td>
                  </tr>
                  {deletingId === space.id && (
                    <tr className={s.deleteRow}>
                      <td colSpan="5">
                        <div className={s.deleteConfirm}>
                          <span>Delete {space.name}?</span>
                          <div className={s.deleteActions}>
                            <button className={s.cancelDelBtn} onClick={() => setDeletingId(null)}>Cancel</button>
                            <button className={s.confirmDelBtn} onClick={() => confirmDelete(space.id)}>Confirm Delete</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={s.overlay}>
          <div className={s.modal}>
            <h3>{editingSpace ? 'Edit Space' : 'Add New Space'}</h3>
            <div className={s.formGroup}>
              <label>Space Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className={s.formGroup}>
              <label>Level</label>
              <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                <option>Ground Floor</option>
                <option>Floor 1</option>
                <option>Floor 2</option>
                <option>Floor 3</option>
              </select>
            </div>
            <div className={s.formGroup}>
              <label>Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="LIBRE">Available (LIBRE)</option>
                <option value="RESERVEE">Reserved (RESERVEE)</option>
                <option value="OCCUPEE">Occupied (OCCUPEE)</option>
                <option value="INDISPONIBLE">Unavailable (INDISPONIBLE)</option>
              </select>
            </div>
            <div className={s.formGroup}>
              <label>Daily Price (DZD)</label>
              <div className={s.inputWithSuffix}>
                <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                <span className={s.suffix}>DZD/day</span>
              </div>
            </div>
            <div className={s.modalActions}>
              <button className={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={s.saveBtn} onClick={handleSave}>Save Space</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
