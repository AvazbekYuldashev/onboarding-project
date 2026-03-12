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
      badge={tr("Auth Module", "Autentifikatsiya moduli", "РњРѕРґСѓР»СЊ Р°СѓС‚РµРЅС‚РёС„РёРєР°С†РёРё")}
      title={tr(
        "Start with account registration",
        "Akkaunt ro'yxatdan o'tkazishdan boshlang",
        "РќР°С‡РЅРёС‚Рµ СЃ СЂРµРіРёСЃС‚СЂР°С†РёРё Р°РєРєР°СѓРЅС‚Р°",
      )}
      description={tr(
        "Frontend is aligned with your backend AuthController contract for registration and code verification flow.",
        "Frontend registration va kod orqali verification oqimi bo'yicha backend AuthController contractiga moslangan.",
        "Frontend СЃРѕРіР»Р°СЃРѕРІР°РЅ С backend AuthController РґР»СЏ flow СЂРµРіРёСЃС‚СЂР°С†РёРё Рё РІРµСЂРёС„РёРєР°С†РёРё РїРѕ РєРѕРґСѓ.",
      )}
      nextStep={tr("code verification", "kodni tasdiqlash", "РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РєРѕРґР°")}
      points={[
        {
          icon: UserRoundPlus,
          title: tr(
            "Registration DTO compatible",
            "Registration DTO mos",
            "РЎРѕРІРјРµСЃС‚РёРјРѕ СЃ Registration DTO",
          ),
          description: tr(
            "Payload fields are exactly: name, surname, username, password.",
            "Payload maydonlari aniq: name, surname, username, password.",
            "РџРѕР»СЏ payload СЃС‚СЂРѕРіРѕ: name, surname, username, password.",
          ),
        },
        {
          icon: MailCheck,
          title: tr("Verification ready", "Verification tayyor", "Р’РµСЂРёС„РёРєР°С†РёСЏ РіРѕС‚РѕРІР°"),
          description: tr(
            "After successful registration, continue with code verification.",
            "Muvaffaqiyatli ro'yxatdan o'tgach, kodni tasdiqlash bilan davom eting.",
            "РџРѕСЃР»Рµ СѓСЃРїРµС€РЅРѕР№ СЂРµРіРёСЃС‚СЂР°С†РёРё РїСЂРѕРґРѕР»Р¶Р°Р№С‚Рµ С‡РµСЂРµР· РїРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РєРѕРґР°.",
          ),
        },
        {
          icon: KeyRound,
          title: tr("Auth flow ready", "Auth flow tayyor", "Auth flow РіРѕС‚РѕРІ"),
          description: tr(
            "Login and reset password flows are available as separate modules.",
            "Login va reset password oqimlari alohida modullar sifatida mavjud.",
            "Login Рё reset password РґРѕСЃС‚СѓРїРЅС‹ РєР°Рє РѕС‚РґРµР»СЊРЅС‹Рµ РјРѕРґСѓР»Рё.",
          ),
        },
      ]}
    >
      <RegisterForm />
    </AuthShell>
  );
}
