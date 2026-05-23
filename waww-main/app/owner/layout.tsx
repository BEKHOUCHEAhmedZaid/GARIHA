export const metadata = {
  title: "Gariha — Parking Owner Dashboard",
  description: "Manage your parking spaces and reservations",
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="owner-wrapper" id="owner-root">
      {children}
    </div>
  );
}
