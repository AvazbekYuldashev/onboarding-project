import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { getEmployeeKpi } from "@/api/kpiCoreApi";
import { getMyProfile } from "@/api/profileApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

function Message({ type, children }: { type: "error" | "info"; children: React.ReactNode }) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

export function EmployeeKpiPage() {
  const session = useAuthStore((state) => state.session);
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const profileQuery = useQuery({
    queryKey: ["profile", "me", "employee-kpi"],
    queryFn: getMyProfile,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const employeeId = profileQuery.data?.id?.trim() || session?.id?.trim() || "";

  const kpiQuery = useQuery({
    queryKey: ["employee-kpi-by-employee", employeeId, page, size],
    queryFn: () => getEmployeeKpi(employeeId, page, size),
    enabled: Boolean(employeeId),
    staleTime: 30_000,
  });

  const rows = kpiQuery.data?.content ?? [];
  const displayRows = rows;

  const totalPages = Math.max(kpiQuery.data?.totalPages ?? 1, 1);
  const totalElements = kpiQuery.data?.totalElements ?? 0;
  const fullName = useMemo(() => `${session?.username || "-"}`, [session?.username]);

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("KPI", "KPI", "KPI")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Your KPI results.", "Sizning KPI natijalaringiz.", "Ваши KPI результаты.")} {" "}
            <span className="ml-2 text-xs text-muted-foreground">{fullName}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("KPI Results", "KPI natijalari", "Результаты KPI")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!employeeId ? <Message type="error">{tr("Employee session/profile has no id.", "Employee session/profile id yo'q.", "В сессии/профиле сотрудника нет id.")}</Message> : null}
          {profileQuery.isLoading || kpiQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading KPI...", "KPI yuklanmoqda...", "Загрузка KPI...")}
              </span>
            </Message>
          ) : null}
          {profileQuery.isError || kpiQuery.isError ? (
            <Message type="error">
              {(profileQuery.error instanceof Error
                ? profileQuery.error.message
                : kpiQuery.error instanceof Error
                  ? kpiQuery.error.message
                : tr("Failed to load KPI.", "KPI ni yuklab bo'lmadi.", "Не удалось загрузить KPI."))}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Employee", "Xodim", "Сотрудник")}</th>
                  <th className="px-3 py-2">{tr("Total tasks", "Jami vazifalar", "Всего задач")}</th>
                  <th className="px-3 py-2">{tr("Accepted tasks", "Jarayondagi vazifalar", "Принятые задачи")}</th>
                  <th className="px-3 py-2">{tr("Rejected tasks", "Rad etilgan vazifalar", "Отклонённые задачи")}</th>
                  <th className="px-3 py-2">{tr("Completed tasks", "Yakunlangan vazifalar", "Завершённые задачи")}</th>
                  <th className="px-3 py-2">{tr("Total score", "Umumiy ball", "Общий балл")}</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row.employeeId} className="border-t border-border/70">
                    <td className="px-3 py-2">{`${row.employeeName ?? ""} ${row.employeeSurname ?? ""}`.trim() || "-"}</td>
                    <td className="px-3 py-2">{row.totalCount ?? "-"}</td>
                    <td className="px-3 py-2">{row.acceptedTaskCount ?? "-"}</td>
                    <td className="px-3 py-2">{row.rejectedTaskCount ?? "-"}</td>
                    <td className="px-3 py-2">{row.completedTaskCount ?? "-"}</td>
                    <td className="px-3 py-2">{row.totalScore ?? "-"}</td>
                  </tr>
                ))}
                {!kpiQuery.isLoading && displayRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                      {tr("No KPI data found for this employee.", "Ushbu xodim uchun KPI ma'lumot topilmadi.", "Для этого сотрудника KPI данные не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="employee-kpi-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select id="employee-kpi-page-size" value={String(size)} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1 || kpiQuery.isFetching} onClick={() => setPage((p) => Math.max(p - 1, 1))}>{tr("Previous", "Oldingi", "Назад")}</Button>
              <Badge variant="neutral">{page}/{totalPages}</Badge>
              <Button type="button" variant="outline" disabled={page >= totalPages || kpiQuery.isFetching} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>{tr("Next", "Keyingi", "Вперёд")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}



