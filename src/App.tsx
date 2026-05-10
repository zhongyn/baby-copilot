import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Header } from './components/Header';
import { ToastProvider } from './components/Toast';
import { LogPage } from './pages/LogPage';
import { HistoryPage } from './pages/HistoryPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useStore } from './store';

const TAB_PATHS = ['/', '/history', '/stats', '/settings'] as const;

function currentTabIndex(pathname: string): number {
  // Match longest prefix; fall back to Log.
  let bestIdx = 0;
  let bestLen = 0;
  for (let i = 0; i < TAB_PATHS.length; i++) {
    const p = TAB_PATHS[i];
    const matches = p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/');
    if (matches && p.length >= bestLen) {
      bestIdx = i;
      bestLen = p.length;
    }
  }
  return bestIdx;
}

/** Horizontal-swipe handler that navigates between top-level tabs on touch devices. */
function useTabSwipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const startRef = useRef<{ x: number; y: number; id: number; ignored: boolean } | null>(null);
  const decidedRef = useRef<'h' | 'v' | null>(null);

  const isInteractiveTarget = (el: Element | null): boolean => {
    while (el && el !== document.body) {
      if (el instanceof HTMLElement) {
        const tag = el.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          tag === 'BUTTON' ||
          tag === 'A'
        ) {
          // Buttons / links can still receive a tap; only block long horizontal drags
          // initiated on inputs / selects (where the OS handles its own gestures).
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        }
        if (el.dataset && el.dataset.noSwipe === 'true') return true;
        // Any element that is itself horizontally scrollable (today-summary,
        // recharts surfaces, swipe-row, etc.) should own the gesture.
        const cls = el.classList;
        if (
          cls &&
          (cls.contains('swipe-row') ||
            cls.contains('today-summary') ||
            cls.contains('chart') ||
            cls.contains('app-nav') ||
            cls.contains('recharts-wrapper'))
        ) {
          return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') return;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      ignored: isInteractiveTarget(e.target as Element)
    };
    decidedRef.current = null;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || start.id !== e.pointerId || start.ignored) return;
    if (decidedRef.current === 'v') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (decidedRef.current == null) {
      if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
      decidedRef.current = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v';
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    startRef.current = null;
    const wasHorizontal = decidedRef.current === 'h';
    decidedRef.current = null;
    if (!start || start.ignored || !wasHorizontal) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const threshold = Math.max(60, window.innerWidth * 0.18);
    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;
    const idx = currentTabIndex(location.pathname);
    const next = dx < 0 ? idx + 1 : idx - 1;
    if (next < 0 || next >= TAB_PATHS.length) return;
    navigate(TAB_PATHS[next]);
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

export default function App() {
  const theme = useStore((s) => s.settings.theme);
  const swipe = useTabSwipe();

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
      <main className="app-main" {...swipe}>
        <Routes>
          <Route path="/" element={<LogPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/babies" element={<Navigate to="/settings" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </ToastProvider>
  );
}
