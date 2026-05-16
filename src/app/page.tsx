import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if profile exists and onboarding is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, create one and go to onboarding
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      username: user.email,
    });
    redirect("/onboarding");
  }

  if (!profile.onboarding_complete) {
    redirect("/onboarding");
  }

  redirect("/scroll-map");
}