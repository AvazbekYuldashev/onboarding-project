import { useQuery } from "@tanstack/react-query";
import { Building, Loader2 } from "lucide-react";
import { getBuildingById } from "@/api/buildingCoreApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

function Message({ type, children }: { type: "error" | "info"; children: React.ReactNode }) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

export function EmployeeBuildingPage() {
  const session = useAuthStore((state) => state.session);
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const buildingId = session?.buildingId?.trim() || "";

  const buildingQuery = useQuery({
    queryKey: ["building-core", "by-id", buildingId, "employee"],
    queryFn: () => getBuildingById(buildingId),
    enabled: Boolean(buildingId),
    staleTime: 30_000,
  });

  const items = buildingQuery.data ? [buildingQuery.data] : [];

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Building", "Bino", "Здание")}</CardTitle>
          </div>
          <CardDescription>{tr("Employee building details.", "Xodim bino ma'lumotlari.", "Dannie zdaniya sotrudnika.")}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Building", "Bino", "Здание")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {items.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!buildingId ? <Message type="error">Employee session has no buildingId.</Message> : null}
          {buildingQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading building...", "Bino yuklanmoqda...", "Загрузка здания...")}
              </span>
            </Message>
          ) : null}
          {buildingQuery.isError ? (
            <Message type="error">
              {buildingQuery.error instanceof Error
                ? buildingQuery.error.message
                : tr("Failed to load building.", "Binoni yuklab bo'lmadi.", "Не удалось загрузить здание.")}
            </Message>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">{tr("Visible", "Ko'rinadi", "Видимость")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Создано")}</th>
                  <th className="px-3 py-2">{tr("Updated", "Yangilangan", "Обновлено")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{item.title || "-"}</td>
                    <td className="px-3 py-2">{item.description || "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={item.visible ? "green" : "neutral"}>
                        {item.visible === undefined ? "-" : item.visible ? tr("Visible", "Ko'rinadi", "Виден") : tr("Hidden", "Yashirin", "Скрыт")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{item.createdDate ?? "-"}</td>
                    <td className="px-3 py-2">{item.updatedDate ?? "-"}</td>
                  </tr>
                ))}
                {!buildingQuery.isLoading && items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                      {tr("Building not found.", "Bino topilmadi.", "Здание не найдено.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
