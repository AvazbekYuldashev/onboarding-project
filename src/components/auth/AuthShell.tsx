import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/features/i18n/messages";

interface AuthPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  nextStep: string;
  points: AuthPoint[];
  children: ReactNode;
}

export function AuthShell({
  badge,
  title,
  description,
  nextStep,
  points,
  children,
}: AuthShellProps) {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <section className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Card className="animate-fade-in border-border/80 bg-card/80 backdrop-blur">
        <CardHeader className="space-y-4">
          <Badge variant="outline" className="w-fit">
            {badge}
          </Badge>
          <CardTitle className="text-3xl leading-tight md:text-4xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground md:text-base">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {points.map((point) => {
            const Icon = point.icon;

            return (
              <article key={point.title} className="flex gap-3 rounded-lg border border-border/70 p-4">
                <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                <div className="space-y-1">
                  <h3 className="font-medium">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </div>
              </article>
            );
          })}

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {tr("Next step:", "Keyingi qadam:", "Следующий шаг:")} {nextStep}
            <ArrowRight className="size-4" aria-hidden />
          </p>
        </CardContent>
      </Card>

      <div className="animate-fade-in" style={{ animationDelay: "120ms" }}>
        {children}
      </div>
    </section>
  );
}
