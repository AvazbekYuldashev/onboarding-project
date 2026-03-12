import { useMutation } from "@tanstack/react-query";
import { CheckCheck, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { confirmPasswordReset } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

interface ConfirmFormState {
  username: string;
  confirmCode: string;
  password: string;
  confirmPassword: string;
}

type ConfirmErrorKey = keyof ConfirmFormState;
type ConfirmErrors = Partial<Record<ConfirmErrorKey, string>>;

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function validateForm(form: ConfirmFormState): ConfirmErrors {
  const errors: ConfirmErrors = {};

  if (!form.username.trim()) {
    errors.username = "Username is required.";
  }
  if (!form.confirmCode.trim()) {
    errors.confirmCode = "Confirmation code is required.";
  }
  if (!isStrongPassword(form.password)) {
    errors.password =
      "Password must have at least 8 characters, uppercase, lowercase, and a number.";
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function ResetPasswordConfirmForm() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const pendingRegistrationUsername = useAuthStore((state) => state.pendingRegistrationUsername);
  const [form, setForm] = useState<ConfirmFormState>({
    username: pendingRegistrationUsername ?? "",
    confirmCode: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ConfirmErrors>({});
  const [resultMessage, setResultMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const mutation = useMutation({
    mutationFn: (state: ConfirmFormState) =>
      confirmPasswordReset({
        username: state.username.trim(),
        confirmCode: state.confirmCode.trim(),
        password: state.password,
      }),
    onSuccess: (response) => {
      setResultMessage(response.message);
      setError("");
      setForm((previous) => ({
        ...previous,
        confirmCode: "",
        password: "",
        confirmPassword: "",
      }));
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error ? mutationError.message : tr("Reset password confirmation failed.", "Parolni tiklashni tasdiqlash amalga oshmadi.", "Подтверждение сброса пароля не выполнено."),
      );
    },
  });

  const hasValidationErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const setField = <K extends ConfirmErrorKey>(key: K, value: ConfirmFormState[K]) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    if (nextErrors.username) nextErrors.username = tr("Username is required.", "Username majburiy.", "Username обязателен.");
    if (nextErrors.confirmCode) nextErrors.confirmCode = tr("Confirmation code is required.", "Tasdiqlash kodi majburiy.", "Код подтверждения обязателен.");
    if (nextErrors.password) nextErrors.password = tr("Password must have at least 8 characters, uppercase, lowercase, and a number.", "Parol kamida 8 ta belgi, katta va kichik harf hamda raqamdan iborat bo'lishi kerak.", "Пароль должен содержать минимум 8 символов, верхний и нижний регистр, и цифру.");
    if (nextErrors.confirmPassword) nextErrors.confirmPassword = tr("Passwords do not match.", "Parollar mos emas.", "Пароли не совпадают.");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{tr("Reset password confirm", "Parolni tiklashni tasdiqlash", "Подтверждение сброса пароля")}</CardTitle>
        <CardDescription>
          {tr(
            "Confirm reset with the code you received.",
            "Olingan kod bilan tiklashni tasdiqlang.",
            "Подтвердите сброс полученным кодом.",
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
            <Label htmlFor="confirm-username">{tr("Username", "Username", "Username")}</Label>
            <Input
              id="confirm-username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={(event) => setField("username", event.target.value)}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "confirm-username-error" : undefined}
            />
            {errors.username ? (
              <p id="confirm-username-error" className="text-xs text-danger">
                {errors.username}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-code">{tr("Confirmation code", "Tasdiqlash kodi", "Код подтверждения")}</Label>
            <Input
              id="confirm-code"
              name="confirmCode"
              value={form.confirmCode}
              onChange={(event) => setField("confirmCode", event.target.value)}
              aria-invalid={Boolean(errors.confirmCode)}
              aria-describedby={errors.confirmCode ? "confirm-code-error" : undefined}
            />
            {errors.confirmCode ? (
              <p id="confirm-code-error" className="text-xs text-danger">
                {errors.confirmCode}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{tr("New password", "Yangi parol", "Новый пароль")}</Label>
              <Input
                id="confirm-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setField("password", event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "confirm-password-error" : undefined}
              />
              {errors.password ? (
                <p id="confirm-password-error" className="text-xs text-danger">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password-again">{tr("Confirm new password", "Yangi parolni tasdiqlang", "Подтвердите новый пароль")}</Label>
              <Input
                id="confirm-password-again"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => setField("confirmPassword", event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirm-password-again-error" : undefined}
              />
              {errors.confirmPassword ? (
                <p id="confirm-password-again-error" className="text-xs text-danger">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Confirming...", "Tasdiqlanmoqda...", "Подтверждение...")}
              </>
            ) : (
              <>
                <CheckCheck className="size-4" aria-hidden />
                {tr("Confirm reset", "Tiklashni tasdiqlash", "Подтвердить сброс")}
              </>
            )}
          </Button>
        </form>

        {hasValidationErrors ? (
          <p className="text-xs text-muted-foreground">
            {tr("Please fix validation errors before submitting.", "Yuborishdan oldin validatsiya xatolarini to'g'rilang.", "Перед отправкой исправьте ошибки валидации.")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
