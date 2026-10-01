import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { getSession, clearSession, onUnauthorized, logout } from './services/auth';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Produits from './components/Produits';
import Stock from './components/Stock';
import Factures from './components/Factures';

const PAGES = {
  dashboard: { label: 'Tableau de bord', icon: '📊', private: true, Page: Dashboard, sub: 'Vue d’ensemble de votre activité.' },
  clients: { label: 'Clients', icon: '👥', Page: Clients, sub: 'Gérez vos clients et leurs coordonnées.' },
  produits: { label: 'Produits', icon: '🏷️', Page: Produits, sub: 'Suivez vos prix et vos niveaux de stock.' },
  stock: { label: 'Mouvements de stock', icon: '🔄', Page: Stock, sub: 'Enregistrez chaque entrée et sortie.' },
  factures: { label: 'Facturation', icon: '📄', Page: Factures, sub: 'Créez et consultez vos factures.' },
};

export default function App() {
  const [session, setSession] = useState(getSession());
  const [tab, setTab] = useState(getSession() ? 'dashboard' : 'clients');
  const [showLogin, setShowLogin] = useState(false);
  const { label, sub, Page } = PAGES[tab];

  const user = session?.user || null;
  // Sans connexion, tout reste accessible ; un gestionnaire connecté ne peut pas supprimer
  const isAdmin = !user || /admin/i.test(user.role || '');

  useEffect(() => onUnauthorized(() => {
    clearSession(); setSession(null); setTab('clients');
    toast.info('Session expirée, veuillez vous reconnecter.');
  }), []);

  const doLogout = async () => { await logout(); setSession(null); setTab('clients'); toast.success('Déconnexion réussie'); };

  return (
    <AuthContext.Provider value={{ user, isAdmin }}>
      <div className="app-bg shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">📦</div>
            <div>
              <h1>StockManager</h1>
              <span className="status"><i className="dot" /> Système actif</span>
            </div>
          </div>
          <nav className="side-nav">
            {Object.entries(PAGES).filter(([, p]) => !p.private || user).map(([id, p]) => (
              <button key={id} onClick={() => setTab(id)} className={`nav-item ${tab === id ? 'active' : ''}`}>
                <span className="icon">{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </nav>
          <div className="side-foot">Laravel &amp; React</div>
        </aside>

        <div className="content">
          <header className="topbar">
            <div><h2>{label}</h2><p>{sub}</p></div>
            <div className="topbar-right">
              <span className="pill"><i className="dot" /> API Laravel connectée</span>
              {user ? (
                <div className="user-chip">
                  <div className="avatar">{(user.nom || '?')[0].toUpperCase()}</div>
                  <div className="user-info"><b>{user.nom}</b><span>{isAdmin ? 'Administrateur' : 'Gestionnaire'}</span></div>
                  <button className="btn-auth btn-auth-out" onClick={doLogout}>Se déconnecter</button>
                </div>
              ) : (
                <button className="btn-auth" onClick={() => setShowLogin(true)}>Se connecter</button>
              )}
            </div>
          </header>
          <main key={tab} className="page-in workspace">
            <div className="wrap"><Page goTo={setTab} /></div>
          </main>
        </div>

        {showLogin && <Login onClose={() => setShowLogin(false)} onLogin={(s) => { setSession(s); setTab('dashboard'); setShowLogin(false); }} />}
        <ToastContainer position="top-right" autoClose={3000} theme="light" pauseOnHover newestOnTop />
      </div>
    </AuthContext.Provider>
  );
}