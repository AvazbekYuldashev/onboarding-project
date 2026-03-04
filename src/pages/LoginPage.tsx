import { KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { useI18n } from "@/features/i18n/messages";

export function LoginPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <AuthShell
      badge={tr("Auth Module", "Autentifikatsiya moduli", "Модуль аутентификации")}
      title={tr("Secure login", "Xavfsiz kirish", "Безопасный вход")}
      description={tr(
        "Authenticate users via backend endpoint and store active session in Zustand store.",
        "Foydalanuvchini backend endpoint orqali tasdiqlab, faol sessiyani Zustand store da saqlaydi.",
        "Аутентифицирует пользователя через backend endpoint и сохраняет активную сессию в Zustand store.",
      )}
      nextStep={tr("open protected modules", "himoyalangan modullarni ochish", "открыть защищенные модули")}
      points={[
        {
          icon: UserCheck,
          title: tr("AuthDTO compatible", "AuthDTO mos", "Совместимо с AuthDTO"),
          description: tr(
            "Payload fields are exactly: username, password.",
            "Payload maydonlari aniq: username, password.",
            "Поля payload строго: username, password.",
          ),
        },
        {
          icon: ShieldCheck,
          title: tr("ProfileDTO mapping", "ProfileDTO mapping", "Маппинг ProfileDTO"),
          description: tr(
            "Login response maps to session model including jwt and role.",
            "Login javobi jwt va role bilan session modelga map qilinadi.",
            "Ответ login маппится в модель сессии с jwt и role.",
          ),
        },
        {
          icon: KeyRound,
          title: tr("Language aware requests", "Tilga mos so'rovlar", "Запросы с учетом языка"),
          description: tr(
            "Language is controlled globally from the header toggle.",
            "Til header dagi global toggle orqali boshqariladi.",
            "Язык управляется глобальным переключателем в header.",
          ),
        },
      ]}
    >
      <LoginForm />
    </AuthShell>
  );
}
