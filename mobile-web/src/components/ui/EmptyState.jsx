import { Package } from 'lucide-react';

export default function EmptyState({ icon: Icon = Package, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-tertiary flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-text-tertiary" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-[260px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
