import type { AnchorHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { buttonStyle, type ButtonSize, type ButtonVariant } from "./Button.js";

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Exclude<ButtonVariant, "destructive">;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * A link that looks exactly like a `Button`. Use it when the control goes
 * somewhere (a page, a download); use `Button` when it does something. It
 * is a real `<a>`, so it keeps link semantics, middle-click and
 * open-in-new-tab — and it avoids the invalid, hard-to-use pattern of a
 * `<button>` nested inside an `<a>`.
 *
 * `destructive` is deliberately not offered: a destructive action should
 * never be a plain navigation.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = "secondary", size = "md", style, children, ...rest },
  ref,
) {
  return (
    <a ref={ref} style={{ ...buttonStyle(variant, size), ...style }} {...rest}>
      {children}
    </a>
  );
});
