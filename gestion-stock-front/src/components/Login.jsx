import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, register } from '../services/auth';

// Fenêtre de connexion / création de compte (modale)
export default function Login({ onLogin, onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nom: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (isRegister && form.password !== form.confirm) return toast.warn('Les deux mots de passe ne sont pas identiques.');
    if (isRegister && form.password.length < 6) return toast.warn('Le mot de passe doit contenir au moins 6 caractères.');
    setLoading(true);
    try {
      const session = isRegister
        ? await register({ nom: form.nom, email: form.email, password: form.password, password_confirmation: form.confirm })
        : await login(form.email, form.password);
      toast.success(isRegister ? `Compte créé. Bienvenue, ${session.user.nom}` : `Bienvenue, ${session.user.nom}`);
      onLogin(session);
    } catch (err) {
      const d = err.response?.data;
      const first = d?.errors ? Object.values(d.errors).flat()[0] : null;
      toast.error(first || d?.message || (isRegister ? 'Création du compte impossible.' : 'Connexion impossible. Vérifiez vos identifiants.'));
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="card login-card" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        <div className="brand-logo login-logo">📦</div>
        <h1>{isRegister ? 'Créer un compte' : 'Connexion'}</h1>
        <p className="login-sub">
          {isRegister ? 'Les nouveaux comptes sont créés avec le rôle gestionnaire.' : 'Connectez-vous pour accéder au tableau de bord.'}
        </p>
        {isRegister && (
          <label className="field"><span>Nom complet</span>
            <input className="input" placeholder="Ex : Sami Ben Ali" value={form.nom} onChange={set('nom')} required autoFocus />
          </label>
        )}
        <label className="field"><span>Adresse email</span>
          <input className="input" type="email" placeholder="vous@entreprise.tn" value={form.email} onChange={set('email')} required autoFocus={!isRegister} />
        </label>
        <label className="field"><span>Mot de passe</span>
          <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
        </label>
        {isRegister && (
          <label className="field"><span>Confirmer le mot de passe</span>
            <input className="input" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
          </label>
        )}
        <button type="submit" disabled={loading} className="btn btn-brand full">
          {loading ? 'Veuillez patienter…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
        </button>
        <p className="switch-mode">
          {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button type="button" className="link-btn" onClick={() => setMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </form>
    </div>
  );
}