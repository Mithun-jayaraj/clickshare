import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  prefix,
  suffix,
  className = '',
  id,
  hint,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
          {required && <span style={{ color: 'var(--danger)' }} className="ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none"
            style={{ color: 'var(--text-muted)' }}
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          style={{
            background: 'var(--input-bg)',
            color: 'var(--text-primary)',
            borderColor: error ? 'var(--danger)' : 'var(--border)',
          }}
          className={`
            w-full border rounded-lg py-2.5 text-sm
            outline-none transition-all duration-150
            focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed
            ${prefix ? 'pl-10' : 'pl-3.5'}
            ${(isPassword || suffix) ? 'pr-10' : 'pr-3.5'}
          `}
          onFocus={(e) => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--primary)';
            e.target.style.boxShadow = error
              ? '0 0 0 3px rgba(239,68,68,0.12)'
              : '0 0 0 3px rgba(99,102,241,0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
            e.target.style.boxShadow = 'none';
            if (onBlur) onBlur(e);
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!isPassword && suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}>
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
