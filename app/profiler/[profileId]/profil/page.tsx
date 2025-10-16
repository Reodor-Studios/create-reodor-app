import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { ProfileLayout } from "@/components/profile-layout";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !profile) {
    redirect("/auth/login");
  }

  // Check if user is authenticated and owns this profile
  const isOwner = user && user.id === profileId ? true : false;

  // Non-owners shouldn't be able to access this subpage
  if (!isOwner) {
    redirect(`/profiler/${profileId}`);
  }

  return (
    <ProfileLayout profileId={profileId} userRole={profile.role}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-12">
        <div className="max-w-2xl mx-auto w-full">
          <ProfileForm profile={profile} isOwner={isOwner} />
        </div>
      </div>
    </ProfileLayout>
  );
}
