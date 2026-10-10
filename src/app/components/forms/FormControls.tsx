import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "../ui/utils";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  labelAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function getFieldErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

export function FormField({ id, label, error, hint, required, labelAction, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[12px] font-normal leading-[1.25] text-[#bababa]">
          {label}
          {required && (
            <span className="text-[#ff164c]" aria-hidden="true">
              {" "}*
            </span>
          )}
        </label>
        {labelAction}
      </div>
      {children}
      {error ? (
        <p id={getFieldErrorId(id)} role="alert" className="flex items-center gap-1 text-[12px] leading-[1.25] text-[#ff164c]">
          {error}
        </p>
      ) : (
        hint && <p className="text-[12px] leading-[1.25] text-[#bababa]/60">{hint}</p>
      )}
    </div>
  );
}

const CONTROL_BASE_CLASS =
  "w-full border bg-transparent px-6 py-2 text-[16px] font-semibold leading-[1.5] text-[#f8f8f8] caret-[#ff164c] outline-none transition-colors placeholder:font-normal placeholder:text-[#f8f8f8]/30 focus:border-[#ff164c] disabled:cursor-not-allowed disabled:opacity-60";

function getControlStateClass(hasError: boolean | undefined): string {
  return hasError ? "border-[#ff164c] bg-[#ff164c]/[0.04]" : "border-[#30292b] hover:border-[#ff164c]/50";
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { hasError, className, id, ...inputProps },
  ref,
) {
  return (
    <input
      ref={ref}
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError && id ? getFieldErrorId(id) : undefined}
      className={cn(CONTROL_BASE_CLASS, "min-h-[44px]", getControlStateClass(hasError), className)}
      {...inputProps}
    />
  );
});

export function PasswordInput(props: Omit<TextInputProps, "type">) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput {...props} type={isVisible ? "text" : "password"} className={cn("pr-12", props.className)} />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={isVisible}
        className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-[#a19a9b] transition-colors hover:text-[#f8f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function FormErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="border border-[#ff164c]/30 bg-[#ff164c]/[0.08] px-4 py-3 text-[13px] leading-[1.5] text-[#ff8aa5]">
      {message}
    </p>
  );
}

interface TextAreaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function TextAreaInput({ hasError, className, id, ...textareaProps }: TextAreaInputProps) {
  return (
    <textarea
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError && id ? getFieldErrorId(id) : undefined}
      className={cn(CONTROL_BASE_CLASS, "resize-none", getControlStateClass(hasError), className)}
      {...textareaProps}
    />
  );
}
