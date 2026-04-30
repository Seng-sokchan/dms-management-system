import { useState, useEffect } from 'react';
import { Plus, Package, ChevronRight, Hash } from 'lucide-react';
import { catalogsApi, itemsApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('catalogs'); // 'catalogs' | 'items'
  const [showForm, setShowForm] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState(null);

  useEffect(() => {
    Promise.all([
      catalogsApi.getAll().catch(() => ({ data: { data: [] } })),
      itemsApi.getAll().catch(() => ({ data: { data: [] } })),
    ]).then(([catRes, itemRes]) => {
      const cats = catRes.data?.data || catRes.data || [];
      const its = itemRes.data?.data || itemRes.data || [];
      setCatalogs(Array.isArray(cats) ? cats : []);
      setItems(Array.isArray(its) ? its : []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredCatalogs = catalogs.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredItems = items.filter(i => {
    const matchSearch = !search || (i.name || '').toLowerCase().includes(search.toLowerCase());
    const matchCatalog = !selectedCatalog || i.catalog_id === selectedCatalog.id;
    return matchSearch && matchCatalog;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">
              {selectedCatalog ? selectedCatalog.name : 'Catalogs'}
            </h1>
            <p className="text-xs text-text-secondary">
              {selectedCatalog
                ? `${filteredItems.length} items`
                : `${catalogs.length} catalogs, ${items.length} items`}
            </p>
          </div>
          {selectedCatalog ? (
            <Button size="sm" variant="secondary" onClick={() => setSelectedCatalog(null)}>
              Back
            </Button>
          ) : (
            <div className="flex gap-1.5">
              {['catalogs', 'items'].map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                    ${view === v ? 'bg-primary-600 text-white' : 'bg-surface-tertiary text-text-secondary'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={selectedCatalog ? 'Search items...' : `Search ${view}...`}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : selectedCatalog || view === 'items' ? (
          /* Items View */
          filteredItems.length === 0 ? (
            <EmptyState icon={Package} title="No items found" description="Items will appear here" />
          ) : (
            filteredItems.map(item => (
              <Card key={item.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-text-tertiary">{item.catalog_name || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary-600">
                      ${Number(item.price_usd || 0).toFixed(2)}
                    </p>
                    {item.price_khr && (
                      <p className="text-xs text-text-tertiary">
                        ៛{Number(item.price_khr).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )
        ) : (
          /* Catalogs View */
          filteredCatalogs.length === 0 ? (
            <EmptyState icon={Package} title="No catalogs found" description="Create your first catalog" />
          ) : (
            filteredCatalogs.map(catalog => {
              const itemCount = items.filter(i => i.catalog_id === catalog.id).length;
              return (
                <Card key={catalog.id} onClick={() => setSelectedCatalog(catalog)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{catalog.name}</p>
                      <p className="text-xs text-text-tertiary flex items-center gap-1">
                        <Hash className="w-3 h-3" /> {itemCount} items
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
                  </div>
                </Card>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
