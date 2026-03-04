import { useQuery } from "@tanstack/react-query";
import { Loader2, MailCheck, ShieldX } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { verifyRegistrationEmail } from "@/api/authApi";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/features/i18n/messages";
import { cn } from "@/lib/cn";

export function EmailVerificationPage() {
  const { token } = useParams();
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const isValidRequest = Boolean(token);

  const query = useQuery({
    queryKey: ["auth", "email-verification", token, language],
    queryFn: () => verifyRegistrationEmail(token ?? ""),
    enabled: isValidRequest,
    retry: 0,
  });

  return (
    <section className="flex min-h-[65vh] items-center justify-center">
      <Card className="w-full max-w-lg border-border/80 bg-card/95 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle>{tr("Email verification", "Email tasdiqlash", "Подтверждение email")}</CardTitle>
          <CardDescription>
            {tr("Backend endpoint:", "Backend endpoint:", "Backend endpoint:")}
            <span className="ml-1 font-medium">
              GET /api/v1/auth/registration/email-verification/{`{token}`}/{`{lang}`}
            </span>
            <span className="ml-1">({tr("current lang", "joriy til", "текущий язык")}: {language})</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isValidRequest ? (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {tr("Invalid verification link. Token is missing.", "Noto'g'ri tasdiqlash havolasi. Token yo'q.", "Неверная ссылка подтверждения. Token отсутствует.")}
            </div>
          ) : null}

          {query.isLoading ? (
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {tr("Verifying email...", "Email tasdiqlanmoqda...", "Проверка email...")}
            </div>
          ) : null}

          {query.isSuccess ? (
            <div className="flex items-start gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
              <MailCheck className="mt-0.5 size-4" aria-hidden />
              <span>{query.data.message}</span>
            </div>
          ) : null}

          {query.isError ? (
            <div className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <ShieldX className="mt-0.5 size-4" aria-hidden />
              <span>
                {query.error instanceof Error ? query.error.message : tr("Email verification failed.", "Email tasdiqlanmadi.", "Подтверждение email не выполнено.")}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link className={cn(buttonVariants())} to="/auth/login">
              {tr("Go to login", "Kirishga o'tish", "Перейти ко входу")}
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline" }))} to="/auth/verification/resend">
              {tr("Resend verification", "Tasdiqlashni qayta yuborish", "Повторно отправить подтверждение")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
