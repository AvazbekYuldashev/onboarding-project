import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { filterManagerApplications } from "@/api/applicationManagerApi";
import { getBuildingsByDepartment } from "@/api/buildingCoreApi";
import { getCategoriesByDepartment } from "@/api/categoryCoreApi";
import { getEmployeesByDepartment } from "@/api/employeeCoreApi";
import { getOfferingsByDepartment } from "@/api/offeringCoreApi";
import { getMyProfile } from "@/api/profileApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { ApplicationFilterDTO, ApplicationStatus } from "@/types/applicationOwner";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "SENT",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "REVIEW",
  "DENIED",
  "COMPLETED",
];

interface FilterDraftState {
  id: string;
  title: string;
  description: string;
  status: "" | ApplicationStatus;
  kpiBall: string;
  kpiBallLimit: string;
  deadline: string;
  buildingId: string;
  categoryId: string;
  offeringId: string;
  sendProfileId: string;
  acceptorProfileId: string;
  createdDateFrom: string;
  createdDateTo: string;
  adminCheckedDateFrom: string;
  adminCheckedDateTo: string;
  employeeApprovedDateFrom: string;
  employeeApprovedDateTo: string;
  employeeEndDateFrom: string;
  employeeEndDateTo: string;
  limitDateFrom: string;
  limitDateTo: string;
  updatedDateFrom: string;
  updatedDateTo: string;
}

function Message({
  type,
  children,
}: {
  type: "error" | "info";
  children: React.ReactNode;
}) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

function toOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function statusLabel(status: ApplicationStatus, tr: (en: string, uz: string, ru: string) => string): string {
  if (status === "SENT") return tr("Sent", "Yuborilgan", "Отправлена");
  if (status === "APPROVED") return tr("Approved", "Tasdiqlangan", "Одобрена");
  if (status === "REJECTED") return tr("Rejected", "Rad etilgan", "Отклонена");
  if (status === "IN_PROGRESS") return tr("In progress", "Jarayonda", "В процессе");
  if (status === "REVIEW") return tr("Review", "Ko'rib chiqildi", "На проверке");
  if (status === "DENIED") return tr("Denied", "Bekor qilingan", "Отказано");
  return tr("Completed", "Yakunlangan", "Завершена");
}

const defaultFilterDraft: FilterDraftState = {
  id: "",
  title: "",
  description: "",
  status: "",
  kpiBall: "",
  kpiBallLimit: "",
  deadline: "",
  buildingId: "",
  categoryId: "",
  offeringId: "",
  sendProfileId: "",
  acceptorProfileId: "",
  createdDateFrom: "",
  createdDateTo: "",
  adminCheckedDateFrom: "",
  adminCheckedDateTo: "",
  employeeApprovedDateFrom: "",
  employeeApprovedDateTo: "",
  employeeEndDateFrom: "",
  employeeEndDateTo: "",
  limitDateFrom: "",
  limitDateTo: "",
  updatedDateFrom: "",
  updatedDateTo: "",
};

