import { ProfileSidebar } from "./profile-sidebar";

interface ProfileLayoutProps {
  profileId: string;
  userRole?: string;
  children: React.ReactNode;
}

export const ProfileLayout = ({
  profileId,
  userRole,
  children,
}: ProfileLayoutProps) => {
  return (
    <div className="min-h-[calc(100vh-2rem)] pt-2">
      <div className="flex">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <ProfileSidebar
            profileId={profileId}
            userRole={userRole}
            className="w-64 bg-background sticky self-start"
          />
        </div>

        {/* Main content area */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};
