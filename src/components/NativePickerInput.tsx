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
      {!value && <span className="native-picker-placeholder">{placeholder}</span>}
    </div>
  );
}
