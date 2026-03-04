import { useMutation } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleDashboardPath } from "@/features/auth/roles";
import { useI18n } from "@/features/i18n/messages";

interface LoginFormState {
  username: string;
  password: string;
}

const DEFAULT_FORM: LoginFormState = {
  username: "",
  password: "",
};

export function LoginForm() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormState>(DEFAULT_FORM);
  const [error, setError] = useState<string>("");
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);

  const mutation = useMutation({
    mutationFn: (state: LoginFormState) =>
      loginUser({
        username: state.username.trim(),
        password: state.password,
      }),
    onSuccess: (profile) => {
      setSession({
        id: profile.id || profile.username,
        username: profile.username,
        departmentId: profile.departmentId,
        buildingId: profile.buildingId,
        isEmployee: profile.isEmployee,
        jwt: profile.jwt,
        role: profile.role,
      });
      setError("");
      setForm((previous) => ({
        ...previous,
        password: "",
      }));
      navigate(getRoleDashboardPath(profile.role), { replace: true });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : tr("Login failed.", "Kirish amalga oshmadi.", "Вход не выполнен."));
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError(tr("Username and password are required.", "Username va password majburiy.", "Username и password обязательны."));
      return;
    }

    mutation.mutate(form);
  };

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{tr("Login", "Kirish", "Вход")}</CardTitle>
        <CardDescription>
          {tr("Backend endpoint:", "Backend endpoint:", "Backend endpoint:")} <span className="font-medium">POST /api/v1/auth/login</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {session ? (
          <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
            {tr("Logged in as", "Tizimga kirildi:", "Вход выполнен как")} {session.username}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="login-username">{tr("Username", "Username", "Username")}</Label>
            <Input
              id="login-username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm((previous) => ({ ...previous, username: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">{tr("Password", "Parol", "Пароль")}</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {tr("Signing in...", "Kirilmoqda...", "Вход...")}
                </>
              ) : (
                <>
                  <LogIn className="size-4" aria-hidden />
                  {tr("Login", "Kirish", "Вход")}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                setForm(DEFAULT_FORM);
                setError("");
                mutation.reset();
              }}
            >
              {tr("Clear", "Tozalash", "Очистить")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
