import { SignIn } from "@clerk/nextjs";
import { Shell } from "@/components/shell";

export default function SignInPage() {
  return (
    <Shell className="flex min-h-[70vh] items-center justify-center py-16">
      <SignIn />
    </Shell>
  );
}
