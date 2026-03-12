import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { RegistrationRequest } from "@/types/auth";

interface RegisterFormState {
  name: string;
  surname: string;
  username: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

type RegisterFormErrorKey = keyof RegisterFormState;
type RegisterFormErrors = Partial<Record<RegisterFormErrorKey, string>>;

const DEFAULT_FORM: RegisterFormState = {
  name: "",
  surname: "",
  username: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
};

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

function validateForm(form: RegisterFormState): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }
  if (form.surname.trim().length < 2) {
    errors.surname = "Surname must be at least 2 characters.";
  }
  if (form.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters.";
  }
  if (!isStrongPassword(form.password)) {
    errors.password =
      "Password must have at least 8 characters, uppercase, lowercase, and a number.";
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!form.termsAccepted) {
    errors.termsAccepted = "You need to accept terms and privacy policy.";
  }

  return errors;
}

function toPayload(form: RegisterFormState): RegistrationRequest {
  return {
    name: form.name.trim(),
    surname: form.surname.trim(),
    username: form.username.trim(),
    password: form.password,
  };
}

export function RegisterForm() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const [form, setForm] = useState<RegisterFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const pendingRegistrationUsername = useAuthStore((state) => state.pendingRegistrationUsername);
  const setPendingRegistrationUsername = useAuthStore(
    (state) => state.setPendingRegistrationUsername,
  );
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (currentForm: RegisterFormState) => registerUser(toPayload(currentForm)),
    onSuccess: (_result, submittedForm) => {
      setPendingRegistrationUsername(submittedForm.username.trim());
      setForm((previous) => ({
        ...previous,
        password: "",
        confirmPassword: "",
      }));
      navigate("/auth/verification");
    },
  });

  const mutationError = mutation.error instanceof Error ? mutation.error.message : "";
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const handleInputChange = <K extends RegisterFormErrorKey>(
    key: K,
    value: RegisterFormState[K],
  ) => {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateForm(form);
    if (nextErrors.name) nextErrors.name = tr("Name must be at least 2 characters.", "Ism kamida 2 ta belgidan iborat bo'lishi kerak.", "Имя должно быть не менее 2 символов.");
    if (nextErrors.surname) nextErrors.surname = tr("Surname must be at least 2 characters.", "Familiya kamida 2 ta belgidan iborat bo'lishi kerak.", "Фамилия должна быть не менее 2 символов.");
    if (nextErrors.username) nextErrors.username = tr("Username must be at least 3 characters.", "Username kamida 3 ta belgidan iborat bo'lishi kerak.", "Username должен быть не менее 3 символов.");
    if (nextErrors.password) nextErrors.password = tr("Password must have at least 8 characters, uppercase, lowercase, and a number.", "Parol kamida 8 ta belgi, katta va kichik harf hamda raqamdan iborat bo'lishi kerak.", "Пароль должен содержать минимум 8 символов, верхний и нижний регистр, и цифру.");
    if (nextErrors.confirmPassword) nextErrors.confirmPassword = tr("Passwords do not match.", "Parollar mos emas.", "Пароли не совпадают.");
    if (nextErrors.termsAccepted) nextErrors.termsAccepted = tr("You need to accept terms and privacy policy.", "Foydalanish shartlari va maxfiylik siyosatini qabul qilishingiz kerak.", "Нужно принять условия и политику конфиденциальности.");
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate(form);
  };

  return (
    <Card className="border-border/80 bg-card/95 shadow-lg backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{tr("Create account", "Akkaunt yaratish", "Создать аккаунт")}</CardTitle>
        <CardDescription>
          {tr(
            "Create your account to continue.",
            "Davom etish uchun akkaunt yarating.",
            "Создайте аккаунт, чтобы продолжить.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {pendingRegistrationUsername ? (
          <div className="rounded-md border border-accent bg-accent/30 px-3 py-2 text-sm text-accent-foreground">
            {tr("Pending verification for username:", "Username uchun tasdiqlash kutilmoqda:", "Ожидается подтверждение для username:")} {pendingRegistrationUsername}
          </div>
        ) : null}

        {mutation.isSuccess ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
          >
            <ShieldCheck className="mt-0.5 size-4" aria-hidden />
            <span>{mutation.data.message}</span>
          </div>
        ) : null}

        {mutation.isError ? (
          <div
            role="alert"
            className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {mutationError}
          </div>
        ) : null}

        <form noValidate className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{tr("Name", "Ism", "Имя")}</Label>
              <Input
                id="name"
                name="name"
                autoComplete="given-name"
                value={form.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name ? (
                <p id="name-error" className="text-xs text-danger">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname">{tr("Surname", "Familiya", "Фамилия")}</Label>
              <Input
                id="surname"
                name="surname"
                autoComplete="family-name"
                value={form.surname}
                onChange={(event) => handleInputChange("surname", event.target.value)}
                aria-invalid={Boolean(errors.surname)}
                aria-describedby={errors.surname ? "surname-error" : undefined}
              />
              {errors.surname ? (
                <p id="surname-error" className="text-xs text-danger">
                  {errors.surname}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{tr("Username", "Username", "Username")}</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder={tr("username or email", "username yoki email", "username или email")}
              value={form.username}
              onChange={(event) => handleInputChange("username", event.target.value)}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username ? (
              <p id="username-error" className="text-xs text-danger">
                {errors.username}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">{tr("Password", "Parol", "Пароль")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => handleInputChange("password", event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password ? (
                <p id="password-error" className="text-xs text-danger">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{tr("Confirm password", "Parolni tasdiqlang", "Подтвердите пароль")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => handleInputChange("confirmPassword", event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword ? (
                <p id="confirmPassword-error" className="text-xs text-danger">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm" htmlFor="termsAccepted">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) => handleInputChange("termsAccepted", event.target.checked)}
                className="mt-0.5 size-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-invalid={Boolean(errors.termsAccepted)}
                aria-describedby={errors.termsAccepted ? "termsAccepted-error" : undefined}
              />
              <span>{tr("I agree to the Terms of Service and Privacy Policy.", "Men Foydalanish shartlari va Maxfiylik siyosatiga roziman.", "Я согласен с Условиями использования и Политикой конфиденциальности.")}</span>
            </label>
            {errors.termsAccepted ? (
              <p id="termsAccepted-error" className="text-xs text-danger">
                {errors.termsAccepted}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {tr("Creating account...", "Akkaunt yaratilmoqda...", "Создание аккаунта...")}
                </>
              ) : (
                tr("Create account", "Akkaunt yaratish", "Создать аккаунт")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                setForm(DEFAULT_FORM);
                setErrors({});
                mutation.reset();
                setPendingRegistrationUsername(null);
              }}
            >
              {tr("Clear", "Tozalash", "Очистить")}
            </Button>
          </div>
        </form>

        {hasErrors ? (
          <p className="text-xs text-muted-foreground">
            {tr("Please fix highlighted fields before submitting the form.", "Formani yuborishdan oldin belgilangan maydonlarni to'g'rilang.", "Перед отправкой формы исправьте выделенные поля.")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
