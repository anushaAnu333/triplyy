export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout already provides Header, main, and Footer — only wrap with user-specific styling
  return <>{children}</>;
}

