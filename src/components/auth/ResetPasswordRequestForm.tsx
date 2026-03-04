import { useMutation } from "@tanstack/react-query";
import { Loader2, RotateCcwKey } from "lucide-react";
import { useState } from "react";
import { requestPasswordReset } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

interface ResetRequestFormState {
  username: string;
}

export function ResetPasswordRequestForm() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const [form, setForm] = useState<ResetRequestFormState>({
    username: "",
  });
  const [resultMessage, setResultMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const setPendingRegistrationUsername = useAuthStore(
    (state) => state.setPendingRegistrationUsername,
  );

  const mutation = useMutation({
    mutationFn: (state: ResetRequestFormState) =>
      requestPasswordReset({
        username: state.username.trim(),
      }),
    onSuccess: (response, state) => {
      setPendingRegistrationUsername(state.username.trim());
      setResultMessage(response.message);
      setError("");
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : tr("Reset password request failed.", "Parolni tiklash so'rovi amalga oshmadi.", "Запрос на сброс пароля не выполнен."));
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.username.trim()) {
      setError(tr("Username is required.", "Username majburiy.", "Username обязателен."));
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{tr("Reset password request", "Parolni tiklash so'rovi", "Запрос сброса пароля")}</CardTitle>
        <CardDescription>
          {tr("Backend endpoint:", "Backend endpoint:", "Backend endpoint:")} <span className="font-medium">POST /api/v1/auth/reset-password</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {resultMessage ? (
          <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
            {resultMessage}
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
            <Label htmlFor="reset-username">{tr("Username", "Username", "Username")}</Label>
            <Input
              id="reset-username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm((previous) => ({ ...previous, username: event.target.value }))}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Sending request...", "So'rov yuborilmoqda...", "Отправка запроса...")}
              </>
            ) : (
              <>
                <RotateCcwKey className="size-4" aria-hidden />
                {tr("Send reset code", "Tiklash kodini yuborish", "Отправить код сброса")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
