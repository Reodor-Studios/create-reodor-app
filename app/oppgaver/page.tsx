import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TodosPageContent } from "@/components/todos/todos-page-content";

export default async function OppgaverPage() {
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/logg-inn");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TodosPageContent userId={user.id} />
    </div>
  );
}
