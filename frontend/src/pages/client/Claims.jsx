import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { claims } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, ChevronLeft, Send, Loader2, Plus, AlertCircle } from 'lucide-react';
import { orders as ordersApi } from '../../lib/api';

const statusColor = { open: 'bg-blue-500/20 text-blue-400', in_progress: 'bg-yellow-500/20 text-yellow-400', resolved: 'bg-[#25D366]/20 text-[#25D366]', closed: 'bg-gray-500/20 text-gray-400' };
const statusLabel = { open: 'Ouverte', in_progress: 'En cours', resolved: 'Resolue', closed: 'Fermee' };

export default function ClientClaims() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { claims.list({ limit: 50 }).then(r => { setItems(r.data.data || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="client-claims">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/client/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex-1">Reclamations</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1" data-testid="new-claim-btn">
            <Plus className="w-4 h-4" /> Nouvelle
          </button>
        </div>

        {showForm && <NewClaimForm onCreated={(c) => { setItems(prev => [c, ...prev]); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucune reclamation</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Ouvrir une reclamation</button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(c => (
              <Link key={c.id} to={`/client/claims/${c.id}`} className="glass p-4 block hover:border-[#25D366]/20 transition">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold truncate pr-4">{c.subject}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.message}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewClaimForm({ onCreated, onCancel }) {
  const [myOrders, setMyOrders] = useState([]);
  const [form, setForm] = useState({ vendor_id: '', order_id: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { ordersApi.me({ limit: 50 }).then(r => setMyOrders(r.data.data || [])).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { vendor_id: form.vendor_id, subject: form.subject, message: form.message };
      if (form.order_id) payload.order_id = form.order_id;
      const { data } = await claims.create(payload);
      onCreated(data.data);
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    setLoading(false);
  };

  const selectedOrder = myOrders.find(o => o.id === form.order_id);

  return (
    <form onSubmit={submit} className="glass p-5 mb-6 space-y-4 animate-fade-in" data-testid="claim-form">
      {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">Commande concernee</label>
        <select value={form.order_id} onChange={e => { const o = myOrders.find(x => x.id === e.target.value); setForm(f => ({ ...f, order_id: e.target.value, vendor_id: o?.vendor_id || '' })); }} className="!text-sm">
          <option value="">Selectionnez une commande</option>
          {myOrders.map(o => <option key={o.id} value={o.id}>#{o.id?.slice(-8)} - {new Date(o.created_at).toLocaleDateString()}</option>)}
        </select>
      </div>
      {!form.order_id && (
        <div>
          <label className="text-sm text-gray-500 mb-1 block">ID Vendeur</label>
          <input value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} required placeholder="ID du vendeur" className="!text-sm" />
        </div>
      )}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">Sujet</label>
        <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required maxLength={200} className="!text-sm" />
      </div>
      <div>
        <label className="text-sm text-gray-500 mb-1 block">Message</label>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={4} className="!text-sm" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 !text-sm">Annuler</button>
        <button type="submit" disabled={loading || !form.vendor_id} className="btn-primary flex-1 !text-sm flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Envoyer
        </button>
      </div>
    </form>
  );
}

export function ClientClaimDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchClaim = async () => {
    try { const { data } = await claims.get(id); setClaim(data.data); } catch {}
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchClaim(); }, [id]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    try {
      await claims.addMessage(id, { message: msg.trim() });
      setMsg('');
      fetchClaim();
    } catch {}
    setSending(false);
  };

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-3xl mx-auto space-y-4"><div className="h-20 animate-shimmer rounded-xl" /><div className="h-60 animate-shimmer rounded-xl" /></div></div>;
  if (!claim) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-600">Reclamation non trouvee</div>;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="claim-detail">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/client/claims" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{claim.subject}</h1>
            <p className="text-xs text-gray-500">{new Date(claim.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[claim.status]}`}>{statusLabel[claim.status]}</span>
        </div>

        {/* Messages */}
        <div className="glass p-4 mb-4 space-y-3 max-h-[50vh] overflow-y-auto" data-testid="claim-messages">
          {(claim.messages || []).map(m => {
            const isClient = m.sender_role === 'client';
            return (
              <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isClient ? 'bg-green-100 text-gray-800 rounded-br-sm' : 'bg-gray-50 text-gray-300 rounded-bl-sm'}`}>
                  {!isClient && <p className="text-xs text-[#25D366] font-semibold mb-1">{m.sender_role === 'admin' ? 'Admin' : 'Support'}</p>}
                  <p>{m.message}</p>
                  <p className="text-[10px] text-gray-500 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply */}
        {claim.status !== 'closed' && (
          <form onSubmit={sendMsg} className="flex gap-2" data-testid="claim-reply">
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Votre message..." className="flex-1 !text-sm" />
            <button type="submit" disabled={sending || !msg.trim()} className="btn-primary !p-3">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
        {claim.status === 'closed' && <p className="text-center text-sm text-gray-500 py-4">Cette reclamation est fermee.</p>}
      </div>
    </div>
  );
}
