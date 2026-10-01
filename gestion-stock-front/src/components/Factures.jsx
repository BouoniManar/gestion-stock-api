import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Stat, Table, FormHead, toList } from './ui';

const STATUTS = ['En attente', 'Payée', 'Annulée'];
const today = () => new Date().toISOString().slice(0, 10);
const newLine = () => ({ id_produit: '', quantite: 1, prix: '' });
const idOf = (f) => f.id_facture || f.id;
const pId = (p) => p.id_produit || p.id;
const pName = (p) => p.designation || p.nom;
const pPrice = (p) => p.prix_unitaire ?? p.prix_vente ?? 0;
const money = (n) => `${Number(n || 0).toFixed(2)} TND`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const badge = (s = '') => (/pay/i.test(s) ? 'badge-ok' : /annul/i.test(s) ? 'badge-low' : 'badge-wait');

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [produits, setProduits] = useState([]);
  const [head, setHead] = useState({ id_client: '', date_facture: today(), statut: STATUTS[0] });
  const [lignes, setLignes] = useState([newLine()]);
  const [errors, setErrors] = useState([]);
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);

  const load = () =>
    Promise.all(['/factures', '/clients', '/produits'].map((u) => API.get(u).then(toList).catch(() => [])))
      .then(([f, c, p]) => { setFactures([...f].sort((a, b) => idOf(b) - idOf(a))); setClients(c); setProduits(p); });
  useEffect(() => { load(); }, []);

  const setLine = (i, patch) => setLignes(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const pickProduct = (i, id) => {
    const p = produits.find((x) => String(pId(x)) === id);
    setLine(i, { id_produit: id, prix: p ? pPrice(p) : '' });
  };
  const total = lignes.reduce((s, l) => s + Number(l.quantite || 0) * Number(l.prix || 0), 0);

  const save = async (e) => {
    e.preventDefault();
    setErrors([]); setOk('');
    const valid = lignes.filter((l) => l.id_produit);
    if (!head.id_client) { toast.warn('Choisissez un client.'); return; }
    if (!valid.length) { toast.warn('Ajoutez au moins un produit à la facture.'); return; }
    setSaving(true);
    try {
      const res = await API.post('/factures', {
        ...head,
        id_client: Number(head.id_client),
        lignes: valid.map((l) => ({ id_produit: Number(l.id_produit), quantite: Number(l.quantite), prix_unitaire: Number(l.prix) })),
      });
      toast.success(res.data?.message || 'Facture générée avec succès !');
      setHead({ id_client: '', date_facture: today(), statut: STATUTS[0] });
      setLignes([newLine()]);
      load();
    } catch (err) {
      const d = err.response?.data;
      setErrors(d?.errors ? Object.values(d.errors).flat().slice(0, 4) : [d?.message || 'Impossible de créer la facture.']);
      toast.error('Impossible de créer la facture.');
    } finally { setSaving(false); }
  };

  const active = factures.filter((f) => !/annul/i.test(f.statut || ''));
  const pending = factures.filter((f) => /attente/i.test(f.statut || '')).length;

  return (
    <>
      <div className="stats">
        <Stat value={factures.length} label="Factures émises" />
        <Stat value={money(active.reduce((s, f) => s + Number(f.montant_total || 0), 0))} label="Total facturé" />
        <Stat value={pending} label="En attente de paiement" />
      </div>

      <form onSubmit={save} className="card form-card cols-3">
        <FormHead title="Nouvelle facture" />
        <label className="field"><span>Client</span>
          <select className="input" value={head.id_client} onChange={(e) => setHead({ ...head, id_client: e.target.value })}>
            <option value="">Choisir un client…</option>
            {clients.map((c) => <option key={c.id_client || c.id} value={c.id_client || c.id}>{c.nom}</option>)}
          </select>
        </label>
        <label className="field"><span>Date de la facture</span>
          <input className="input" type="date" value={head.date_facture} onChange={(e) => setHead({ ...head, date_facture: e.target.value })} required />
        </label>
        <label className="field"><span>Statut</span>
          <select className="input" value={head.statut} onChange={(e) => setHead({ ...head, statut: e.target.value })}>
            {STATUTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <div className="lines">
          <div className="line-row line-head"><span>Produit</span><span>Quantité</span><span>Prix unitaire</span><span>Total ligne</span><span /></div>
          {lignes.map((l, i) => (
            <div className="line-row" key={i}>
              <select className="input" value={l.id_produit} onChange={(e) => pickProduct(i, e.target.value)}>
                <option value="">Choisir un produit…</option>
                {produits.map((p) => <option key={pId(p)} value={pId(p)}>{pName(p)}</option>)}
              </select>
              <input className="input" type="number" min="1" value={l.quantite} onChange={(e) => setLine(i, { quantite: e.target.value })} />
              <input className="input" type="number" step="0.01" min="0" value={l.prix} onChange={(e) => setLine(i, { prix: e.target.value })} />
              <div className="line-total">{money(Number(l.quantite || 0) * Number(l.prix || 0))}</div>
              <button type="button" className="icon-btn" title="Retirer la ligne" disabled={lignes.length === 1}
                onClick={() => setLignes(lignes.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setLignes([...lignes, newLine()])}>+ Ajouter un produit</button>
        </div>

        <div className="total-bar"><span>Montant total</span><b>{money(total)}</b></div>
        {errors.length > 0 && <div className="notice notice-err full">{errors.map((m) => <p key={m}>{m}</p>)}</div>}
        {ok && <div className="notice full">{ok}</div>}
        <button type="submit" disabled={saving} className="btn btn-brand full">{saving ? 'Création…' : 'Générer la facture'}</button>
      </form>

      <Table heads={['Référence', 'Client', 'Date', 'Statut', 'Montant', 'Actions']} isEmpty={!factures.length} empty="Aucune facture émise. Créez la première ci-dessus.">
        {factures.map((f, i) => (
          <React.Fragment key={idOf(f)}>
            <tr className="row" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
              <td className="strong">#FACT-{idOf(f)}</td>
              <td>{f.client?.nom || `Client #${f.id_client}`}</td>
              <td className="muted">{fmtDate(f.date_facture)}</td>
              <td><span className={`badge ${badge(f.statut)}`}>{f.statut}</span></td>
              <td className="price">{money(f.montant_total)}</td>
              <td><div className="actions">
                <button className="chip-btn chip-view" onClick={() => setOpen(open === idOf(f) ? null : idOf(f))}>{open === idOf(f) ? 'Masquer' : 'Détail'}</button>
              </div></td>
            </tr>
            {open === idOf(f) && (
              <tr className="detail-row"><td colSpan={6}>
                {(f.lignes || []).map((l, k) => (
                  <div className="detail-line" key={k}>
                    <span>{l.produit ? pName(l.produit) : `Produit #${l.id_produit}`}</span>
                    <span className="muted">{l.quantite} × {money(l.prix_unitaire)}</span>
                    <b>{money(l.quantite * l.prix_unitaire)}</b>
                  </div>
                ))}
              </td></tr>
            )}
          </React.Fragment>
        ))}
      </Table>
    </>
  );
}