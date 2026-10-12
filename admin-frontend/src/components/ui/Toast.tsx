import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export const Toaster: React.FC = () => {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={3500}
      toastOptions={{
        className: 'rounded-xl text-sm font-medium shadow-lg',
      }}
    />
  );
};
