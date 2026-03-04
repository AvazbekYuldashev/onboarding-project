import { MailCheck, MailQuestion, Send } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { useI18n } from "@/features/i18n/messages";

export function VerificationResendPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr("Resend registration verification", "Ro'yxatdan o'tish tasdiqini qayta yuborish", "Повторная отправка подтверждения регистрации")}
      description={tr(
        "Use username to request a new registration verification email from backend.",
        "Username orqali backenddan yangi ro'yxatdan o'tish tasdiq emailini so'rang.",
        "Используйте username, чтобы запросить новое email-подтверждение регистрации с backend.",
      )}
      nextStep={tr("open verification link", "tasdiqlash havolasini ochish", "открыть ссылку подтверждения")}
      points={[
        {
          icon: MailQuestion,
          title: tr("EmailResendDTO compatible", "EmailResendDTO mos", "Совместимо с EmailResendDTO"),
          description: tr(
            "Payload field is exactly: username.",
            "Payload maydoni aniq: username.",
            "Поле payload строго: username.",
          ),
        },
        {
          icon: Send,
          title: tr("Controller mapped", "Controller ulanishi tayyor", "Controller подключен"),
          description: tr(
            "Uses POST /api/v1/auth/registration/email-verification-resend.",
            "POST /api/v1/auth/registration/email-verification-resend dan foydalanadi.",
            "Использует POST /api/v1/auth/registration/email-verification-resend.",
          ),
        },
        {
          icon: MailCheck,
          title: tr("Registration continuity", "Registratsiya davomiyligi", "Непрерывность регистрации"),
          description: tr(
            "Works with pending registration username saved after sign-up.",
            "Sign-updan keyin saqlangan pending username bilan ishlaydi.",
            "Работает с pending username, сохраненным после sign-up.",
          ),
        },
      ]}
    >
      <ResendVerificationForm />
    </AuthShell>
  );
}
