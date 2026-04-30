import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-tertiary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface pl-10 pr-9 py-2.5 text-sm
          outline-none transition-all placeholder:text-text-tertiary
          focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-tertiary"
        >
          <X className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      )}
    </div>
  );
}
