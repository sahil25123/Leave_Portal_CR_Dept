import { useId, useState } from "react";

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.7 6a9.5 9.5 0 0 1 1.3-.1c5.9 0 9.5 6.5 9.5 6.5a19.5 19.5 0 0 1-3.4 4.1" />
      <path d="M6.2 8.3A19.8 19.8 0 0 0 2.5 12s3.6 6.5 9.5 6.5c.9 0 1.8-.2 2.6-.5" />
      <path d="M9.9 9.8a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  helperText,
  errorText,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isVisible, setIsVisible] = useState(false);

  const message = errorText || helperText;
  const hasError = Boolean(errorText);

  return (
    <div>
      {label ? (
        <label
          className="mb-1 block text-sm font-medium text-slate-700"
          htmlFor={inputId}
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={
            "w-full rounded-md border px-3 py-2 pr-24 text-sm outline-none " +
            (hasError
              ? "border-red-300 focus:border-red-500"
              : "border-slate-300 focus:border-slate-900")
          }
        />

        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>

      {message ? (
        <p
          className={
            "mt-1 text-xs " + (hasError ? "text-red-600" : "text-slate-500")
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default PasswordField;
