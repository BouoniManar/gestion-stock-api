import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { Stat, Table, FormHead, toList } from './ui';

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ id_produit: '', type: 'ENTREE', quantite: '', date_mouvement: today() });
const pId = (p) => p.id_produit || p.id;
const mId = (m) => m.id_mouvement || m.id;
const isIn = (m) => /entr/i.test(m.type || '');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function Stock() {
  const [mouvements, setMouvements] = useState([]);
  const [produits, setProduits] = useState([]);
  const [form, setForm] = useState(blank());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = () =>
    Promise.all(['/stock', '/produits'].map((u) => API.get(u).then(toList).catch(() => [])))
      .then(([m, p]) => {
        setMouvements([...m].sort((a, b) => String(b.date_mouvement).localeCompare(String(a.date_mouvement)) || mId(b) - mId(a)));
        setProduits(p);
      });
  useEffect(() => { load(); }, []);

  const stockOf = (id) =>
    mouvements.reduce((s, m) => (String(m.id_produit) === String(id) ? s + (isIn(m) ? 1 : -1) * Number(m.quantite || 0) : s), 0);

  const selected = produits.find((p) => String(pId(p)) === String(form.id_produit));
  const available = selected ? stockOf(pId(selected)) : null;

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    const qty = Number(form.quantite);
    if (form.type === 'SORTIE' && available !== null && qty > available) {
      return toast.warn(`Stock insuffisant : ${available} unité(s) disponible(s).`);
    }
    setSaving(true);
    try {
      const res = await API.post('/stock', { ...form, id_produit: Number(form.id_produit), quantite: qty });
      toast.success(res.data?.message || 'Mouvement de stock enregistré');
      setForm({ ...blank(), type: form.type });
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error('Échec de l’enregistrement, vérifiez les champs.');
    } finally { setSaving(false); }
  };

  const q = search.trim().toLowerCase();
  const shown = mouvements.filter((m) =>
    (filter === 'ALL' || (filter === 'ENTREE') === isIn(m)) &&
    (!q || `${m.produit?.designation || ''} ${m.produit?.reference || ''}`.toLowerCase().includes(q)));
  const sum = (cond) => mouvements.filter(cond).reduce((s, m) => s + Number(m.quantite || 0), 0);

  const err = (k) => errors[k] && <p className="err-msg">{errors[k][0]}</p>;

  return (
    <>
      <div className="stats">
        <Stat value={mouvements.length} label="Mouvements enregistrés" />
        <Stat value={sum(isIn)} label="Unités entrées" />
        <Stat value={sum((m) => !isIn(m))} label="Unités sorties" />
      </div>

      <form onSubmit={save} className="card form-card">
        <FormHead title="Nouveau mouvement de stock" />
        <label className="field"><span>Produit</span>
          <select className={`input ${errors.id_produit ? 'input-err' : ''}`} value={form.id_produit} required
            onChange={(e) => setForm({ ...form, id_produit: e.target.value })}>
            <option value="">Choisir un produit…</option>
            {produits.map((p) => <option key={pId(p)} value={pId(p)}>{p.reference} — {p.designation}</option>)}
          </select>
          {selected && <p className="hint">Stock actuel : <b>{available}</b> unité(s)</p>}
          {err('id_produit')}
        </label>
        <label className="field"><span>Type de mouvement</span>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="ENTREE">Entrée en stock (+)</option>
            <option value="SORTIE">Sortie de stock (−)</option>
          </select>
          {err('type')}
        </label>
        <label className="field"><span>Quantité</span>
          <input className={`input ${errors.quantite ? 'input-err' : ''}`} type="number" min="1" placeholder="Ex : 10" required
            value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} />
          {err('quantite')}
        </label>
        <label className="field"><span>Date du mouvement</span>
          <input className={`input ${errors.date_mouvement ? 'input-err' : ''}`} type="date" required
            value={form.date_mouvement} onChange={(e) => setForm({ ...form, date_mouvement: e.target.value })} />
          {err('date_mouvement')}
        </label>
        <button type="submit" disabled={saving} className={`btn full ${form.type === 'ENTREE' ? 'btn-brand' : 'btn-amber'}`}>
          {saving ? 'Enregistrement…' : form.type === 'ENTREE' ? 'Enregistrer l’entrée' : 'Enregistrer la sortie'}
        </button>
      </form>

      <div className="toolbar">
        <input className="input search" placeholder="Rechercher un produit…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="seg">
          {[['ALL', 'Tous'], ['ENTREE', 'Entrées'], ['SORTIE', 'Sorties']].map(([k, l]) => (
            <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <Table heads={['Produit', 'Type', 'Quantité', 'Date']} isEmpty={!shown.length} empty="Aucun mouvement à afficher.">
        {shown.map((m, i) => (
          <tr key={mId(m)} className="row" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
            <td className="strong">{m.produit?.designation || `Produit #${m.id_produit}`}
              {m.produit?.reference && <span className="ref">{m.produit.reference}</span>}</td>
            <td><span className={`badge ${isIn(m) ? 'badge-ok' : 'badge-low'}`}>{isIn(m) ? '＋ Entrée' : '− Sortie'}</span></td>
            <td className="strong">{isIn(m) ? '+' : '−'}{m.quantite}</td>
            <td className="muted">{fmtDate(m.date_mouvement)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}