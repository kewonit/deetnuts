export default function LoginRequiredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No authentication required for this page
  return <>{children}</>;
}
