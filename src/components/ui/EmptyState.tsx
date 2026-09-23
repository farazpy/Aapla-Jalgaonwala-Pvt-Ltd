import React from 'react';
import { PackageX } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No products found',
  description = 'Try searching with a different term or clearing your filters.',
  icon = <PackageX className="w-12 h-12 text-stone-400" />,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white/60 rounded-3xl border border-stone-200/80 my-8">
      <div className="p-4 bg-stone-100 rounded-2xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-600 max-w-md mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="secondary" size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};
