import { ReactNode } from 'react';
import { Header } from '../shared/Header';
import { StoreProvider } from '../../providers/StoreProvider';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <StoreProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
        {/* Potentially Bottom Nav for mobile app style go here */}
      </div>
    </StoreProvider>
  );
}
