export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout already provides Header, main, and Footer — only wrap with user-specific styling
  // Header is `fixed` with height `h-20`, so we need top padding to avoid overlap.
  return <div className="pt-20">{children}</div>;
}

