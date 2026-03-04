import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { getMyDepartment } from "@/api/departmentCoreApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/features/i18n/messages";

function Message({ type, children }: { type: "error" | "info"; children: React.ReactNode }) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

export function EmployeeMyDepartmentPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  const departmentQuery = useQuery({
    queryKey: ["department-core", "by-my", "employee"],
    queryFn: getMyDepartment,
    staleTime: 30_000,
  });

  const department = departmentQuery.data;
  const departments = department ? [department] : [];

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("My Department", "Mening bo'limim", "Мой отдел")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Employee department details.", "Xodim bo'lim ma'lumotlari.", "Dannie otdela sotrudnika.")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Department", "Bo'lim", "Отдел")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {departments.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {departmentQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading department...", "Bo'lim yuklanmoqda...", "Загрузка отдела...")}
              </span>
            </Message>
          ) : null}
          {departmentQuery.isError ? (
            <Message type="error">
              {departmentQuery.error instanceof Error
                ? departmentQuery.error.message
                : tr("Failed to load department.", "Bo'limni yuklab bo'lmadi.", "Не удалось загрузить отдел.")}
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
                {departments.map((item) => (
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
                {!departmentQuery.isLoading && departments.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                      {tr("Department not found.", "Bo'lim topilmadi.", "Отдел не найден.")}
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
