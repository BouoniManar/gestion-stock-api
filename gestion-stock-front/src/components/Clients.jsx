import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Stat, Table, FormHead, Actions, toList, confirmDelete } from './ui';

const empty = { nom: '', email: '', telephone: '', adresse: '' };
const idOf = (c) => c.id_client || c.id;

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    API.get('/clients')
      .then((res) => setClients(toList(res)))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = () => { setEditing(null); setForm(empty); setErrors({}); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const wasEditing = !!editing;
      if (editing) await API.put(`/clients/${idOf(editing)}`, form);
      else await API.post('/clients', form);
      toast.success(wasEditing ? 'Client modifié avec succès' : 'Client ajouté avec succès');
      cancel();
      load();
    } catch (err) {
      const r = err.response;
      setErrors(r?.data?.errors || { _: [r?.data?.message || 'Impossible d’enregistrer le client.'] });
      toast.error('Échec de l’enregistrement, vérifiez les champs.');
    } finally { setSaving(false); }
  };

  const remove = (id, nom) =>
    confirmDelete(`Supprimer le client « ${nom} » ?`, async () => {
      try { await API.delete(`/clients/${id}`); toast.success('Client supprimé'); load(); }
      catch { toast.error('Suppression impossible : ce client est peut-être lié à une facture.'); }
    });

  const edit = (c) => {
    setEditing(c);
    setErrors({});
    setForm({ nom: c.nom, email: c.email, telephone: c.telephone || '', adresse: c.adresse || '' });
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

  const q = search.trim().toLowerCase();
  const shown = clients.filter((c) => !q || [c.nom, c.email, c.telephone].some((v) => (v || '').toLowerCase().includes(q)));

  return (
    <>
      <div className="stats">
        <Stat value={clients.length} label="Clients enregistrés" />
        <Stat value={clients.filter((c) => c.telephone).length} label="Avec un téléphone" />
      </div>

      <form onSubmit={save} className="card form-card">
        <FormHead title={editing ? `Modifier ${editing.nom}` : 'Nouveau client'} editing={editing} onCancel={cancel} />
        {field('nom', 'Nom du client', 'Ex : Société Alpha', { required: true })}
        {field('email', 'Adresse email', 'contact@exemple.tn', { type: 'email', required: true })}
        {field('telephone', 'Téléphone', '71 234 567')}
        {field('adresse', 'Adresse', 'Tunis')}
        {errors._ && <p className="err-msg full">{errors._[0]}</p>}
        <button type="submit" disabled={saving} className={`btn full ${editing ? 'btn-amber' : 'btn-brand'}`}>
          {saving ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Ajouter le client'}
        </button>
      </form>

      <input className="input search" placeholder="Rechercher par nom, email ou téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <Table heads={['Client', 'Email', 'Téléphone', 'Adresse', 'Actions']} isEmpty={!shown.length}
        empty={loading ? 'Chargement…' : q ? 'Aucun client ne correspond à la recherche.' : 'Aucun client pour le moment. Ajoutez le premier ci-dessus.'}>
        {shown.map((c, i) => (
          <tr key={idOf(c)} className="row" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
            <td className="strong">{c.nom}</td>
            <td className="muted">{c.email}</td>
            <td>{c.telephone || '—'}</td>
            <td>{c.adresse || '—'}</td>
            <Actions onEdit={() => edit(c)} onDelete={() => remove(idOf(c), c.nom)} />
          </tr>
        ))}
      </Table>
    </>
  );
}