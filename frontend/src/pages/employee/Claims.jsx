import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { claims } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, ChevronLeft, Send, Loader2, Star } from 'lucide-react';

const statusColor = { open: 'bg-blue-50 text-blue-600', in_progress: 'bg-yellow-50 text-yellow-600', resolved: 'bg-green-50 text-green-600', closed: 'bg-gray-100 text-gray-500' };
const statusLabel = { open: 'Ouverte', in_progress: 'En cours', resolved: 'Resolue', closed: 'Fermee' };

export default function EmployeeClaims() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { limit: 50 };
    if (filter) params.status = filter;
    claims.list(params).then(r => { setItems(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="employee-claims">
      <div className="max-w-4xl mx-auto">
        <div className="glass p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mes reclamations assignees</h1>
          <p className="text-sm text-gray-500 mt-1">Repondez aux clients et moderez les avis</p>
          <Link to="/employee/reviews" className="inline-flex items-center gap-1 mt-3 text-sm text-[#25D366] hover:underline"><Star className="w-4 h-4" /> Moderer les avis</Link>
        </div>

        <div className="flex gap-2 mb-4">
          {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === s ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600'}`}>{s ? statusLabel[s] : 'Toutes'}</button>
          ))}
        </div>

        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? <div className="text-center py-20 text-gray-400"><MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Aucune reclamation assignee</p></div> :
        <div className="space-y-2">
          {items.map(c => (
            <Link key={c.id} to={`/employee/claims/${c.id}`} className="glass p-4 block hover:border-[#25D366] hover:shadow-md transition">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900 truncate pr-4">{c.subject}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[c.status]}`}>{statusLabel[c.status]}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{c.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>}
      </div>
    </div>
  );
}

export function EmployeeClaimDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchClaim = async () => { try { const { data } = await claims.get(id); setClaim(data.data); } catch {} setLoading(false); };
  useEffect(() => { fetchClaim(); }, [id]); // eslint-disable-line

  const sendMsg = async (e) => { e.preventDefault(); if (!msg.trim()) return; setSending(true); try { await claims.addMessage(id, { message: msg.trim() }); setMsg(''); fetchClaim(); } catch {} setSending(false); };
  const changeStatus = async (status) => { try { await claims.updateStatus(id, { status }); fetchClaim(); } catch {} };

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-3xl mx-auto space-y-4"><div className="h-20 animate-shimmer rounded-xl" /></div></div>;
  if (!claim) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Reclamation non trouvee</div>;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="employee-claim-detail">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/employee/claims" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <div className="flex-1 min-w-0"><h1 className="text-lg font-bold text-gray-900 truncate">{claim.subject}</h1></div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[claim.status]}`}>{statusLabel[claim.status]}</span>
        </div>

        <div className="flex gap-2 mb-4">
          {['in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => changeStatus(s)} disabled={claim.status === s} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${claim.status === s ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{statusLabel[s]}</button>
          ))}
        </div>

        <div className="glass p-4 mb-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {(claim.messages || []).map(m => {
            const isClient = m.sender_role === 'client';
            return (
              <div key={m.id} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isClient ? 'bg-gray-100 text-gray-800 rounded-bl-sm' : 'bg-green-100 text-gray-800 rounded-br-sm'}`}>
                  {!isClient && <p className="text-xs text-[#25D366] font-semibold mb-1">Support</p>}
                  <p>{m.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
        </div>

        {claim.status !== 'closed' && (
          <form onSubmit={sendMsg} className="flex gap-2">
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Repondre..." className="flex-1 !text-sm" />
            <button type="submit" disabled={sending || !msg.trim()} className="btn-primary !p-3">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
          </form>
        )}
      </div>
    </div>
  );
}
