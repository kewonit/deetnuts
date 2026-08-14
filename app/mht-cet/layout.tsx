import AdmissionsFocusTracker from "@/components/admissions/AdmissionsFocusTracker";

export default function MhtCetLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <>
      <AdmissionsFocusTracker />
      {children}
      {detail}
    </>
  );
}
