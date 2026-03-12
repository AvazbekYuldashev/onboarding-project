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
      title={tr(
        "Resend verification code",
        "Tasdiqlash kodini qayta yuborish",
        "Повторная отправка кода",
      )}
      description={tr(
        "If the code didn't arrive, request a new one here.",
        "Agar kod kelmasa, shu yerda qayta so'rang.",
        "Если код не пришёл, запросите новый здесь.",
      )}
      nextStep={tr("verify with code", "kod bilan tasdiqlash", "подтвердить кодом")}
      points={[
        {
          icon: MailQuestion,
          title: tr("Check your inbox", "Pochta/boxni tekshiring", "Проверьте почту"),
          description: tr(
            "Sometimes the code arrives with a short delay.",
            "Ba'zan kod biroz kechikib keladi.",
            "Иногда код приходит с небольшой задержкой.",
          ),
        },
        {
          icon: Send,
          title: tr("Request again", "Qayta so'rang", "Запросите снова"),
          description: tr(
            "We will send a new verification code.",
            "Biz yangi tasdiqlash kodini yuboramiz.",
            "Мы отправим новый код подтверждения.",
          ),
        },
        {
          icon: MailCheck,
          title: tr("Use the new code", "Yangi kodni kiriting", "Введите новый код"),
          description: tr(
            "Enter the latest code on the verification page.",
            "Eng so'nggi kodni tasdiqlash sahifasida kiriting.",
            "Введите последний код на странице подтверждения.",
          ),
        },
      ]}
    >
      <ResendVerificationForm />
    </AuthShell>
  );
}
