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
      badge={tr("Auth Module", "Autentifikatsiya moduli", "РњРѕРґСѓР»СЊ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё")}
      title={tr(
        "Resend registration verification",
        "Ro'yxatdan o'tish tasdiqini qayta yuborish",
        "РџРѕРІС‚РѕСЂРЅР°СЏ РѕС‚РїСЂР°РІРєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ СЂРµРіРёСЃС‚СЂР°С†РёРё",
      )}
      description={tr(
        "Use username to request a new registration verification code from backend.",
        "Username orqali backenddan yangi ro'yxatdan o'tish tasdiq kodini so'rang.",
        "РСЃРїРѕР»СЊР·СѓР№С‚Рµ username, С‡С‚РѕР±С‹ Р·Р°РїСЂРѕСЃРёС‚СЊ РЅРѕРІС‹Р№ РєРѕРґ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ СЂРµРіРёСЃС‚СЂР°С†РёРё СЃ backend.",
      )}
      nextStep={tr("verify with code", "kod bilan tasdiqlash", "РїРѕРґС‚РІРµСЂРґРёС‚СЊ РєРѕРґРѕРј")}
      points={[
        {
          icon: MailQuestion,
          title: tr("EmailResendDTO compatible", "EmailResendDTO mos", "РЎРѕРІРјРµСЃС‚РёРјРѕ СЃ EmailResendDTO"),
          description: tr(
            "Payload field is exactly: username.",
            "Payload maydoni aniq: username.",
            "РџРѕР»Рµ payload СЃС‚СЂРѕРіРѕ: username.",
          ),
        },
        {
          icon: Send,
          title: tr("Controller mapped", "Controller ulanishi tayyor", "Controller РїРѕРґРєР»СЋС‡РµРЅ"),
          description: tr(
            "Uses POST /api/v1/auth/registration/email-verification-resend.",
            "POST /api/v1/auth/registration/email-verification-resend dan foydalanadi.",
            "РСЃРїРѕР»СЊР·СѓРµС‚ POST /api/v1/auth/registration/email-verification-resend.",
          ),
        },
        {
          icon: MailCheck,
          title: tr("Registration continuity", "Registratsiya davomiyligi", "РќРµРїСЂРµСЂС‹РІРЅРѕСЃС‚СЊ СЂРµРіРёСЃС‚СЂР°С†РёРё"),
          description: tr(
            "Works with pending registration username saved after sign-up.",
            "Sign-updan keyin saqlangan pending username bilan ishlaydi.",
            "Р Р°Р±РѕС‚Р°РµС‚ СЃ pending username, СЃРѕС…СЂР°РЅРµРЅРЅС‹Рј РїРѕСЃР»Рµ sign-up.",
          ),
        },
      ]}
    >
      <ResendVerificationForm />
    </AuthShell>
  );
}
