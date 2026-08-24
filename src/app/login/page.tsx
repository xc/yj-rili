import { GuestGuard } from "@/components/Guards";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginForm />
    </GuestGuard>
  );
}
