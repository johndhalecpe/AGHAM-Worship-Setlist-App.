import { type ReactNode } from "react";

interface InputFieldProps {
  label: string;
  type: "email" | "password" | "text";
  placeholder: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  rightElement?: ReactNode;
  hint?: string;
  error?: string;
  clearable?: boolean;
  name?: string;
  id?: string;
  autoComplete?: string;
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 grid place-items-center min-h-[32px] min-w-[32px] rounded-lg transition-colors hover:opacity-70"
      style={{ color: "var(--color-text-tertiary)" }}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 4l-8 8M4 4l8 8" />
      </svg>
    </button>
  );
}

export default function InputField({
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
  rightElement,
  hint,
  error,
  clearable,
  name,
  id,
  autoComplete,
}: InputFieldProps) {
  return (
    <div>
      <div className="flex items-baseline gap-1 mb-1.5 px-1">
        <label className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
          {label}
        </label>
        {error ? (
          <span className="text-[10px] leading-tight ml-1" style={{ color: "var(--color-danger)" }}>
            {error}
          </span>
        ) : null}
      </div>
      <div
        className="flex items-center rounded-xl w-full px-4 lg:py-2.5 py-3.5 transition-all duration-200 focus-within:border-[var(--color-accent)] focus-within:bg-[var(--color-surface-card)] relative"
        style={{
          backgroundColor: "var(--color-surface-muted)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        {icon && (
          <span className="mr-3 flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          name={name}
          id={id}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-60"
          style={{ color: "var(--color-text)", paddingRight: rightElement ? "3rem" : undefined }}
        />
        {clearable && value.length > 0 && !rightElement && (
          <ClearButton onClick={() => onChange("")} />
        )}
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clearable && value.length > 0 && (
              <ClearButton onClick={() => onChange("")} />
            )}
            <span className="flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }}>
              {rightElement}
            </span>
          </div>
        )}
      </div>
      {hint && (
        <p className="text-[10px] leading-tight mt-1 px-1" style={{ color: "var(--color-text-tertiary)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
