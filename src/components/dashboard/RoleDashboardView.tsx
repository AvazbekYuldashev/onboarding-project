import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/features/i18n/messages";
import type { AuthSession, ProfileRole } from "@/types/auth";

interface RolePanelItem {
  title: string;
  value: string;
  hint: string;
}

interface RoleDashboardViewProps {
  role: ProfileRole;
  title: string;
  description: string;
  panels: RolePanelItem[];
  session: AuthSession;
}

export function RoleDashboardView({
  role,
  title,
  description,
  panels,
  session,
}: RoleDashboardViewProps) {
  const { t, language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  return (
    <section className="space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("dashboard")}</Badge>
            <Badge variant="neutral">{role}</Badge>
            <Badge variant="neutral">{session.username}</Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {panels.map((panel) => (
          <Card key={panel.title} className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle className="text-base">{panel.title}</CardTitle>
              <CardDescription>{panel.hint}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{panel.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-base">{t("dashboard")} {tr("Session", "Sessiya", "Сессия")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">{tr("id", "id", "id")}:</span> {session.id}
          </p>
          <p>
            <span className="text-muted-foreground">{tr("username", "username", "username")}:</span> {session.username}
          </p>
          <p>
            <span className="text-muted-foreground">{tr("departmentId", "departmentId", "departmentId")}:</span> {session.departmentId ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">{tr("buildingId", "buildingId", "buildingId")}:</span> {session.buildingId ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">{tr("role", "rol", "роль")}:</span> {session.role}
          </p>
          <p className="truncate">
            <span className="text-muted-foreground">{tr("jwt", "jwt", "jwt")}:</span> {session.jwt ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">{tr("isEmployee", "isEmployee", "isEmployee")}:</span>{" "}
            {session.isEmployee === undefined ? "-" : String(session.isEmployee)}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
