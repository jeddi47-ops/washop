import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search as searchApi } from '../lib/api';
import { useLang } from '../contexts/LangContext';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import { Search, ShoppingBag } from 'lucide-react';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { t } = useLang();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    searchApi.query({ q, page: 1, limit: 20 }).then(r => {
      setResults(r.data.data || []);
      setTotal(r.data.total || 0);
      setPage(1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [q]);

  const loadMore = async () => {
    const next = page + 1;
    const r = await searchApi.query({ q, page: next, limit: 20 });
    setResults(prev => [...prev, ...(r.data.data || [])]);
    setPage(next);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="search-page">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">{t.search.title} "<span className="text-[#25D366]">{q}</span>" <span className="text-sm text-gray-500 font-normal">({total})</span></h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-300 mb-2">{t.search.no_results} "{q}"</p>
            <p className="text-sm text-gray-500 mb-6">{t.search.noted}</p>
            <Link to="/" className="btn-primary !px-8">{t.search.explore_all}</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {results.length < total && (
              <div className="text-center mt-8">
                <button onClick={loadMore} className="btn-secondary !px-8">{t.catalog.load_more}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
