import AccountForm from "./account-form";
import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";

type AccountPageProps = {
  searchParams: Promise<{
    message?: string | string[];
  }>;
};

export default async function Account({ searchParams }: AccountPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;

  if (!user) {
    redirect("/login?redirect=/account");
  }

  const accountFormUser = {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || "",
    verified: !!user.email_confirmed_at,
    created: user.created_at || "",
    updated: user.updated_at || "",
  };

  return (
    <AccountForm
      user={accountFormUser}
      message={typeof params?.message === "string" ? params.message : undefined}
    />
  );
}
