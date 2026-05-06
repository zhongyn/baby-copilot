import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';
import { LogPage } from './pages/LogPage';
import { HistoryPage } from './pages/HistoryPage';
import { StatsPage } from './pages/StatsPage';
import { BabiesPage } from './pages/BabiesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
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
