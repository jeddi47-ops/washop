import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, MessageCircle, Store, ShieldCheck, Star,
  Zap, Package, BarChart3, Link2, Crown, Check, X as XIcon,
  ChevronDown, ArrowRight, Users, Globe, Clock, Sparkles,
} from 'lucide-react';

/* ─── Animation hook ─────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Section wrapper with fade-in ──────────────────────────────────────── */
function Section({ children, className = '' }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

/* ─── FAQ Item ───────────────────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-gray-800 hover:text-[#25D366] transition">
        {q}
        <ChevronDown size={16} className={`flex-shrink-0 ml-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function About() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden pt-24 pb-20 px-4"
        style={{ background: 'linear-gradient(135deg, #0f1923 0%, #1a2e1a 50%, #0d2d1a 100%)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2325D366' fill-opacity='1'%3E%3Ccircle cx='5' cy='5' r='1.5'/%3E%3Ccircle cx='45' cy='5' r='1.5'/%3E%3Ccircle cx='5' cy='45' r='1.5'/%3E%3Ccircle cx='45' cy='45' r='1.5'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #25D366 0%, transparent 70%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={12} /> La marketplace WhatsApp d'Afrique
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
            Tout ce que vous devez<br />
            savoir sur{' '}
            <span style={{ color: '#25D366' }}>Washop</span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            La plateforme qui connecte les vendeurs locaux à leurs clients via WhatsApp.
            Simple, professionnel, sans commission.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
              style={{ background: '#25D366' }}>
              Créer ma boutique <ArrowRight size={16} />
            </Link>
            <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm border border-white/20 hover:bg-white/10 transition">
              Explorer les boutiques
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-14">
            {[
              { icon: Store, label: 'Boutiques actives', value: '100+' },
              { icon: Globe, label: 'Pays couverts', value: '10+' },
              { icon: Users, label: 'Clients satisfaits', value: '500+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-center">
                  <Icon size={12} className="text-[#25D366]" /> {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-24">

        {/* ══ POUR LES ACHETEURS ════════════════════════════════════════════ */}
        <Section>
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-widest mb-3">
              Pour les acheteurs
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Commander en 3 étapes</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Trouvez ce que vous cherchez, contactez le vendeur, recevez votre commande. Aussi simple que ça.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01', icon: ShoppingBag, color: '#3b82f6',
                title: 'Parcourez les boutiques',
                desc: "Explorez des milliers de produits de vendeurs locaux vérifiés. Filtrez par catégorie, comparez les prix, lisez les avis clients.",
              },
              {
                step: '02', icon: MessageCircle, color: '#25D366',
                title: 'Contactez sur WhatsApp',
                desc: "Un clic sur le bouton WhatsApp et vous êtes directement en contact avec le vendeur. Négociez, posez vos questions, confirmez votre commande.",
              },
              {
                step: '03', icon: ShieldCheck, color: '#f59e0b',
                title: 'Recevez votre commande',
                desc: "Le vendeur vous confirme la disponibilité et organise la livraison selon vos préférences. Vous payez comme vous l'arrangez ensemble.",
              },
            ].map(({ step, icon: Icon, color, title, desc }) => (
              <div key={step} className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="absolute top-4 right-4 text-5xl font-black opacity-5 select-none">{step}</div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Avantages acheteurs */}
          <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
            <h3 className="font-bold text-gray-900 mb-5 text-lg">Pourquoi acheter sur Washop ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Star, text: 'Vendeurs notés et vérifiés — achetez en confiance' },
                { icon: Zap, text: 'Réponse rapide via WhatsApp — pas d\'attente' },
                { icon: Globe, text: 'Vendeurs locaux — livraison dans votre ville' },
                { icon: ShieldCheck, text: 'Avis clients vérifiés sur chaque boutique' },
                { icon: Package, text: 'Catalogue complet — tous les produits en un coup d\'œil' },
                { icon: Clock, text: 'Boutiques ouvertes 24h/24, 7j/7' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={13} className="text-blue-600" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ══ POUR LES VENDEURS ════════════════════════════════════════════ */}
        <Section>
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-[#25D366] uppercase tracking-widest mb-3">
              Pour les vendeurs
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Votre boutique en ligne en 5 minutes</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Pas besoin d'un développeur. Pas besoin d'une carte bancaire. Juste votre téléphone et vos produits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {[
              {
                step: '01', icon: Store, title: 'Créez votre boutique',
                desc: "Inscrivez-vous, donnez un nom à votre boutique, choisissez votre thème de couleur parmi 8 options. Votre boutique est en ligne en moins de 5 minutes.",
              },
              {
                step: '02', icon: Package, title: 'Ajoutez vos produits',
                desc: "Photos, prix, description, stock, devise locale — tout se configure facilement. Organisez vos produits par catégories personnalisées.",
              },
              {
                step: '03', icon: Link2, title: 'Partagez votre lien',
                desc: "Vous recevez un lien unique (washop.app/votre-boutique). Partagez-le sur WhatsApp, Instagram, TikTok, Facebook — partout où se trouvent vos clients.",
              },
              {
                step: '04', icon: BarChart3, title: 'Suivez vos performances',
                desc: "Tableau de bord avec statistiques en temps réel : vues, clics, commandes, produits les plus populaires. Prenez les bonnes décisions.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                  <Icon size={20} style={{ color: '#25D366' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-gray-300">{step}</span>
                    <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Avantages vendeurs */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h3 className="font-bold text-lg mb-6">Pourquoi vendre sur Washop ?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { text: 'Zéro commission sur vos ventes — 100% pour vous' },
                { text: 'Boutique visible 24h/24 — même quand vous dormez' },
                { text: 'Vos clients commandent via WhatsApp — outil que vous maîtrisez déjà' },
                { text: 'Thème de couleur personnalisé — boutique unique à votre image' },
                { text: 'Statistiques pour comprendre vos clients' },
                { text: 'Essai gratuit 7 jours — aucune carte bancaire requise' },
                { text: 'Activation par clé — accessible sans carte internationale' },
                { text: 'Support direct — vous n\'êtes jamais seul' },
              ].map(({ text }) => (
                <div key={text} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check size={14} className="text-[#25D366] flex-shrink-0 mt-0.5" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ══ COMPARAISON ABONNEMENTS ══════════════════════════════════════ */}
        <Section>
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 uppercase tracking-widest mb-3">
              Abonnements
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Choisissez votre plan</h2>
            <p className="text-gray-500 mt-3">7 jours gratuits pour tester, aucune carte bancaire requise.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Basic', price: '10$', period: '/mois',
                color: '#25D366', bg: '#f0fdf4',
                badge: null,
                desc: 'Idéal pour démarrer et tester le marché.',
                features: [
                  '30 produits maximum',
                  'Boutique premium visible',
                  '3 thèmes de couleur',
                  '3 catégories boutique',
                  'Statistiques basiques',
                  'Lien boutique unique',
                  'Essai 7 jours gratuit',
                ],
                missing: [
                  'Badge vérifié',
                  'Produit mis en avant',
                  'Thèmes illimités',
                  'Catégories illimitées',
                  'Statistiques avancées',
                ],
                cta: 'https://nzaofhms.mychariow.shop/prd_fih09v/checkout',
              },
              {
                name: 'Premium', price: '20$', period: '/mois',
                color: '#3b82f6', bg: '#eff6ff',
                badge: 'RECOMMANDÉ',
                desc: 'Pour les vendeurs sérieux qui veulent croître.',
                features: [
                  'Produits illimités',
                  'Boutique premium visible',
                  '8 thèmes de couleur',
                  'Catégories illimitées',
                  'Badge vérifié ✓',
                  '1 produit mis en avant/jour',
                  'Statistiques avancées',
                  'Lien boutique unique',
                  'Essai 7 jours gratuit',
                ],
                missing: [],
                cta: 'https://nzaofhms.mychariow.shop/prd_u4c5d3/checkout',
              },
            ].map((plan) => (
              <div key={plan.name} className="relative bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col"
                style={{ borderColor: plan.color }}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold"
                    style={{ background: plan.color }}>
                    {plan.badge}
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-gray-900">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{plan.desc}</p>
                </div>

                <div className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check size={14} style={{ color: plan.color, flexShrink: 0 }} />
                      <span className="text-gray-700">{f}</span>
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <XIcon size={14} className="text-gray-300 flex-shrink-0" />
                      <span className="text-gray-400">{f}</span>
                    </div>
                  ))}
                </div>

                <a href={plan.cta} target="_blank" rel="noreferrer"
                  className="block text-center py-3 rounded-xl font-bold text-white text-sm transition hover:opacity-90"
                  style={{ background: plan.color }}>
                  Commencer avec {plan.name} →
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Après paiement vous recevez une clé d'activation à entrer dans votre tableau de bord.
            Pas de carte bancaire pour l'essai gratuit.
          </p>
        </Section>

        {/* ══ POURQUOI WASHOP ══════════════════════════════════════════════ */}
        <Section>
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 uppercase tracking-widest mb-3">
              Notre différence
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Pourquoi choisir Washop ?</h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  <th className="text-left p-4 font-bold text-gray-600">Fonctionnalité</th>
                  <th className="text-center p-4 font-bold" style={{ color: '#25D366' }}>Washop</th>
                  <th className="text-center p-4 font-bold text-gray-400">WhatsApp seul</th>
                  <th className="text-center p-4 font-bold text-gray-400">Autres plateformes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Boutique permanente 24h/24', true, false, true],
                  ['Zéro commission', true, true, false],
                  ['Commande via WhatsApp', true, true, false],
                  ['URL unique partageable', true, false, true],
                  ['Statistiques vendeur', true, false, true],
                  ['Accessible sans carte bancaire', true, true, false],
                  ['Thème personnalisable', true, false, false],
                  ['Essai gratuit 7 jours', true, true, false],
                ].map(([feature, washop, whatsapp, others]) => (
                  <tr key={feature} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="p-4 font-medium text-gray-700">{feature}</td>
                    <td className="p-4 text-center">
                      {washop ? <Check size={18} className="mx-auto" style={{ color: '#25D366' }} /> : <XIcon size={18} className="mx-auto text-red-300" />}
                    </td>
                    <td className="p-4 text-center">
                      {whatsapp ? <Check size={18} className="mx-auto text-gray-400" /> : <XIcon size={18} className="mx-auto text-red-200" />}
                    </td>
                    <td className="p-4 text-center">
                      {others ? <Check size={18} className="mx-auto text-gray-400" /> : <XIcon size={18} className="mx-auto text-red-200" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ══ FAQ ══════════════════════════════════════════════════════════ */}
        <Section>
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-widest mb-3">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Questions fréquentes</h2>
          </div>

          <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl px-6 shadow-sm">
            {[
              { q: "Washop est-il disponible dans mon pays ?", a: "Washop est accessible depuis n'importe quel pays avec une connexion internet. Que vous soyez en RDC, en Côte d'Ivoire, au Cameroun, au Sénégal ou en Europe — votre boutique est en ligne pour tout le monde." },
              { q: "Comment payer mon abonnement sans carte bancaire ?", a: "Washop utilise un système de clés d'activation. Vous achetez une clé sur notre boutique en ligne via les méthodes de paiement locales disponibles, puis vous entrez la clé dans votre tableau de bord. Aucune carte bancaire internationale requise." },
              { q: "Washop prend-il une commission sur mes ventes ?", a: "Non, zéro commission. Vous payez uniquement l'abonnement mensuel. Tout ce que vous gagnez vous appartient à 100%." },
              { q: "Comment mes clients me contactent pour commander ?", a: "Depuis votre boutique Washop, il y a un bouton WhatsApp. Vos clients cliquent dessus et sont redirigés directement vers votre WhatsApp avec un message pré-rempli incluant le produit qui les intéresse." },
              { q: "Puis-je changer de plan à tout moment ?", a: "Oui. Vous pouvez passer du plan Basic au plan Premium en activant une nouvelle clé d'accès Premium. Votre boutique et vos produits sont conservés lors du changement." },
              { q: "Que se passe-t-il à la fin de mon essai gratuit ?", a: "Après 7 jours, votre boutique devient temporairement invisible jusqu'à ce que vous activiez une clé d'abonnement. Vos produits et données sont conservés, rien n'est supprimé." },
              { q: "Mes clients doivent-ils créer un compte pour voir ma boutique ?", a: "Non. N'importe qui peut visiter votre boutique et voir vos produits sans créer de compte. Seul le vendeur a besoin d'un compte Washop." },
            ].map((faq) => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </Section>

        {/* ══ CTA FINAL ════════════════════════════════════════════════════ */}
        <Section>
          <div className="rounded-3xl p-10 md:p-14 text-center text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f1923 0%, #1a2e1a 50%, #0d2d1a 100%)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #25D366 0%, transparent 70%)' }} />

            <div className="relative">
              <Crown size={32} className="mx-auto mb-4 opacity-60" style={{ color: '#25D366' }} />
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Prêt à lancer votre boutique ?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
                7 jours gratuits. Aucune carte bancaire. Votre boutique en ligne en 5 minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition hover:opacity-90"
                  style={{ background: '#25D366' }}>
                  Créer ma boutique gratuitement <ArrowRight size={16} />
                </Link>
                <Link to="/"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition">
                  Explorer les boutiques
                </Link>
              </div>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
