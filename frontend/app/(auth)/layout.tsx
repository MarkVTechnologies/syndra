import { LineArt } from "@/components/decor/line-art";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 15% 15%, rgba(192,88,0,0.28), transparent 60%), radial-gradient(520px circle at 85% 85%, rgba(113,54,0,0.3), transparent 60%)",
        }}
      />
      <LineArt variant="blueprint-corner" position="top-left" className="text-[var(--estate-amber-300)]" />
      <LineArt variant="blueprint-corner" position="bottom-right" className="text-[var(--estate-amber-300)]" />
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0" />
      <div className="relative w-full max-w-[400px]">{children}</div>
    </div>
  );
}
