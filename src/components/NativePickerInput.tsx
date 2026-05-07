import { useRef } from 'react';

type NativePickerType = 'date' | 'datetime-local';

type Props = {
  type: NativePickerType;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  ariaLabel?: string;
};

export function NativePickerInput({ type, value, onChange, placeholder, required, ariaLabel }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const showOverlayPlaceholder = (() => {
    if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // iPadOS 13+ can report as Mac; touch capability identifies iPad/iPhone class devices.
    return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  })();

  return (
    <div
      className="native-picker-wrap"
      onClick={() => {
        ref.current?.focus();
        try {
          ref.current?.showPicker?.();
        } catch {
          /* ignore */
        }
      }}
    >
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-label={ariaLabel}
      />
      {showOverlayPlaceholder && !value && (
        <span className="native-picker-placeholder">{placeholder}</span>
      )}
    </div>
  );
}
