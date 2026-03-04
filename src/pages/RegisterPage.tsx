import { KeyRound, MailCheck, UserRoundPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useI18n } from "@/features/i18n/messages";

export function RegisterPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr("Start with account registration", "Akkaunt ro'yxatdan o'tkazishdan boshlang", "Начните с регистрации аккаунта")}
      description={tr(
        "Frontend is aligned with your backend AuthController contract for registration and verification flow.",
        "Frontend registration va verification oqimi bo'yicha backend AuthController contractiga moslangan.",
        "Frontend согласован с backend AuthController для flow регистрации и верификации.",
      )}
      nextStep={tr("email verification", "email tasdiqlash", "подтверждение email")}
      points={[
        {
          icon: UserRoundPlus,
          title: tr("Registration DTO compatible", "Registration DTO mos", "Совместимо с Registration DTO"),
          description: tr(
            "Payload fields are exactly: name, surname, username, password.",
            "Payload maydonlari aniq: name, surname, username, password.",
            "Поля payload строго: name, surname, username, password.",
          ),
        },
        {
          icon: MailCheck,
          title: tr("Verification ready", "Verification tayyor", "Верификация готова"),
          description: tr(
            "After successful registration, continue with email verification endpoints.",
            "Muvaffaqiyatli ro'yxatdan o'tgach, email verification endpointlari bilan davom eting.",
            "После успешной регистрации продолжайте через endpoints email verification.",
          ),
        },
        {
          icon: KeyRound,
          title: tr("Auth flow ready", "Auth flow tayyor", "Auth flow готов"),
          description: tr(
            "Login and reset password flows are available as separate modules.",
            "Login va reset password oqimlari alohida modullar sifatida mavjud.",
            "Login и reset password доступны как отдельные модули.",
          ),
        },
      ]}
    >
      <RegisterForm />
    </AuthShell>
  );
}
