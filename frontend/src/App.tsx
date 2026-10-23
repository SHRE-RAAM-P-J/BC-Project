import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';

const CommandCenter = lazy(() => import('./pages/CommandCenter').then(m => ({ default: m.CommandCenter })));
const MedicineBatches = lazy(() => import('./pages/MedicineBatches').then(m => ({ default: m.MedicineBatches })));
const BatchDetails = lazy(() => import('./pages/BatchDetails').then(m => ({ default: m.BatchDetails })));
const BlockchainExplorer = lazy(() => import('./pages/BlockchainExplorer').then(m => ({ default: m.BlockchainExplorer })));
const PublicVerification = lazy(() => import('./pages/PublicVerification').then(m => ({ default: m.PublicVerification })));

const PageFallback: React.FC = () => (
  <div className="py-24 flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-mono text-slate-400">Loading module...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/batches" element={<MedicineBatches />} />
            <Route path="/batches/:id" element={<BatchDetails />} />
            <Route path="/explorer" element={<BlockchainExplorer />} />
            <Route path="/verify" element={<PublicVerification />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
