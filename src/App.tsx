import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';
import { LogPage } from './pages/LogPage';
import { HistoryPage } from './pages/HistoryPage';
import { StatsPage } from './pages/StatsPage';
import { BabiesPage } from './pages/BabiesPage';
import { SettingsPage } from './pages/SettingsPage';
import { useStore } from './store';

export default function App() {
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    const apply = () => {
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      document.documentElement.dataset.theme = resolved;
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (meta) meta.content = resolved === 'dark' ? '#1d1318' : '#f5a3b6';
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return (
    <ToastProvider>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/babies" element={<BabiesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </ToastProvider>
  );
}
