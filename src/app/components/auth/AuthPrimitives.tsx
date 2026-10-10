import imgBrandLogo from "figma:asset/97e074a98bd267b7e793590cf7916ed3199aac5e.webp";
import type { ReactNode } from "react";
import { Button } from "../ui/button";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <span className="size-[34px] shrink-0 rounded-full bg-[#ff164c] p-[1.36px]">
        <img src={imgBrandLogo} alt="" className="size-full rounded-full object-cover mix-blend-plus-lighter" />
      </span>
      <span className="bg-gradient-to-b from-white to-[#999] bg-clip-text text-[20px] font-bold leading-[1.7] tracking-[-1.4px] whitespace-nowrap text-transparent">
        Mars sound ai
      </span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4" />
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853" />
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9581H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4522 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05" />
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9581L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335" />
    </svg>
  );
}

export function GoogleSignInButton({ label, isPending, onClick }: { label: string; isPending: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="flex h-14 w-full items-center justify-center gap-3 border border-[#5e5e5e] bg-[#24191b] text-[16px] font-semibold leading-[1.5] text-[#f8f8f8] transition-colors hover:bg-[#2c1e20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 disabled:cursor-wait disabled:opacity-60"
    >
      <GoogleIcon />
      {isPending ? "Conectando..." : label}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="flex w-full items-center gap-6" role="separator">
      <span className="h-px flex-1 bg-[#766c6e]" />
      <span className="text-[12px] leading-[1.25] whitespace-nowrap text-[#bababa]">Ou continue com</span>
      <span className="h-px flex-1 bg-[#766c6e]" />
    </div>
  );
}

export function SubmitButton({ isPending, pendingLabel, children }: { isPending: boolean; pendingLabel: string; children: ReactNode }) {
  return (
    <Button type="submit" variant="primary" disabled={isPending} aria-busy={isPending} className="h-14 w-full text-[16px]">
      {isPending ? pendingLabel : children}
    </Button>
  );
}

export function InlineLinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] leading-[1.25] text-[#ff164c] hover:underline focus-visible:underline focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

export function FooterPrompt({ text, linkText, onClick }: { text: string; linkText: string; onClick: () => void }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-1 text-[12px] leading-[1.25] text-[#bababa]">
      {text}
      <InlineLinkButton onClick={onClick}>{linkText}</InlineLinkButton>
    </p>
  );
}
