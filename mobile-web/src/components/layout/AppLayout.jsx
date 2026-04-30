import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-surface-secondary">
      <div className="app-shell w-full max-w-[460px] mx-auto min-h-dvh bg-surface/70">
        <Header />
        <main className="flex-1 pb-24 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
      <div className="fixed inset-y-0 left-0 right-0 pointer-events-none -z-10">
        <div className="w-full max-w-[460px] mx-auto h-full border-x border-border/50" />
      </div>
    </div>
  );
}
