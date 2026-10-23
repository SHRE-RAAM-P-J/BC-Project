import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastProvider } from './Toast';

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
        {/* Persistent Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          {/* Clean Academic Capstone Footer */}
          <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <span>
                MediChain — Blockchain Medicine Authenticity System (Semester Project Capstone)
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Solidity 0.8.24 • React 18 • Hardhat • Ethers v6
              </span>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
};
