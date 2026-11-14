import "./admin.css";

export const metadata = {
  title: "Gariha — Super Admin Platform",
  description: "Real-time global control center",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-wrapper" id="admin-root">
      {children}
    </div>
  );
}