export function ManagerApplicationsPage() {
  const session = useAuthStore((state) => state.session);
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filterDraft, setFilterDraft] = useState(defaultFilterDraft);
  const [appliedFilter, setAppliedFilter] = useState<ApplicationFilterDTO>({});
  const [allMode, setAllMode] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", "me", "manager-applications"],
    queryFn: getMyProfile,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const departmentId = session?.departmentId?.trim() || profileQuery.data?.departmentId?.trim() || "";

  const applicationsQuery = useQuery({
    queryKey: ["manager-applications", departmentId, page, size, appliedFilter],
    queryFn: () => filterManagerApplications({ ...appliedFilter, departmentId }, page, size),
    enabled: Boolean(session) && !profileQuery.isLoading && Boolean(departmentId),
    staleTime: 30_000,
  });

  const buildingsForSelectQuery = useQuery({
    queryKey: ["manager-applications-buildings", departmentId],
    queryFn: () => getBuildingsByDepartment(departmentId, 1, 200),
    enabled: Boolean(departmentId),
    staleTime: 60_000,
  });
  const categoriesForSelectQuery = useQuery({
    queryKey: ["manager-applications-categories", departmentId],
    queryFn: () => getCategoriesByDepartment(departmentId, 1, 200),
    enabled: Boolean(departmentId),
    staleTime: 60_000,
  });
  const offeringsForSelectQuery = useQuery({
    queryKey: ["manager-applications-offerings", departmentId],
    queryFn: () => getOfferingsByDepartment(departmentId, 1, 200),
    enabled: Boolean(departmentId),
    staleTime: 60_000,
  });
  const acceptorsForSelectQuery = useQuery({
    queryKey: ["manager-applications-acceptors", departmentId],
    queryFn: () => getEmployeesByDepartment(departmentId, 1, 200),
    enabled: Boolean(departmentId),
    staleTime: 60_000,
  });

  const applications = applicationsQuery.data?.content ?? [];
  const buildings = buildingsForSelectQuery.data?.content ?? [];
  const categories = categoriesForSelectQuery.data?.content ?? [];
  const offerings = offeringsForSelectQuery.data?.content ?? [];
  const acceptors = acceptorsForSelectQuery.data?.content ?? [];
  const totalPages = Math.max(applicationsQuery.data?.totalPages ?? 1, 1);
  const totalElements = applicationsQuery.data?.totalElements ?? 0;
  const filterMode = useMemo(() => Object.keys(appliedFilter).length > 0, [appliedFilter]);

  const applyFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ApplicationFilterDTO = {};
    if (toOptional(filterDraft.id)) payload.id = filterDraft.id.trim();
    if (toOptional(filterDraft.title)) payload.title = filterDraft.title.trim();
    if (toOptional(filterDraft.description)) payload.description = filterDraft.description.trim();
    if (filterDraft.status) payload.status = filterDraft.status;
    if (toOptionalNumber(filterDraft.kpiBall) !== undefined) payload.kpiBall = toOptionalNumber(filterDraft.kpiBall);
    if (toOptionalNumber(filterDraft.kpiBallLimit) !== undefined) payload.kpiBallLimit = toOptionalNumber(filterDraft.kpiBallLimit);
    if (toOptionalNumber(filterDraft.deadline) !== undefined) payload.deadline = toOptionalNumber(filterDraft.deadline);
    if (toOptional(filterDraft.buildingId)) payload.buildingId = filterDraft.buildingId.trim();
    if (toOptional(filterDraft.categoryId)) payload.categoryId = filterDraft.categoryId.trim();
    if (toOptional(filterDraft.offeringId)) payload.offeringId = filterDraft.offeringId.trim();
    if (toOptional(filterDraft.sendProfileId)) payload.sendProfileId = filterDraft.sendProfileId.trim();
    if (toOptional(filterDraft.acceptorProfileId)) payload.acceptorProfileId = filterDraft.acceptorProfileId.trim();
    if (toOptional(filterDraft.createdDateFrom)) payload.createdDateFrom = filterDraft.createdDateFrom;
    if (toOptional(filterDraft.createdDateTo)) payload.createdDateTo = filterDraft.createdDateTo;
    if (toOptional(filterDraft.adminCheckedDateFrom)) payload.adminCheckedDateFrom = filterDraft.adminCheckedDateFrom;
    if (toOptional(filterDraft.adminCheckedDateTo)) payload.adminCheckedDateTo = filterDraft.adminCheckedDateTo;
    if (toOptional(filterDraft.employeeApprovedDateFrom)) payload.employeeApprovedDateFrom = filterDraft.employeeApprovedDateFrom;
    if (toOptional(filterDraft.employeeApprovedDateTo)) payload.employeeApprovedDateTo = filterDraft.employeeApprovedDateTo;
    if (toOptional(filterDraft.employeeEndDateFrom)) payload.employeeEndDateFrom = filterDraft.employeeEndDateFrom;
    if (toOptional(filterDraft.employeeEndDateTo)) payload.employeeEndDateTo = filterDraft.employeeEndDateTo;
    if (toOptional(filterDraft.limitDateFrom)) payload.limitDateFrom = filterDraft.limitDateFrom;
    if (toOptional(filterDraft.limitDateTo)) payload.limitDateTo = filterDraft.limitDateTo;
    if (toOptional(filterDraft.updatedDateFrom)) payload.updatedDateFrom = filterDraft.updatedDateFrom;
    if (toOptional(filterDraft.updatedDateTo)) payload.updatedDateTo = filterDraft.updatedDateTo;
    setPage(1);
    setAppliedFilter(payload);
  };

  const resetFilter = () => {
    setFilterDraft(defaultFilterDraft);
    setAppliedFilter({});
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Applications", "Arizalar", "Заявки")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Manager applications module.", "Menejer arizalar moduli.", "Модуль заявок менеджера.")}{" "}
            <span className="ml-2 text-xs text-muted-foreground">Department: {departmentId || "-"}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Filters", "Filtrlar", "Фильтры")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={applyFilter}>
            <Input placeholder={tr("Title", "Nomi", "Название")} value={filterDraft.title} onChange={(e) => setFilterDraft((p) => ({ ...p, title: e.target.value }))} />
            <Select value={filterDraft.status} onChange={(e) => setFilterDraft((p) => ({ ...p, status: e.target.value as "" | ApplicationStatus }))}>
              <option value="">{tr("All statuses", "Barcha holatlar", "Все статусы")}</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>{statusLabel(status, tr)}</option>
              ))}
            </Select>
            <Select value={filterDraft.buildingId} onChange={(e) => setFilterDraft((p) => ({ ...p, buildingId: e.target.value }))}>
              <option value="">{tr("Building", "Bino", "Здание")}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>{building.title || building.id}</option>
              ))}
            </Select>
            <Select value={filterDraft.categoryId} onChange={(e) => setFilterDraft((p) => ({ ...p, categoryId: e.target.value }))}>
              <option value="">{tr("Category", "Kategoriya", "Категория")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.title || category.id}</option>
              ))}
            </Select>
            <Select value={filterDraft.offeringId} onChange={(e) => setFilterDraft((p) => ({ ...p, offeringId: e.target.value }))}>
              <option value="">{tr("Service", "Xizmat", "Услуга")}</option>
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>{offering.title || offering.id}</option>
              ))}
            </Select>
            <Input placeholder={tr("Sender profile ID", "Yuboruvchi profile ID", "ID профиля отправителя")} value={filterDraft.sendProfileId} onChange={(e) => setFilterDraft((p) => ({ ...p, sendProfileId: e.target.value }))} />
            <Select value={filterDraft.acceptorProfileId} onChange={(e) => setFilterDraft((p) => ({ ...p, acceptorProfileId: e.target.value }))}>
              <option value="">{tr("Acceptor profile", "Qabul qiluvchi", "Принимающий профиль")}</option>
              {acceptors.map((profile) => (
                <option key={profile.id} value={profile.id}>{`${profile.name} ${profile.surname}`.trim() || profile.username || profile.id}</option>
              ))}
            </Select>

            {allMode ? (
              <>
                <Input placeholder={tr("Application ID", "Ariza ID", "ID заявки")} value={filterDraft.id} onChange={(e) => setFilterDraft((p) => ({ ...p, id: e.target.value }))} />
                <Input placeholder={tr("Description", "Tavsif", "Описание")} value={filterDraft.description} onChange={(e) => setFilterDraft((p) => ({ ...p, description: e.target.value }))} />
                <Input placeholder={tr("KPI Ball", "KPI Ball", "KPI балл")} value={filterDraft.kpiBall} onChange={(e) => setFilterDraft((p) => ({ ...p, kpiBall: e.target.value }))} />
                <Input placeholder={tr("KPI Ball Limit", "KPI Ball limiti", "Лимит KPI балла")} value={filterDraft.kpiBallLimit} onChange={(e) => setFilterDraft((p) => ({ ...p, kpiBallLimit: e.target.value }))} />
                <Input placeholder={tr("Deadline", "Deadline", "Deadline")} value={filterDraft.deadline} onChange={(e) => setFilterDraft((p) => ({ ...p, deadline: e.target.value }))} />

                <div className="space-y-1"><Label>{tr("Created date from", "Yaratilgan sana boshi", "Дата создания начало")}</Label><Input type="date" value={filterDraft.createdDateFrom} onChange={(e) => setFilterDraft((p) => ({ ...p, createdDateFrom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Created date to", "Yaratilgan sana oxiri", "Дата создания конец")}</Label><Input type="date" value={filterDraft.createdDateTo} onChange={(e) => setFilterDraft((p) => ({ ...p, createdDateTo: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Admin checked from", "Admin tekshirgan sana boshi", "Проверка админом начало")}</Label><Input type="date" value={filterDraft.adminCheckedDateFrom} onChange={(e) => setFilterDraft((p) => ({ ...p, adminCheckedDateFrom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Admin checked to", "Admin tekshirgan sana oxiri", "Проверка админом конец")}</Label><Input type="date" value={filterDraft.adminCheckedDateTo} onChange={(e) => setFilterDraft((p) => ({ ...p, adminCheckedDateTo: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Employee approved from", "Xodim tasdiqlagan sana boshi", "Подтверждение сотрудником начало")}</Label><Input type="date" value={filterDraft.employeeApprovedDateFrom} onChange={(e) => setFilterDraft((p) => ({ ...p, employeeApprovedDateFrom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Employee approved to", "Xodim tasdiqlagan sana oxiri", "Подтверждение сотрудником конец")}</Label><Input type="date" value={filterDraft.employeeApprovedDateTo} onChange={(e) => setFilterDraft((p) => ({ ...p, employeeApprovedDateTo: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Employee end from", "Xodim yakunlagan sana boshi", "Завершение сотрудником начало")}</Label><Input type="date" value={filterDraft.employeeEndDateFrom} onChange={(e) => setFilterDraft((p) => ({ ...p, employeeEndDateFrom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Employee end to", "Xodim yakunlagan sana oxiri", "Завершение сотрудником конец")}</Label><Input type="date" value={filterDraft.employeeEndDateTo} onChange={(e) => setFilterDraft((p) => ({ ...p, employeeEndDateTo: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Limit date from", "Limit sana boshi", "Лимит дата начало")}</Label><Input type="date" value={filterDraft.limitDateFrom} onChange={(e) => setFilterDraft((p) => ({ ...p, limitDateFrom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Limit date to", "Limit sana oxiri", "Лимит дата конец")}</Label><Input type="date" value={filterDraft.limitDateTo} onChange={(e) => setFilterDraft((p) => ({ ...p, limitDateTo: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Updated date from", "Yangilangan sana boshi", "Дата обновления начало")}</Label><Input type="date" value={filterDraft.updatedDateFrom} onChange={(e) => setFilterDraft((p) => ({ ...p, updatedDateFrom: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{tr("Updated date to", "Yangilangan sana oxiri", "Дата обновления конец")}</Label><Input type="date" value={filterDraft.updatedDateTo} onChange={(e) => setFilterDraft((p) => ({ ...p, updatedDateTo: e.target.value }))} /></div>
              </>
            ) : null}

            <div className="flex items-center gap-2 md:col-span-4">
              <Button type="submit"><Search className="size-4" aria-hidden />{tr("Apply", "Qo'llash", "Применить")}</Button>
              <Button type="button" variant="outline" onClick={resetFilter}>{tr("Reset", "Tozalash", "Сброс")}</Button>
              <Button type="button" variant="outline" onClick={() => setAllMode((p) => !p)}>
                {allMode ? tr("Full filter", "To'liq filter", "Полный фильтр") : tr("Default filter", "Standart filter", "Стандартный фильтр")}
              </Button>
              <Badge variant={filterMode ? "yellow" : "neutral"}>{filterMode ? tr("Filter applied", "Filtr qo'llangan", "Фильтр применен") : tr("No filter", "Filtr yo'q", "Без фильтра")}</Badge>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Applications", "Arizalar", "Заявки")}</CardTitle>
          <CardDescription>{tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicationsQuery.isLoading ? (
            <Message type="info"><span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" aria-hidden />{tr("Loading applications...", "Arizalar yuklanmoqda...", "Загрузка заявок...")}</span></Message>
          ) : null}
          {applicationsQuery.isError ? (
            <Message type="error">{applicationsQuery.error instanceof Error ? applicationsQuery.error.message : tr("Failed to load applications.", "Arizalarni yuklab bo'lmadi.", "Не удалось загрузить заявки.")}</Message>
          ) : null}
          {!profileQuery.isLoading && !departmentId ? <Message type="error">Manager session has no departmentId.</Message> : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Status", "Holat", "Статус")}</th>
                  <th className="px-3 py-2">KPI</th>
                  <th className="px-3 py-2">{tr("Sender", "Yuboruvchi", "Отправитель")}</th>
                  <th className="px-3 py-2">{tr("Acceptor", "Qabul qiluvchi", "Принимающий")}</th>
                  <th className="px-3 py-2">{tr("Building", "Bino", "Здание")}</th>
                  <th className="px-3 py-2">{tr("Category", "Kategoriya", "Категория")}</th>
                  <th className="px-3 py-2">{tr("Service", "Xizmat", "Услуга")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Создано")}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{application.title || "-"}</td>
                    <td className="px-3 py-2">{application.status || "-"}</td>
                    <td className="px-3 py-2">{application.kpiBall ?? "-"}</td>
                    <td className="px-3 py-2">{application.sendProfileFullName || application.sendProfileId || "-"}</td>
                    <td className="px-3 py-2">{application.acceptorProfileFullName || application.acceptorProfileId || "-"}</td>
                    <td className="px-3 py-2">{application.buildingTitle || application.buildingId || "-"}</td>
                    <td className="px-3 py-2">{application.categoryTitle || application.categoryId || "-"}</td>
                    <td className="px-3 py-2">{application.offeringTitle || application.offeringId || "-"}</td>
                    <td className="px-3 py-2">{application.createdDate || "-"}</td>
                  </tr>
                ))}
                {!applicationsQuery.isLoading && applications.length === 0 ? (
                  <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={9}>{tr("No applications found.", "Arizalar topilmadi.", "Заявки не найдены.")}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="manager-applications-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select id="manager-applications-page-size" value={String(size)} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1 || applicationsQuery.isFetching} onClick={() => setPage((p) => Math.max(p - 1, 1))}>{tr("Previous", "Oldingi", "Назад")}</Button>
              <Badge variant="neutral">{page}/{totalPages}</Badge>
              <Button type="button" variant="outline" disabled={page >= totalPages || applicationsQuery.isFetching} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>{tr("Next", "Keyingi", "Вперед")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

