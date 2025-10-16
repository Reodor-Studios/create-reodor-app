import { AdminSidebar } from "../admin-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-[calc(100vh-2rem)] pt-2">
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AdminSidebar className="w-64 bg-background sticky self-start" />
        </div>

        {/* Main content area */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
