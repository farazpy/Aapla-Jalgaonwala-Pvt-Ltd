import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'Unable to load data at this time. Please check your connection and try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-red-50/50 rounded-3xl border border-red-200/80 my-8">
      <div className="p-4 bg-red-100 rounded-2xl mb-4">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-2">{title}</h3>
      <p className="text-sm text-stone-600 max-w-md mb-6">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary" size="md">
          Retry Again
        </Button>
      )}
    </div>
  );
};
