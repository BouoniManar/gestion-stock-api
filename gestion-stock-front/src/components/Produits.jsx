import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Stat, Table, FormHead, Actions, toList, confirmDelete } from './ui';

const empty = { reference: '', designation: '', prix_unitaire: '', seuil_alerte: '' };
const idOf = (p) => p.id_produit || p.id;

// Niveau de stock calculé à partir des mouvements (entrées - sorties)
const computeStock = (mouvements) => {
  const map = {};
  mouvements.forEach((m) => {
    const id = m.id_produit ?? m.produit_id;
    const sign = /entr/i.test(m.type || m.type_mouvement || '') ? 1 : -1;
    map[id] = (map[id] || 0) + sign * Number(m.quantite || 0);
  });
  return map;
};

export default function Produits() {
  const [produits, setProduits] = useState([]);
  const [stock, setStock] = useState({});
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/produits').then(toList).catch(() => []),
      API.get('/stock').then(toList).catch(() => []),
    ]).then(([p, m]) => { setProduits(p); setStock(computeStock(m)); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = () => { setEditing(null); setForm(empty); setErrors({}); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    const payload = { ...form, seuil_alerte: form.seuil_alerte === '' ? null : Number(form.seuil_alerte) };
    try {
      const wasEditing = !!editing;
      if (editing) await API.put(`/produits/${idOf(editing)}`, payload);
      else await API.post('/produits', payload);
      toast.success(wasEditing ? 'Produit modifié avec succès' : 'Produit ajouté avec succès');
      cancel(); load();
    } catch (err) {
      const r = err.response;
      setErrors(r?.data?.errors || { _: [r?.data?.message || 'Impossible d’enregistrer le produit.'] });
      toast.error('Échec de l’enregistrement, vérifiez les champs.');
    } finally { setSaving(false); }
  };

  const remove = (id, nom) =>
    confirmDelete(`Supprimer le produit « ${nom} » ?`, async () => {
      try { await API.delete(`/produits/${id}`); toast.success('Produit supprimé'); load(); }
      catch { toast.error('Suppression impossible : produit utilisé dans une facture ou un mouvement.'); }
    });

  const edit = (p) => {
    setEditing(p); setErrors({});
    setForm({ reference: p.reference, designation: p.designation, prix_unitaire: p.prix_unitaire, seuil_alerte: p.seuil_alerte ?? '' });
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const field = (key, label, placeholder, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input className={`input ${errors[key] ? 'input-err' : ''}`} placeholder={placeholder}
        value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
      {errors[key] && <p className="err-msg">{errors[key][0]}</p>}
    </label>
  );

  const isLow = (p) => p.seuil_alerte != null && (stock[idOf(p)] || 0) <= Number(p.seuil_alerte);
  const q = search.trim().toLowerCase();
  const shown = produits.filter((p) => !q || [p.reference, p.designation].some((v) => (v || '').toLowerCase().includes(q)));

  return (
    <>
      <div className="stats">
        <Stat value={produits.length} label="Produits au catalogue" />
        <Stat value={produits.filter(isLow).length} label="Sous le seuil d’alerte" />
      </div>

      <form onSubmit={save} className="card form-card">
        <FormHead title={editing ? `Modifier ${editing.designation}` : 'Nouveau produit'} editing={editing} onCancel={cancel} />
        {field('reference', 'Référence', 'Ex : PRD-001', { required: true })}
        {field('designation', 'Désignation', 'Ex : Clavier sans fil', { required: true })}
        {field('prix_unitaire', 'Prix unitaire (TND)', '0.00', { type: 'number', step: '0.01', min: '0', required: true })}
        {field('seuil_alerte', 'Seuil d’alerte de stock', 'Ex : 5', { type: 'number', min: '0' })}
        {errors._ && <p className="err-msg full">{errors._[0]}</p>}
        <button type="submit" disabled={saving} className={`btn full ${editing ? 'btn-amber' : 'btn-brand'}`}>
          {saving ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Ajouter le produit'}
        </button>
      </form>

      <input className="input search" placeholder="Rechercher par référence ou désignation…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <Table heads={['Référence', 'Désignation', 'Prix unitaire', 'Stock actuel', 'Seuil d’alerte', 'Actions']} isEmpty={!shown.length}
        empty={loading ? 'Chargement…' : q ? 'Aucun produit ne correspond à la recherche.' : 'Aucun produit au catalogue. Ajoutez-en un ci-dessus.'}>
        {shown.map((p, i) => {
          const low = isLow(p);
          return (
            <tr key={idOf(p)} className="row" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
              <td className="strong">{p.reference}</td>
              <td>{p.designation}</td>
              <td className="price">{Number(p.prix_unitaire).toFixed(2)} TND</td>
              <td><span className={`badge ${low ? 'badge-low' : 'badge-ok'}`}>{stock[idOf(p)] || 0} unités {low && '⚠️'}</span></td>
              <td className="muted">{p.seuil_alerte ?? '—'}</td>
              <Actions onEdit={() => edit(p)} onDelete={() => remove(idOf(p), p.designation)} />
            </tr>
          );
        })}
      </Table>
    </>
  );
}