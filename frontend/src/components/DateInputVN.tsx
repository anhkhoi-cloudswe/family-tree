import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputVNProps {
  value?: string | null; // Value stored in format YYYY-MM-DD or DD/MM/YYYY
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Custom Date Input displaying always in DD/MM/YYYY format,
 * with native calendar picker integration.
 */
export const DateInputVN: React.FC<DateInputVNProps> = ({
  value,
  onChange,
  className = 'form-input-clean',
  placeholder = 'DD/MM/YYYY',
  disabled = false,
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Convert incoming value (YYYY-MM-DD or DD/MM/YYYY) to display string DD/MM/YYYY
  const getDisplayValue = (val?: string | null): string => {
    if (!val) return '';
    // If already DD/MM/YYYY
    const dmy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
    }
    // If YYYY-MM-DD
    const ymd = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      return `${ymd[3].padStart(2, '0')}/${ymd[2].padStart(2, '0')}/${ymd[1]}`;
    }
    return val;
  };

  // Convert incoming value to YYYY-MM-DD for native <input type="date">
  const getIsoDateValue = (val?: string | null): string => {
    if (!val) return '';
    const ymd = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    }
    const dmy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return '';
  };

  const displayVal = getDisplayValue(value);
  const isoVal = getIsoDateValue(value);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow typing numbers and slashes
    const cleaned = raw.replace(/[^\d/]/g, '');

    // Auto format slash insertion while typing numbers
    let formatted = cleaned;
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    // Check if full DD/MM/YYYY entered
    const fullMatch = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (fullMatch) {
      const d = fullMatch[1];
      const m = fullMatch[2];
      const y = fullMatch[3];
      onChange(`${y}-${m}-${d}`);
    } else if (formatted === '') {
      onChange('');
    } else {
      // Store current typed format so user can continue typing
      onChange(formatted);
    }
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // YYYY-MM-DD
    onChange(isoDate);
  };

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      if (hiddenDateInputRef.current) {
        if ('showPicker' in HTMLInputElement.prototype) {
          hiddenDateInputRef.current.showPicker();
        } else {
          hiddenDateInputRef.current.focus();
        }
      }
    } catch {
      hiddenDateInputRef.current?.focus();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        className={className}
        style={{ paddingRight: '2.4rem' }}
        placeholder={placeholder}
        value={displayVal}
        onChange={handleTextChange}
        disabled={disabled}
      />

      {/* Button with Calendar icon to open datepicker */}
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled}
        title="Chọn ngày từ lịch"
        style={{
          position: 'absolute',
          right: '8px',
          background: 'transparent',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          transition: 'color 0.15s ease',
        }}
      >
        <Calendar size={18} />
      </button>

      {/* Hidden native date input to trigger browser date picker */}
      <input
        ref={hiddenDateInputRef}
        type="date"
        value={isoVal}
        onChange={handleNativePickerChange}
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          bottom: 0,
          right: 0,
          width: '1px',
          height: '1px',
        }}
      />
    </div>
  );
};
