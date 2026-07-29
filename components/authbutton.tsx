import { getCurrentUser } from "@/lib/auth";
import { LoginLink } from "@/components/login-link";
import { AccountMenu } from "@/components/account-menu";

export default async function AuthButton() {
  const user = await getCurrentUser();

  return user ? (
    <AccountMenu
      name={user.name || user.email}
      avatarUrl={user.avatar || "/avatar.webp"}
    />
  ) : (
    <LoginLink
      className="py-2 px-3 flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover"
    />
  );
}
