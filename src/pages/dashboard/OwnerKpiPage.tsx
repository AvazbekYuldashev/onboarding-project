import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getEmployeeKpi } from "@/api/kpiCoreApi";
import { getOwnerProfiles } from "@/api/profileOwnerApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/messages";

function Message({
  type,
  children,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const classes =
    type === "success"
      ? "border-success/40 bg-success/10 text-success"
      : type === "error"
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

export function OwnerKpiPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, _ru: string) =>
    language === "UZ" ? uz : language === "RU" ? en : en;

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [employeeIdDraft, setEmployeeIdDraft] = useState("");
  const [employeeIdApplied, setEmployeeIdApplied] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["owner-kpi-employees-select"],
    queryFn: () => getOwnerProfiles(1, 200),
    staleTime: 60_000,
  });

  const kpiQuery = useQuery({
    queryKey: ["owner-kpi-by-employee", employeeIdApplied, page, size],
    queryFn: () => getEmployeeKpi(employeeIdApplied, page, size),
    enabled: Boolean(employeeIdApplied.trim()),
    staleTime: 30_000,
  });

  const employees = employeesQuery.data?.content ?? [];
  const rows = kpiQuery.data?.content ?? [];
  const appliedEmployeeLabel = useMemo(() => {
    const found = employees.find((entry) => entry.id === employeeIdApplied);
    if (!found) return "";
    const fullName = `${found.name} ${found.surname}`.trim();
    return fullName || found.username || found.id;
  }, [employees, employeeIdApplied]);
  const displayRows =
    employeeIdApplied && rows.length === 0
      ? [
          {
            employeeId: employeeIdApplied || "0",
            employeeName: appliedEmployeeLabel || "0",
            employeeSurname: "",
            totalCount: 0,
            acceptedTaskCount: 0,
            rejectedTaskCount: 0,
            completedTaskCount: 0,
            totalScore: 0,
          },
        ]
      : rows;
  const totalPages = Math.max(kpiQuery.data?.totalPages ?? 1, 1);
  const totalElements = kpiQuery.data?.totalElements ?? 0;

  const selectedEmployeeLabel = useMemo(() => {
    const found = employees.find((entry) => entry.id === employeeIdDraft);
    if (!found) return "";
    const fullName = `${found.name} ${found.surname}`.trim();
    return fullName || found.username || found.id;
  }, [employees, employeeIdDraft]);

  const apply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = employeeIdDraft.trim();
    if (!id) return;
    setPage(1);
    setEmployeeIdApplied(id);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("KPI", "KPI", "KPI")}</CardTitle>
          </div>
          <CardDescription>
            {tr(
              "Employee KPI by user id (path variable).",
              "User id (path variable) bo'yicha xodim KPI ko'rsatkichlari.",
              "РџРѕРєР°Р·Р°С‚РµР»Рё KPI СЃРѕС‚СЂСѓРґРЅРёРєР° РїРѕ user id (path variable).",
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Employee Selection", "Xodim tanlash", "Р’С‹Р±РѕСЂ СЃРѕС‚СЂСѓРґРЅРёРєР°")}</CardTitle>
          <CardDescription>
            {tr(
              "Select user or enter id manually, then fetch KPI.",
              "Foydalanuvchini tanlang yoki id ni qo'lda kiriting, so'ng KPI ni oling.",
              "Р’С‹Р±РµСЂРёС‚Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РёР»Рё РІРІРµРґРёС‚Рµ id РІСЂСѓС‡РЅСѓСЋ, Р·Р°С‚РµРј РїРѕР»СѓС‡РёС‚Рµ KPI.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={apply}>
            <Select
              value={employeeIdDraft}
              onChange={(event) => setEmployeeIdDraft(event.target.value)}
            >
              <option value="">{tr("Select employee", "Xodimni tanlang", "Р’С‹Р±РµСЂРёС‚Рµ СЃРѕС‚СЂСѓРґРЅРёРєР°")}</option>
              {employees.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {`${entry.name} ${entry.surname}`.trim() || entry.username || entry.id}
                </option>
              ))}
            </Select>
            <Input
              placeholder={tr("Or enter employee id", "Yoki xodim id kiriting", "РР»Рё РІРІРµРґРёС‚Рµ id СЃРѕС‚СЂСѓРґРЅРёРєР°")}
              value={employeeIdDraft}
              onChange={(event) => setEmployeeIdDraft(event.target.value)}
            />
            <div className="md:col-span-2 flex items-center gap-2">
              <Button type="submit" disabled={!employeeIdDraft.trim()}>
                <Search className="size-4" aria-hidden />
                {tr("Fetch KPI", "KPI ni olish", "РџРѕР»СѓС‡РёС‚СЊ KPI")}
              </Button>
              {selectedEmployeeLabel ? (
                <Badge variant="outline">{selectedEmployeeLabel}</Badge>
              ) : null}
            </div>
          </form>

          {employeesQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading employees...", "Xodimlar yuklanmoqda...", "Р—Р°РіСЂСѓР·РєР° СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ...")}
              </span>
            </Message>
          ) : null}
          {employeesQuery.isError ? (
            <Message type="error">
              {employeesQuery.error instanceof Error
                ? employeesQuery.error.message
                : tr("Failed to load employees.", "Xodimlarni yuklab bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРѕС‚СЂСѓРґРЅРёРєРѕРІ.")}
            </Message>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("KPI Results", "KPI natijalari", "Р РµР·СѓР»СЊС‚Р°С‚С‹ KPI")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Р’СЃРµРіРѕ")}: {totalElements} | {tr("Page", "Sahifa", "РЎС‚СЂР°РЅРёС†Р°")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!employeeIdApplied ? (
            <Message type="info">
              {tr(
                "Choose employee id and click fetch.",
                "Xodim id tanlab, olish tugmasini bosing.",
                "Р’С‹Р±РµСЂРёС‚Рµ id СЃРѕС‚СЂСѓРґРЅРёРєР° Рё РЅР°Р¶РјРёС‚Рµ РїРѕР»СѓС‡РёС‚СЊ.",
              )}
            </Message>
          ) : null}

          {kpiQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading KPI...", "KPI yuklanmoqda...", "Р—Р°РіСЂСѓР·РєР° KPI...")}
              </span>
            </Message>
          ) : null}
          {kpiQuery.isError ? (
            <Message type="error">
              {kpiQuery.error instanceof Error
                ? kpiQuery.error.message
                : tr("Failed to load KPI.", "KPI ni yuklab bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ KPI.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Employee", "Xodim", "РЎРѕС‚СЂСѓРґРЅРёРє")}</th>
                  <th className="px-3 py-2">{tr("Total tasks", "Jami vazifalar", "Всего задач")}</th>
                  <th className="px-3 py-2">{tr("Accepted tasks", "Jarayondagi vazifalar", "Принятые задачи")}</th>
                  <th className="px-3 py-2">{tr("Rejected tasks", "Rad etilgan vazifalar", "РћС‚РєР»РѕРЅРµРЅРЅС‹Рµ Р·Р°РґР°С‡Рё")}</th>
                  <th className="px-3 py-2">{tr("Completed tasks", "Yakunlangan vazifalar", "Р—Р°РІРµСЂС€РµРЅРЅС‹Рµ Р·Р°РґР°С‡Рё")}</th>
                  <th className="px-3 py-2">{tr("Total score", "Umumiy ball", "РћР±С‰РёР№ Р±Р°Р»Р»")}</th>
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
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="kpi-page-size">{tr("Page size", "Sahifa hajmi", "Р Р°Р·РјРµСЂ СЃС‚СЂР°РЅРёС†С‹")}</Label>
            <Select
              id="kpi-page-size"
              value={String(size)}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || kpiQuery.isFetching}
                onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              >
                {tr("Previous", "Oldingi", "РќР°Р·Р°Рґ")}
              </Button>
              <Badge variant="neutral">
                {page}/{totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || kpiQuery.isFetching}
                onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              >
                {tr("Next", "Keyingi", "Р’РїРµСЂРµРґ")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}



