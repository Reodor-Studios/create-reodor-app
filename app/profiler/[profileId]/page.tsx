import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, ListTodo } from "lucide-react";
import type { Metadata } from "next";
import { companyConfig } from "@/lib/brand";

interface PageProps {
  params: Promise<{ profileId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { profileId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (!profile) {
    return {
      title: `Profile Not Found - ${companyConfig.name}`,
      description: "This profile does not exist or is no longer available.",
    };
  }

  const name = profile.full_name || "User";
  const title = `${name} - Profile`;
  const description = `View ${name}'s profile on ${companyConfig.name}.`;

  return {
    title,
    description,
    applicationName: companyConfig.name,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/profiles/${profileId}`,
      siteName: companyConfig.name,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { profileId } = await params;
  const supabase = await createClient();

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    notFound();
  }

  // Fetch todo statistics (optional, shows activity)
  const { data: todos } = await supabase
    .from("todos")
    .select("id, completed")
    .eq("user_id", profileId);

  const totalTodos = todos?.length || 0;
  const completedTodos = todos?.filter((t) => t.completed).length || 0;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  {profile.avatar_url && (
                    <AvatarImage
                      src={profile.avatar_url}
                      alt={profile.full_name || "User"}
                    />
                  )}
                  <AvatarFallback className="text-2xl">
                    {profile.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-2">
                    {profile.full_name || "Anonymous User"}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-4">
                    <Badge variant="secondary" className="capitalize">
                      {profile.role}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Member since{" "}
                        {new Date(profile.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          {totalTodos > 0 && (
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Tasks
                  </CardTitle>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTodos}</div>
                  <p className="text-xs text-muted-foreground">Tasks created</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTodos}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalTodos > 0
                      ? `${Math.round((completedTodos / totalTodos) * 100)}% completion rate`
                      : "No tasks yet"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Public profile information for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Full Name
                </h4>
                <p className="text-base">
                  {profile.full_name || "Not provided"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Role
                </h4>
                <Badge variant="outline" className="capitalize">
                  {profile.role}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Member Since
                </h4>
                <p className="text-base">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
