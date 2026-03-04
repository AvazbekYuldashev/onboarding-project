import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/features/auth/language";
import { useI18n } from "@/features/i18n/messages";

export function LanguageToggle() {
  const language = useLanguageStore((state) => state.language);
  const cycleLanguage = useLanguageStore((state) => state.cycleLanguage);
  const { t } = useI18n();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-10 gap-1.5 px-3 text-xs font-semibold tracking-wide"
      onClick={cycleLanguage}
      aria-label={t("currentLanguageClickToSwitch", { lang: language })}
      title={`Language: ${language}`}
    >
      <Languages className="size-4" aria-hidden />
      {language}
    </Button>
  );
}
