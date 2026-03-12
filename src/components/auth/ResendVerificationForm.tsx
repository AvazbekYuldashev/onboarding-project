import { useMutation } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { resendRegistrationVerification } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

interface ResendFormState {
  username: string;
}

export function ResendVerificationForm() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const pendingRegistrationUsername = useAuthStore((state) => state.pendingRegistrationUsername);
  const [form, setForm] = useState<ResendFormState>({
    username: pendingRegistrationUsername ?? "",
  });
  const [resultMessage, setResultMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const mutation = useMutation({
    mutationFn: (state: ResendFormState) =>
      resendRegistrationVerification({
        username: state.username.trim(),
      }),
    onSuccess: (response) => {
      setResultMessage(response.message);
      setError("");
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error ? mutationError.message : tr("Verification resend request failed.", "Tasdiqlashni qayta yuborish so'rovi amalga oshmadi.", "Запрос повторной отправки подтверждения не выполнен."),
      );
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
        <CardTitle className="text-xl">{tr("Resend verification", "Tasdiqlashni qayta yuborish", "Повторная отправка подтверждения")}</CardTitle>
        <CardDescription>
          {tr(
            "Request a new verification code for your account.",
            "Akkauntingiz uchun yangi tasdiqlash kodini so'rang.",
            "Запросите новый код подтверждения для аккаунта.",
          )}
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
            <Label htmlFor="resend-username">{tr("Username", "Username", "Username")}</Label>
            <Input
              id="resend-username"
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
                {tr("Sending...", "Yuborilmoqda...", "Отправка...")}
              </>
            ) : (
              <>
                <MailCheck className="size-4" aria-hidden />
                {tr("Resend email verification", "Email tasdiqlashni qayta yuborish", "Повторно отправить подтверждение email")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
