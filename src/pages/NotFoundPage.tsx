import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/authStore";

export function NotFoundPage() {
  const session = useAuthStore((state) => state.session);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md bg-card/95 text-center">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The route you requested does not exist in this onboarding module.
          </p>
          <Link className={buttonVariants()} to={session ? "/dashboard" : "/auth/login"}>
            {session ? "Return to dashboard" : "Return to login"}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
