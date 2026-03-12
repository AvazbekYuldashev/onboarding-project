import { useMutation } from "@tanstack/react-query";
import { CheckCheck, KeyRound, Loader2, MailCheck, ShieldCheck, ShieldX } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { verifyRegistrationCode } from "@/api/authApi";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

interface VerificationFormState {
  code: string;
}

type VerificationErrorKey = keyof VerificationFormState;
type VerificationErrors = Partial<Record<VerificationErrorKey, string>>;

function validateForm(form: VerificationFormState): VerificationErrors {
  const errors: VerificationErrors = {};

  if (!form.code.trim()) {
    errors.code = "Verification code is required.";
  }

  return errors;
}

export function EmailVerificationPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const pendingRegistrationUsername = useAuthStore((state) => state.pendingRegistrationUsername);
  const setPendingRegistrationUsername = useAuthStore(
    (state) => state.setPendingRegistrationUsername,
  );
  const [form, setForm] = useState<VerificationFormState>({ code: "" });
  const [errors, setErrors] = useState<VerificationErrors>({});
  const [resultMessage, setResultMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const mutation = useMutation({
    mutationFn: (state: VerificationFormState) => {
      if (!pendingRegistrationUsername) {
        return Promise.reject(new Error("Username is missing. Please register again."));
      }
      return verifyRegistrationCode(pendingRegistrationUsername.trim(), state.code.trim());
    },
    onSuccess: (response) => {
      setResultMessage(response.message);
      setError("");
      setForm({ code: "" });
      setPendingRegistrationUsername(null);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : tr(
              "Verification failed.",
              "Tasdiqlash amalga oshmadi.",
              "Подтверждение не выполнено.",
            ),
      );
    },
  });

  const hasValidationErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const setField = <K extends VerificationErrorKey>(key: K, value: VerificationFormState[K]) => {
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
    if (nextErrors.code)
      nextErrors.code = tr(
        "Verification code is required.",
        "Tasdiqlash kodi majburiy.",
        "Код подтверждения обязателен.",
      );
    if (!pendingRegistrationUsername) {
      setError(
        tr(
          "Username is missing. Please register again.",
          "Username topilmadi. Qaytadan ro'yxatdan o'ting.",
          "Username отсутствует. Зарегистрируйтесь заново.",
        ),
      );
      return;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    mutation.mutate(form);
  };

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr(
        "Verify registration",
        "Ro'yxatdan o'tishni tasdiqlang",
        "Подтвердите регистрацию",
      )}
      description={tr(
        "Confirm registration with a verification code received from backend.",
        "Backenddan kelgan tasdiqlash kodi bilan ro'yxatdan o'tishni tasdiqlang.",
        "Подтвердите регистрацию кодом подтверждения от backend.",
      )}
      nextStep={tr("login to dashboard", "dashboardga kirish", "войти в дашборд")}
      points={[
        {
          icon: MailCheck,
          title: tr("Code verification", "Kod orqali tasdiqlash", "Подтверждение по коду"),
          description: tr(
            "Use the code sent to your email/username.",
            "Email/usernamega yuborilgan kodni kiriting.",
            "Введите код, отправленный на email/username.",
          ),
        },
        {
          icon: ShieldCheck,
          title: tr("Secure flow", "Xavfsiz oqim", "Безопасный процесс"),
          description: tr(
            "Verification is required before login.",
            "Kirishdan oldin tasdiqlash talab qilinadi.",
            "Перед входом требуется подтверждение.",
          ),
        },
        {
          icon: KeyRound,
          title: tr("Language aware", "Tilga mos", "С учётом языка"),
          description: tr(
            "Language is controlled globally from the header toggle.",
            "Til header dagi global toggle orqali boshqariladi.",
            "Язык управляется глобальным переключателем в header.",
          ),
        },
      ]}
    >
      <Card className="border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">
            {tr(
              "Registration verification",
              "Ro'yxatdan o'tishni tasdiqlash",
              "Подтверждение регистрации",
            )}
          </CardTitle>
          <CardDescription>
            {tr(
              "Enter the code we sent to verify your account.",
              "Akkauntingizni tasdiqlash uchun yuborilgan kodni kiriting.",
              "Введите код, который мы отправили для подтверждения аккаунта.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {pendingRegistrationUsername ? (
            <div className="rounded-md border border-accent bg-accent/30 px-3 py-2 text-sm text-accent-foreground">
              {tr(
                "Verifying username:",
                "Username tasdiqlanmoqda:",
                "Подтверждается username:",
              )}{" "}
              {pendingRegistrationUsername}
            </div>
          ) : null}

          {resultMessage ? (
            <div className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
              <MailCheck className="mt-0.5 size-4" aria-hidden />
              <span>{resultMessage}</span>
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <ShieldX className="mt-0.5 size-4" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="verification-code">
                {tr("Verification code", "Tasdiqlash kodi", "Код подтверждения")}
              </Label>
              <Input
                id="verification-code"
                name="code"
                value={form.code}
                onChange={(event) => setField("code", event.target.value)}
                aria-invalid={Boolean(errors.code)}
                aria-describedby={errors.code ? "verification-code-error" : undefined}
              />
              {errors.code ? (
                <p id="verification-code-error" className="text-xs text-danger">
                  {errors.code}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {tr("Verifying...", "Tasdiqlanmoqda...", "Подтверждение...")}
                  </>
                ) : (
                  <>
                    <CheckCheck className="size-4" aria-hidden />
                    {tr(
                      "Verify registration",
                      "Ro'yxatdan o'tishni tasdiqlash",
                      "Подтвердить регистрацию",
                    )}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  setForm({ code: "" });
                  setErrors({});
                  setError("");
                  setResultMessage("");
                  mutation.reset();
                }}
              >
                {tr("Clear", "Tozalash", "Очистить")}
              </Button>
            </div>
          </form>

          {hasValidationErrors ? (
            <p className="text-xs text-muted-foreground">
              {tr(
                "Please fix validation errors before submitting.",
                "Yuborishdan oldin validatsiya xatolarini to'g'rilang.",
                "Перед отправкой исправьте ошибки валидации.",
              )}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants({ variant: "outline" })} to="/auth/verification/resend">
              {tr(
                "Resend verification",
                "Tasdiqlashni qayta yuborish",
                "Повторно отправить подтверждение",
              )}
            </Link>
            <Link className={buttonVariants()} to="/auth/login">
              {tr("Go to login", "Kirishga o'tish", "Перейти ко входу")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
