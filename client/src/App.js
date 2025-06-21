import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MonthView from './components/MonthView';
import ProjectsView from './components/ProjectsView';
import TimeTracker from './components/TimeTracker';
import ResourcesView from './components/ResourcesView';
import ProgressAnalytics from './components/ProgressAnalytics';
import Goals from './components/Goals';
import ProjectDetail from './components/ProjectDetail';
import Settings from './components/Settings';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleThemeChange = () => {
      const settings = JSON.parse(localStorage.getItem('ml-tracker-settings') || '{}');
      const theme = settings?.preferences?.theme || 'auto';
      const root = window.document.documentElement;

      const isDark =
        theme === 'dark' ||
        (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      root.classList.toggle('dark', isDark);
    };

    handleThemeChange();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    window.addEventListener('storage', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);
  
  return (
    <div className="relative flex min-h-screen bg-background font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-72">
        <header className="lg:hidden flex items-center justify-between p-4 border-b">
          <h1 className="font-bold text-xl text-foreground">Trackify</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu />
          </Button>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/month/:monthNumber" element={<MonthView />} />
                  <Route path="/projects" element={<ProjectsView />} />
                  <Route path="/time-tracker" element={<TimeTracker />} />
                  <Route path="/resources" element={<ResourcesView />} />
                  <Route path="/analytics" element={<ProgressAnalytics />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/project/:projectId" element={<ProjectDetail />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: 'hsl(var(--secondary))',
              color: 'hsl(var(--secondary-foreground))',
            },
          },
          error: {
            style: {
              background: 'hsl(var(--destructive))',
              color: 'hsl(var(--destructive-foreground))',
            },
          },
        }}
      />
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper; 