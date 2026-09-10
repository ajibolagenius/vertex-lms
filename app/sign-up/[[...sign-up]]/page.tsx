import { SignUp } from "@clerk/nextjs";
import { Shell } from "@/components/shell";

export default function SignUpPage() {
  return (
    <Shell className="flex min-h-[70vh] items-center justify-center py-16">
      <SignUp />
    </Shell>
  );
}
