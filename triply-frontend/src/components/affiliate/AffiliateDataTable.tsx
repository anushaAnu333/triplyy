'use client';

import type { ReactNode } from 'react';

/**
 * Shared table shell for affiliate partner list views (bookings, commissions, sign-ups).
 * Keeps spacing and hover states aligned across /affiliate/* pages.
 */
export function AffiliateTableScroll({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function AffiliateTable({ children }: { children: ReactNode }) {
  return <table className="w-full">{children}</table>;
}

export function AffiliateTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-muted/50">
      <tr>{children}</tr>
    </thead>
  );
}

export function AffiliateTableTh({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <th className={`text-left p-4 font-medium ${className}`}>{children}</th>;
}

export function AffiliateTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function AffiliateTableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-border hover:bg-muted/30">{children}</tr>;
}

export function AffiliateTableCell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`p-4 ${className}`}>{children}</td>;
}
