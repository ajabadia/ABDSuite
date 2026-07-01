import React from "react";

// Mock for next/link — renders a plain <a> tag
const MockLink = ({
  href,
  children,
  className,
  title,
  onClick,
  "data-testid": dataTestId,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
  "data-testid"?: string;
  [key: string]: unknown;
}) => {
  return (
    <a
      href={href}
      className={className}
      title={title}
      onClick={(e) => {
        e.preventDefault();
        console.log(`[MockLink] Navigate to: ${href}`);
        onClick?.(e);
      }}
      data-testid={dataTestId}
      {...rest}
    >
      {children}
    </a>
  );
};

export default MockLink;
