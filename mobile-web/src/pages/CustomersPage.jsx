import { useState, useEffect } from 'react';
import { Plus, Phone, MapPin, ChevronRight } from 'lucide-react';
import { customersApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = () => {
    setLoading(true);
    customersApi.getAll()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCustomers(); }, []);

  const filtered = customers.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const handleCreate = async () => {
    if (!formData.name) return;
    setSubmitting(true);
    try {
      await customersApi.create(formData);
      setShowForm(false);
      setFormData({ name: '', phone: '', address: '' });
      loadCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Customers</h1>
            <p className="text-xs text-text-secondary">{customers.length} total</p>
          </div>
          <Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>
            Add
          </Button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={search ? 'Try a different search' : 'Add your first customer'}
            action={!search && (
              <Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>Add Customer</Button>
            )}
          />
        ) : (
          filtered.map(customer => (
            <Card key={customer.id}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary-600">
                    {(customer.name || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{customer.name}</p>
                  {customer.phone && (
                    <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </p>
                  )}
                  {customer.address && (
                    <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {customer.address}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Customer Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Customer">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Customer name"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
          />
          <Input
            label="Address"
            placeholder="Delivery address"
            value={formData.address}
            onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
          />
          <Button size="full" loading={submitting} onClick={handleCreate}>
            Create Customer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
