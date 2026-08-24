import AccountForm from "./account-form";
import { getAuthenticatedPocketBase } from "@/lib/pocketbase/auth";
import { redirect } from "next/navigation";

type AccountPageProps = {
  searchParams: Promise<{
    message?: string | string[];
  }>;
};

export default async function Account({ searchParams }: AccountPageProps) {
  const auth = await getAuthenticatedPocketBase();

  const params = await searchParams;

  if (!auth) {
    redirect("/login?redirect=/account");
  }
  const { user } = auth;

  const accountFormUser = {
    id: user.id,
    email: user.email,
    name: user.full_name || "",
    verified: user.verified,
    created: user.created || "",
    updated: user.updated || "",
  };

  return (
    <AccountForm
      user={accountFormUser}
      message={typeof params?.message === "string" ? params.message : undefined}
    />
  );
}
