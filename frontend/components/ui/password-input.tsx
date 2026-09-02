"use client";

import { forwardRef, useState, type ElementType, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends Omit<ComponentPropsWithoutRef<typeof Input>, "type"> {
  /** Optional leading icon (e.g. Lock) — mirrors the leading-icon inputs elsewhere. */
  icon?: ElementType;
}

/**
 * Input with a trailing show/hide toggle, defaulting to masked. `flex-1` on
 * the wrapper is a no-op unless the parent is itself a flex container (the
 * integrations settings form pairs this with a sibling badge) — harmless
 * everywhere else.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ icon: Icon, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative flex-1">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
          />
        )}
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(Icon && "pl-10", "pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
