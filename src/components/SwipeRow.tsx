import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react';

type Props = {
  /** Width in px to reveal when fully open. */
  actionsWidth?: number;
  /** Rendered behind the row, revealed by swiping left. */
  actions: ReactNode;
  /** The visible row content. */
  children: ReactNode;
  className?: string;
};

/**
 * Touch/pointer driven swipe-to-reveal row. Only "swipe left" is supported;
 * a click anywhere on the surface (or scrolling) closes it.
 */
export function SwipeRow({ actionsWidth = 132, actions, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const decidedRef = useRef<'h' | 'v' | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close when another row in the document opens, or on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onDocPointerDown, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only react to touch / pen drags. Mouse users can use the buttons directly when revealed.
    if (e.pointerType === 'mouse') return;
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    decidedRef.current = null;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (decidedRef.current == null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      decidedRef.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (decidedRef.current === 'h') {
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    }
    if (decidedRef.current !== 'h') return;
    e.preventDefault();
    const base = open ? -actionsWidth : 0;
    const next = Math.max(-actionsWidth, Math.min(0, base + dx));
    setDragX(next);
  };

  const finishDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    startRef.current = null;
    const wasHorizontal = decidedRef.current === 'h';
    decidedRef.current = null;
    if (!start || !wasHorizontal) {
      setDragX(null);
      return;
    }
    const dx = e.clientX - start.x;
    const wasOpen = open;
    setDragX(null);
    if (!wasOpen && dx < -actionsWidth / 3) setOpen(true);
    else if (wasOpen && dx > actionsWidth / 3) setOpen(false);
  };

  const translate = dragX != null ? dragX : open ? -actionsWidth : 0;
  const isAnimating = dragX == null;

  return (
    <div
      ref={rootRef}
      className={`swipe-row${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="swipe-row-actions" style={{ width: actionsWidth }} aria-hidden={!open}>
        {actions}
      </div>
      <div
        className="swipe-row-surface"
        style={{
          transform: `translateX(${translate}px)`,
          transition: isAnimating ? 'transform 180ms ease' : 'none'
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        {children}
      </div>
    </div>
  );
}
