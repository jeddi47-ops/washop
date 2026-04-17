import React from 'react';
import { useLang } from '../contexts/LangContext';
import { ShieldCheck, Globe, Heart, ShoppingBag, MessageCircle, Store, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const { t } = useLang();

  const steps = [
    { icon: <ShoppingBag className="w-6 h-6" />, title: 'Parcourez', desc: "Explorez des milliers de produits de vendeurs du monde entier." },
    { icon: <Heart className="w-6 h-6" />, title: 'Choisissez', desc: "Ajoutez au panier, comparez les prix, lisez les avis." },
    { icon: <MessageCircle className="w-6 h-6" />, title: 'Commandez', desc: "Un clic, et votre commande est envoyee directement au vendeur via WhatsApp." },
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Recevez', desc: "Negociez, payez et recevez votre commande en toute confiance." },
  ];

  const values = [
    { icon: <MessageCircle className="w-8 h-8" />, title: t.about.simplicity, desc: t.about.simplicity_desc },
    { icon: <Globe className="w-8 h-8" />, title: t.about.global, desc: t.about.global_desc },
    { icon: <ShieldCheck className="w-8 h-8" />, title: t.about.trust, desc: t.about.trust_desc },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 animate-fade-in" data-testid="about-page">
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <img src="/logo.png" alt="Washop" className="h-20 w-20 rounded-2xl mx-auto mb-6 object-cover" />
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{t.about.title}</h1>
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">{t.about.hero_text}</p>
      </section>

      {/* Mission */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto glass p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-4 text-[#25D366]">{t.about.mission_title}</h2>
          <p className="text-gray-300 leading-relaxed">{t.about.mission}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">{t.about.how_title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="glass p-6 text-center relative">
                <div className="w-14 h-14 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] mx-auto mb-4">{s.icon}</div>
                <span className="absolute top-3 left-3 text-xs text-[#25D366] font-bold">0{i + 1}</span>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">{t.about.values_title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={i} className="glass p-6 text-center hover:border-[#25D366]/30 transition">
                <div className="w-16 h-16 rounded-2xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] mx-auto mb-4">{v.icon}</div>
                <h3 className="font-bold mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-lg mx-auto glass p-8">
          <Store className="w-12 h-12 text-[#25D366] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Pret a commencer ?</h2>
          <p className="text-sm text-gray-400 mb-6">Rejoignez des milliers de vendeurs et acheteurs sur Washop</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2">Creer un compte <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/" className="btn-secondary">Explorer les boutiques</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
