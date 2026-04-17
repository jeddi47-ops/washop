import React, { createContext, useContext, useState, useCallback } from 'react';

const LangContext = createContext(null);

const translations = {
  fr: {
    nav: { search: "Rechercher un produit...", login: "Connexion", register: "S'inscrire", logout: "Deconnexion", profile: "Mon profil", dashboard: "Tableau de bord", cart: "Panier" },
    hero: { title: "La marketplace WhatsApp", subtitle: "Decouvrez des milliers de boutiques, commandez en un clic sur WhatsApp", explore: "Explorer les boutiques", become_vendor: "Devenir vendeur" },
    how: { title: "Comment ca marche ?", client_title: "Pour les clients", client_steps: ["Parcourez les produits", "Ajoutez au panier", "Commandez via WhatsApp"], vendor_title: "Pour les vendeurs", vendor_steps: ["Creez votre boutique", "Ajoutez vos produits", "Recevez des commandes"] },
    pricing: { title: "Nos abonnements", subtitle: "Choisissez le plan adapte a votre activite", monthly: "Mensuel", annual: "Annuel", products: "produits", unlimited: "Illimite", search_priority: "Priorite recherche", daily_featured: "Produit mis en avant/jour", promoted_7: "7 produits promus 14j", search_misses: "Rapport recherches manquees", promo_email: "Email promo aux clients", monthly_report: "Rapport mensuel stats", recommended: "Recommande", choose: "Choisir ce plan", per_month: "/mois", per_year: "/an", save: "Economisez" },
    flash: { title: "Ventes Flash", limited: "LIMITE", ends_in: "Fin dans" },
    featured: { title: "Selection Washop" },
    trending: { title: "Tendances" },
    testimonials: { title: "Ce que disent nos vendeurs" },
    catalog: { title: "Catalogue", all: "Tous", load_more: "Charger plus", no_products: "Aucun produit trouve", sort_recent: "Plus recents", sort_price_asc: "Prix croissant", sort_price_desc: "Prix decroissant", sort_clicks: "Plus populaires", filters: "Filtres", price_range: "Fourchette de prix", category: "Categorie", apply: "Appliquer" },
    product: { add_cart: "Ajouter au panier", order_whatsapp: "Commander via WhatsApp", in_stock: "En stock", out_of_stock: "Rupture de stock", reviews: "avis", description: "Description", product_reviews: "Avis produits", vendor_reviews: "Avis vendeur", similar: "Produits similaires", see_shop: "Voir la boutique", verified: "Verifie", leave_review: "Laisser un avis" },
    cart: { title: "Mon panier", empty: "Votre panier est vide", explore: "Explorer les boutiques", subtotal: "Sous-total", order_wa: "Commander via WhatsApp", continue: "Continuer mes achats", switch_vendor: "Votre panier contient des produits d'une autre boutique. Vider et continuer ?", clear_continue: "Vider et continuer", cancel: "Annuler" },
    auth: { login_title: "Connexion", register_title: "Creer un compte", email: "Email", password: "Mot de passe", name: "Nom complet", address: "Adresse", login_btn: "Se connecter", register_btn: "Creer mon compte", forgot: "Mot de passe oublie ?", no_account: "Pas encore de compte ?", has_account: "Deja un compte ?", client_role: "Je suis client", vendor_role: "Je suis vendeur", client_desc: "Achetez des produits via WhatsApp", vendor_desc: "Vendez vos produits sur Washop", shop_name: "Nom de la boutique", whatsapp: "Numero WhatsApp", forgot_title: "Mot de passe oublie", forgot_desc: "Entrez votre email pour recevoir un lien", send_link: "Envoyer le lien", reset_title: "Nouveau mot de passe", new_password: "Nouveau mot de passe", confirm_password: "Confirmer", reset_btn: "Reinitialiser", back_login: "Retour a la connexion" },
    search: { title: "Resultats pour", no_results: "Aucun resultat pour", noted: "Nous avons note votre recherche — Les vendeurs seront informes", explore_all: "Explorer toutes les boutiques" },
    about: { title: "A propos de Washop", hero_text: "La premiere marketplace mondiale basee sur WhatsApp", mission_title: "Notre mission", mission: "Connecter vendeurs et acheteurs du monde entier grace a la simplicite de WhatsApp. Pas d'application complexe, pas de processus de paiement complique — juste une commande envoyee directement au vendeur.", how_title: "Comment fonctionne Washop ?", values_title: "Nos valeurs", simplicity: "Simplicite", simplicity_desc: "Commander en un clic via WhatsApp", global: "Accessibilite globale", global_desc: "Disponible partout ou WhatsApp fonctionne", trust: "Confiance", trust_desc: "Avis verifies et vendeurs certifies" },
    footer: { tagline: "La marketplace WhatsApp mondiale", about: "A propos", contact: "Contact", terms: "CGU", privacy: "Confidentialite", rights: "Tous droits reserves" },
    common: { loading: "Chargement...", error: "Une erreur est survenue", back: "Retour", save: "Enregistrer", delete: "Supprimer", confirm: "Confirmer", close: "Fermer" },
    notfound: { title: "Page introuvable", desc: "La page que vous cherchez n'existe pas", home: "Retour a l'accueil" }
  },
  en: {
    nav: { search: "Search a product...", login: "Login", register: "Sign up", logout: "Logout", profile: "My profile", dashboard: "Dashboard", cart: "Cart" },
    hero: { title: "The WhatsApp marketplace", subtitle: "Discover thousands of shops, order in one click on WhatsApp", explore: "Explore shops", become_vendor: "Become a vendor" },
    how: { title: "How does it work?", client_title: "For clients", client_steps: ["Browse products", "Add to cart", "Order via WhatsApp"], vendor_title: "For vendors", vendor_steps: ["Create your shop", "Add your products", "Receive orders"] },
    pricing: { title: "Our plans", subtitle: "Choose the plan that fits your business", monthly: "Monthly", annual: "Annual", products: "products", unlimited: "Unlimited", search_priority: "Search priority", daily_featured: "Daily featured product", promoted_7: "7 promoted products 14d", search_misses: "Search misses report", promo_email: "Promo email to clients", monthly_report: "Monthly stats report", recommended: "Recommended", choose: "Choose this plan", per_month: "/month", per_year: "/year", save: "Save" },
    flash: { title: "Flash Sales", limited: "LIMITED", ends_in: "Ends in" },
    featured: { title: "Washop Selection" },
    trending: { title: "Trending" },
    testimonials: { title: "What our vendors say" },
    catalog: { title: "Catalog", all: "All", load_more: "Load more", no_products: "No products found", sort_recent: "Most recent", sort_price_asc: "Price low to high", sort_price_desc: "Price high to low", sort_clicks: "Most popular", filters: "Filters", price_range: "Price range", category: "Category", apply: "Apply" },
    product: { add_cart: "Add to cart", order_whatsapp: "Order via WhatsApp", in_stock: "In stock", out_of_stock: "Out of stock", reviews: "reviews", description: "Description", product_reviews: "Product reviews", vendor_reviews: "Vendor reviews", similar: "Similar products", see_shop: "See shop", verified: "Verified", leave_review: "Leave a review" },
    cart: { title: "My cart", empty: "Your cart is empty", explore: "Explore shops", subtotal: "Subtotal", order_wa: "Order via WhatsApp", continue: "Continue shopping", switch_vendor: "Your cart has items from another shop. Clear and continue?", clear_continue: "Clear and continue", cancel: "Cancel" },
    auth: { login_title: "Login", register_title: "Create account", email: "Email", password: "Password", name: "Full name", address: "Address", login_btn: "Log in", register_btn: "Create my account", forgot: "Forgot password?", no_account: "No account yet?", has_account: "Already have an account?", client_role: "I'm a client", vendor_role: "I'm a vendor", client_desc: "Buy products via WhatsApp", vendor_desc: "Sell your products on Washop", shop_name: "Shop name", whatsapp: "WhatsApp number", forgot_title: "Forgot password", forgot_desc: "Enter your email to receive a reset link", send_link: "Send link", reset_title: "New password", new_password: "New password", confirm_password: "Confirm", reset_btn: "Reset", back_login: "Back to login" },
    search: { title: "Results for", no_results: "No results for", noted: "We noted your search — Vendors will be informed", explore_all: "Explore all shops" },
    about: { title: "About Washop", hero_text: "The first global WhatsApp-based marketplace", mission_title: "Our mission", mission: "Connecting vendors and buyers worldwide through the simplicity of WhatsApp. No complex app, no complicated payment process — just an order sent directly to the vendor.", how_title: "How does Washop work?", values_title: "Our values", simplicity: "Simplicity", simplicity_desc: "Order in one click via WhatsApp", global: "Global access", global_desc: "Available everywhere WhatsApp works", trust: "Trust", trust_desc: "Verified reviews and certified vendors" },
    footer: { tagline: "The global WhatsApp marketplace", about: "About", contact: "Contact", terms: "Terms", privacy: "Privacy", rights: "All rights reserved" },
    common: { loading: "Loading...", error: "An error occurred", back: "Back", save: "Save", delete: "Delete", confirm: "Confirm", close: "Close" },
    notfound: { title: "Page not found", desc: "The page you are looking for does not exist", home: "Back to home" }
  }
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('washop_lang') || 'fr');
  const t = translations[lang] || translations.fr;
  const toggleLang = () => {
    const next = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    localStorage.setItem('washop_lang', next);
  };
  return <LangContext.Provider value={{ lang, t, toggleLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
