import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';

/* ─── Country data ───────────────────────────────────────────────────────── */
// Afrique francophone / centrale en tête, puis reste du monde alphabétique
const COUNTRIES = [
  // ── Afrique prioritaire ──────────────────────────────────────────────────
  { code: '+243', flag: '🇨🇩', name: 'Congo RDC' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+245', flag: '🇬🇼', name: 'Guinée-Bissau' },
  { code: '+240', flag: '🇬🇶', name: 'Guinée Équatoriale' },
  { code: '+236', flag: '🇨🇫', name: 'Centrafrique' },
  { code: '+235', flag: '🇹🇩', name: 'Tchad' },
  { code: '+243', flag: '🇨🇩', name: 'RDC (Kinshasa)' }, // alias
  { code: '+239', flag: '🇸🇹', name: 'São Tomé-et-Príncipe' },
  { code: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzanie' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+251', flag: '🇪🇹', name: 'Éthiopie' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+27',  flag: '🇿🇦', name: 'Afrique du Sud' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+20',  flag: '🇪🇬', name: 'Égypte' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+262', flag: '🇷🇪', name: 'Réunion' },
  { code: '+269', flag: '🇰🇲', name: 'Comores' },
  { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+260', flag: '🇿🇲', name: 'Zambie' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: '+264', flag: '🇳🇦', name: 'Namibie' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+230', flag: '🇲🇺', name: 'Maurice' },
  // ── Europe ───────────────────────────────────────────────────────────────
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: '+34',  flag: '🇪🇸', name: 'Espagne' },
  { code: '+49',  flag: '🇩🇪', name: 'Allemagne' },
  { code: '+39',  flag: '🇮🇹', name: 'Italie' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+31',  flag: '🇳🇱', name: 'Pays-Bas' },
  // ── Amériques ────────────────────────────────────────────────────────────
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+1',   flag: '🇺🇸', name: 'États-Unis' },
  { code: '+55',  flag: '🇧🇷', name: 'Brésil' },
  // ── Asie / Moyen-Orient ──────────────────────────────────────────────────
  { code: '+971', flag: '🇦🇪', name: 'Émirats arabes unis' },
  { code: '+966', flag: '🇸🇦', name: 'Arabie saoudite' },
  { code: '+961', flag: '🇱🇧', name: 'Liban' },
  { code: '+86',  flag: '🇨🇳', name: 'Chine' },
  { code: '+91',  flag: '🇮🇳', name: 'Inde' },
];

// Déduplique par (code + name) pour l'affichage
const UNIQUE_COUNTRIES = COUNTRIES.filter(
  (c, i, arr) => arr.findIndex(x => x.code === c.code && x.name === c.name) === i
);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function parseValue(value) {
  if (!value) return { dialCode: '+243', local: '' };
  const match = UNIQUE_COUNTRIES
    .slice()
    .sort((a, b) => b.code.length - a.code.length) // longer codes first
    .find(c => value.startsWith(c.code));
  if (match) return { dialCode: match.code, local: value.slice(match.code.length) };
  if (value.startsWith('+')) return { dialCode: '+243', local: value };
  return { dialCode: '+243', local: value };
}

/* ─── Component ─────────────────────────────────────────────────────────── */
/**
 * PhoneInput — country-code selector + local number field.
 *
 * Props
 *  - value     {string}   full number e.g. "+243812345678"
 *  - onChange  {function} called with full number string
 *  - testid    {string}   optional data-testid prefix
 */
export default function PhoneInput({ value, onChange, testid = 'phone' }) {
  const parsed          = parseValue(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [local,    setLocal]    = useState(parsed.local);
  const [open,     setOpen]     = useState(false);
  const [search,   setSearch]   = useState('');
  const dropRef   = useRef(null);
  const searchRef = useRef(null);

  // Sync when parent value changes (e.g. data loaded from API)
  useEffect(() => {
    const p = parseValue(value);
    setDialCode(p.dialCode);
    setLocal(p.local);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const emit = useCallback((code, num) => {
    onChange?.(`${code}${num}`);
  }, [onChange]);

  const selectCountry = (country) => {
    setDialCode(country.code);
    setOpen(false);
    emit(country.code, local);
  };

  const handleLocal = (e) => {
    const num = e.target.value.replace(/[^\d\s\-().]/g, '');
    setLocal(num);
    emit(dialCode, num);
  };

  const filtered = UNIQUE_COUNTRIES.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  const selected = UNIQUE_COUNTRIES.find(c => c.code === dialCode) || UNIQUE_COUNTRIES[0];

  return (
    <div className="flex gap-2 items-stretch" data-testid={testid}>
      {/* ── Country code picker ─────────────────────────────────────────── */}
      <div className="relative flex-shrink-0" ref={dropRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          data-testid={`${testid}-dial-btn`}
          className="h-full flex items-center gap-1.5 px-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700 min-w-[90px]"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span>{selected.code}</span>
          <ChevronDown
            size={14}
            className="text-gray-400 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
            style={{ width: 240 }}
          >
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un pays..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#25D366] transition"
                  data-testid={`${testid}-search`}
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
              {filtered.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4">Aucun résultat</p>
              )}
              {filtered.map((c, i) => (
                <button
                  key={`${c.code}-${c.name}-${i}`}
                  type="button"
                  onClick={() => selectCountry(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition"
                  style={{
                    background: c.code === dialCode && c.name === selected.name ? '#f0fdf4' : undefined,
                  }}
                >
                  <span className="text-base leading-none flex-shrink-0">{c.flag}</span>
                  <span className="flex-1 text-gray-700 truncate">{c.name}</span>
                  <span className="text-gray-400 text-xs font-mono flex-shrink-0">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Local number ────────────────────────────────────────────────── */}
      <input
        type="tel"
        value={local}
        onChange={handleLocal}
        placeholder="812 345 678"
        className="flex-1"
        data-testid={`${testid}-local`}
        inputMode="tel"
      />
    </div>
  );
}
