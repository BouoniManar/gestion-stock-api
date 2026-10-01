import React from 'react';
import { toast } from 'react-toastify';

export const toList = (res) => {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return d?.data?.data || [];
};

export const Stat = ({ value, label }) => (
  <div className="card stat"><b>{value}</b><span>{label}</span></div>
);

export const Table = ({ heads, empty, children, isEmpty }) => (
  <div className="card table-wrap">
    <table className="data">
      <thead className="table-head">
        <tr>{heads.map((h) => <th key={h} className={h === 'Actions' ? 'ta-right' : ''}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {isEmpty ? <tr><td colSpan={heads.length} className="empty">{empty}</td></tr> : children}
      </tbody>
    </table>
  </div>
);

export const FormHead = ({ title, editing, onCancel }) => (
  <div className="form-head full">
    <h3>{title}</h3>
    {editing && <button type="button" onClick={onCancel} className="link-danger">Annuler la modification</button>}
  </div>
);

export const Actions = ({ onEdit, onDelete }) => (
  <td>
    <div className="actions">
      <button onClick={onEdit} className="chip-btn chip-edit">Modifier</button>
      <button onClick={onDelete} className="chip-btn chip-del">Supprimer</button>
    </div>
  </td>
);

// Confirmation de suppression sous forme de toast
export const confirmDelete = (message, onConfirm) =>
  toast(({ closeToast }) => (
    <div className="confirm">
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="chip-btn chip-del" onClick={() => { closeToast(); onConfirm(); }}>Supprimer</button>
        <button className="chip-btn chip-cancel" onClick={closeToast}>Annuler</button>
      </div>
    </div>
  ), { autoClose: false, closeOnClick: false, draggable: false, closeButton: false, icon: '🗑️' });