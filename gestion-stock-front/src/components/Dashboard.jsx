import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Stat, toList } from './ui';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const money = (n) => `${Number(n || 0).toFixed(2)} TND`;
const isIn = (m) => /entr/i.test(m.type || '');
const pId = (p) => p.id_produit || p.id;
const fId = (f) => f.id_facture || f.id;
const badge = (s = '') => (/pay/i.test(s) ? 'badge-ok' : /annul/i.test(s) ? 'badge-low' : 'badge-wait');

export default function Dashboard({ goTo }) {
  const { user } = useAuth();
  const [d, setD] = useState({ factures: [], clients: [], produits: [], mouvements: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(['/factures', '/clients', '/produits', '/stock'].map((u) => API.get(u).then(toList).catch(() => [])))
      .then(([factures, clients, produits, mouvements]) => setD({ factures, clients, produits, mouvements }))
      .finally(() => setLoading(false));
  }, []);

  const stock = {};
  d.mouvements.forEach((m) => { stock[m.id_produit] = (stock[m.id_produit] || 0) + (isIn(m) ? 1 : -1) * Number(m.quantite || 0); });

  const alerts = d.produits
    .filter((p) => p.seuil_alerte != null && (stock[pId(p)] || 0) <= Number(p.seuil_alerte))
    .sort((a, b) => (stock[pId(a)] || 0) - (stock[pId(b)] || 0));

  const actives = d.factures.filter((f) => !/annul/i.test(f.statut || ''));
  const ca = actives.reduce((s, f) => s + Number(f.montant_total || 0), 0);
  const recent = [...d.factures].sort((a, b) => fId(b) - fId(a)).slice(0, 5);

  // Chiffre d'affaires des 6 derniers mois
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const total = actives.filter((f) => String(f.date_facture).startsWith(key)).reduce((s, f) => s + Number(f.montant_total || 0), 0);
    return { label: MONTHS[dt.getMonth()], total };
  });
  const max = Math.max(...months.map((m) => m.total), 1);

  const today = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="hello">
        <h3>Bonjour{user ? `, ${user.nom || user.name}` : ''} 👋</h3>
        <p>{today}</p>
      </div>

      <div className="stats">
        <Stat value={money(ca)} label="Chiffre d’affaires" />
        <Stat value={d.factures.length} label="Factures émises" />
        <Stat value={d.clients.length} label="Clients" />
        <Stat value={alerts.length} label="Produits en alerte" />
      </div>

      <div className="dash-grid">
        <section className="card panel">
          <div className="panel-head"><h3>Chiffre d’affaires, 6 derniers mois</h3></div>
          {actives.length === 0 ? (
            <p className="panel-empty">{loading ? 'Chargement…' : 'Aucune facture pour le moment. Le graphique apparaîtra après la première facture.'}</p>
          ) : (
          <div className="bars">
            {months.map((m) => (
              <div className="bar-col" key={m.label} title={money(m.total)}>
                <div className="bar-track"><div className="bar" style={{ height: `${(m.total / max) * 100}%` }} /></div>
                <span className="bar-label">{m.label}</span>
                <span className="bar-val">{m.total ? Math.round(m.total) : '—'}</span>
              </div>
            ))}
          </div>
          )}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <h3>Produits sous le seuil d’alerte</h3>
            <button className="link-btn" onClick={() => goTo('stock')}>Réapprovisionner</button>
          </div>
          {alerts.length === 0 ? (
            <p className="panel-empty">{loading ? 'Chargement…' : 'Aucun produit sous le seuil. Tout est en ordre ✅'}</p>
          ) : alerts.slice(0, 6).map((p) => (
            <div className="list-item" key={pId(p)}>
              <div><b>{p.designation}</b><span className="ref">{p.reference}</span></div>
              <span className="badge badge-low">{stock[pId(p)] || 0} / {p.seuil_alerte} ⚠️</span>
            </div>
          ))}
        </section>
      </div>

      <section className="card panel">
        <div className="panel-head">
          <h3>Dernières factures</h3>
          <button className="link-btn" onClick={() => goTo('factures')}>Voir toutes les factures</button>
        </div>
        {recent.length === 0 ? <p className="panel-empty">Aucune facture pour le moment.</p> : recent.map((f) => (
          <div className="list-item" key={fId(f)}>
            <div><b>#FACT-{fId(f)}</b><span className="ref">{f.client?.nom || `Client #${f.id_client}`}</span></div>
            <span className={`badge ${badge(f.statut)}`}>{f.statut}</span>
            <b className="price-tag">{money(f.montant_total)}</b>
          </div>
        ))}
      </section>
    </>
  );
}