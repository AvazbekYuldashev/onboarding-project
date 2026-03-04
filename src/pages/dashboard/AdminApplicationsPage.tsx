import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterAdminApplications,
  updateAdminApplicationStatus,
} from "@/api/applicationAdminApi";
import { getBuildingById } from "@/api/buildingCoreApi";
import { getCategoryById } from "@/api/categoryCoreApi";
import { getDepartmentById } from "@/api/departmentCoreApi";
import { getCategoriesByBuilding } from "@/api/categoryCoreApi";
import { getEmployeesByBuilding } from "@/api/employeeCoreApi";
import { getEmployeeById } from "@/api/employeeCoreApi";
import { getOfferingsByBuilding } from "@/api/offeringCoreApi";
import { getOfferingById } from "@/api/offeringCoreApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { ApplicationFilterDTO, ApplicationResponseDTO, ApplicationStatus } from "@/types/applicationOwner";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "SENT",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "REVIEW",
  "DENIED",
  "COMPLETED",
];
const ADMIN_ACTION_STATUSES: ApplicationStatus[] = ["APPROVED", "REJECTED"];

interface FilterDraftState {
  title: string;
  status: "" | ApplicationStatus;
  categoryId: string;
  offeringId: string;
  sendProfileId: string;
  acceptorProfileId: string;
  id: string;
  description: string;
  kpiBall: string;
  kpiBallLimit: string;
  deadline: string;
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
  if (status === "SENT") return tr("Sent", "Yuborilgan", "РћС‚РїСЂР°РІР»РµРЅР°");
  if (status === "APPROVED") return tr("Approved", "Tasdiqlangan", "РћРґРѕР±СЂРµРЅР°");
  if (status === "REJECTED") return tr("Rejected", "Rad etilgan", "Otklonena");
  if (status === "IN_PROGRESS") return tr("In progress", "Jarayonda", "V protsesse");
  if (status === "REVIEW") return tr("Review", "Ko'rib chiqildi", "Na proverke");
  if (status === "DENIED") return tr("Denied", "Bekor qilingan", "Otkazano");
  return tr("Completed", "Yakunlangan", "Zavershena");
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "mt-1 break-all font-mono text-sm" : "mt-1 text-sm"}>{value || "-"}</div>
    </div>
  );
}

const defaultFilterDraft: FilterDraftState = {
  title: "",
  status: "",
  categoryId: "",
  offeringId: "",
  sendProfileId: "",
  acceptorProfileId: "",
  id: "",
  description: "",
  kpiBall: "",
  kpiBallLimit: "",
  deadline: "",
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

export function AdminApplicationsPage() {
  const session = useAuthStore((state) => state.session);
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [allMode, setAllMode] = useState(false);
  const [filterDraft, setFilterDraft] = useState(defaultFilterDraft);
  const [appliedFilter, setAppliedFilter] = useState<ApplicationFilterDTO>({});
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponseDTO | null>(null);
  const buildingId = session?.buildingId?.trim() || "";

  const categoriesForSelectQuery = useQuery({
    queryKey: ["admin-applications-categories", buildingId],
    queryFn: () => getCategoriesByBuilding(buildingId, 1, 200),
    enabled: Boolean(buildingId),
    staleTime: 60_000,
  });
  const offeringsForSelectQuery = useQuery({
    queryKey: ["admin-applications-offerings", buildingId],
    queryFn: () => getOfferingsByBuilding(buildingId, 1, 200),
    enabled: Boolean(buildingId),
    staleTime: 60_000,
  });
  const acceptorsForSelectQuery = useQuery({
    queryKey: ["admin-applications-acceptors", buildingId],
    queryFn: () => getEmployeesByBuilding(buildingId, 1, 200),
    enabled: Boolean(buildingId),
    staleTime: 60_000,
  });
  const departmentDetailQuery = useQuery({
    queryKey: ["admin-application-department", selectedApplication?.departmentId],
    queryFn: () => getDepartmentById(selectedApplication?.departmentId ?? ""),
    enabled: Boolean(selectedApplication?.departmentId),
    retry: false,
  });
  const buildingDetailQuery = useQuery({
    queryKey: ["admin-application-building", selectedApplication?.buildingId],
    queryFn: () => getBuildingById(selectedApplication?.buildingId ?? ""),
    enabled: Boolean(selectedApplication?.buildingId),
    retry: false,
  });
  const categoryDetailQuery = useQuery({
    queryKey: ["admin-application-category", selectedApplication?.categoryId],
    queryFn: () => getCategoryById(selectedApplication?.categoryId ?? ""),
    enabled: Boolean(selectedApplication?.categoryId),
    retry: false,
  });
  const offeringDetailQuery = useQuery({
    queryKey: ["admin-application-offering", selectedApplication?.offeringId],
    queryFn: () => getOfferingById(selectedApplication?.offeringId ?? ""),
    enabled: Boolean(selectedApplication?.offeringId),
    retry: false,
  });
  const senderDetailQuery = useQuery({
    queryKey: ["admin-application-sender", selectedApplication?.sendProfileId],
    queryFn: () => getEmployeeById(selectedApplication?.sendProfileId ?? ""),
    enabled: Boolean(selectedApplication?.sendProfileId),
    retry: false,
  });
  const acceptorDetailQuery = useQuery({
    queryKey: ["admin-application-acceptor", selectedApplication?.acceptorProfileId],
    queryFn: () => getEmployeeById(selectedApplication?.acceptorProfileId ?? ""),
    enabled: Boolean(selectedApplication?.acceptorProfileId),
    retry: false,
  });

  const filterMode = useMemo(() => Object.keys(appliedFilter).length > 0, [appliedFilter]);

  const applicationsQuery = useQuery({
    queryKey: ["admin-applications", buildingId, page, size, appliedFilter],
    queryFn: () => filterAdminApplications({ ...appliedFilter, buildingId }, page, size),
    enabled: Boolean(buildingId),
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateAdminApplicationStatus,
    onSuccess: (message) => {
      setActionError("");
      setActionMessage(message);
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (error) => {
      setActionMessage("");
      setActionError(error instanceof Error ? error.message : tr("Failed to update status.", "Holatni yangilashda xatolik.", "Oshibka pri obnovlenii statusa."));
    },
  });

  const categories = categoriesForSelectQuery.data?.content ?? [];
  const offerings = offeringsForSelectQuery.data?.content ?? [];
  const acceptors = acceptorsForSelectQuery.data?.content ?? [];
  const applications = applicationsQuery.data?.content ?? [];
  const totalPages = Math.max(applicationsQuery.data?.totalPages ?? 1, 1);
  const totalElements = applicationsQuery.data?.totalElements ?? 0;
  const categoryTitleById = useMemo(
    () =>
      new Map(
        categories
          .filter((item) => item.id)
          .map((item) => [item.id, item.title || "-"] as const),
      ),
    [categories],
  );
  const offeringTitleById = useMemo(
    () =>
      new Map(
        offerings
          .filter((item) => item.id)
          .map((item) => [item.id, item.title || "-"] as const),
      ),
    [offerings],
  );
  const profileNameById = useMemo(
    () =>
      new Map(
        acceptors
          .filter((item) => item.id)
          .map((item) => [item.id, `${item.name} ${item.surname}`.trim() || item.username || "-"] as const),
      ),
    [acceptors],
  );

  const applyFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ApplicationFilterDTO = {};
    if (toOptional(filterDraft.title)) payload.title = filterDraft.title.trim();
    if (filterDraft.status) payload.status = filterDraft.status;
    if (toOptional(filterDraft.categoryId)) payload.categoryId = filterDraft.categoryId.trim();
    if (toOptional(filterDraft.offeringId)) payload.offeringId = filterDraft.offeringId.trim();
    if (toOptional(filterDraft.sendProfileId)) payload.sendProfileId = filterDraft.sendProfileId.trim();
    if (toOptional(filterDraft.acceptorProfileId)) payload.acceptorProfileId = filterDraft.acceptorProfileId.trim();
    if (toOptional(filterDraft.id)) payload.id = filterDraft.id.trim();
    if (toOptional(filterDraft.description)) payload.description = filterDraft.description.trim();
    if (toOptionalNumber(filterDraft.kpiBall) !== undefined) payload.kpiBall = toOptionalNumber(filterDraft.kpiBall);
    if (toOptionalNumber(filterDraft.kpiBallLimit) !== undefined) payload.kpiBallLimit = toOptionalNumber(filterDraft.kpiBallLimit);
    if (toOptionalNumber(filterDraft.deadline) !== undefined) payload.deadline = toOptionalNumber(filterDraft.deadline);
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

  const saveStatus = (application: ApplicationResponseDTO, status: ApplicationStatus) => {
    const id = application.id.trim();
    if (!id) {
      setActionMessage("");
      setActionError(tr("Application id is required.", "Ariza id kerak.", "Trebuetsya id zayavki."));
      return;
    }
    if (!ADMIN_ACTION_STATUSES.includes(status)) {
      setActionMessage("");
      setActionError(
        tr(
          "Admin can only set APPROVED or REJECTED.",
          "Admin faqat APPROVED yoki REJECTED yubora oladi.",
          "Admin mozhet otpravit tolko APPROVED ili REJECTED.",
        ),
      );
      return;
    }
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("applications")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Incoming applications for current building.", "Joriy bino bo'yicha kelgan arizalar.", "Vhodyashie zayavki po tekushemu zdaniyu.")}{" "}
            <span className="ml-2 text-xs text-muted-foreground">Building ID: {buildingId || "-"}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Filters", "Filtrlar", "Р¤РёР»СЊС‚СЂС‹")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={applyFilter}>
            <Input
              placeholder={tr("Title", "Nomi", "Nazvanie")}
              value={filterDraft.title}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, title: event.target.value }))}
            />
            <Select
              value={filterDraft.status}
              onChange={(event) =>
                setFilterDraft((previous) => ({ ...previous, status: event.target.value as "" | ApplicationStatus }))
              }
            >
              <option value="">{tr("All statuses", "Barcha holatlar", "Vse statusy")}</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status, tr)}
                </option>
              ))}
            </Select>
            <Select
              value={filterDraft.categoryId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, categoryId: event.target.value }))}
            >
              <option value="">{tr("Category", "Kategoriya", "Kategoriya")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title || "-"}
                </option>
              ))}
            </Select>
            <Select
              value={filterDraft.offeringId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, offeringId: event.target.value }))}
            >
              <option value="">{tr("Service", "Xizmat", "Usluga")}</option>
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.title || "-"}
                </option>
              ))}
            </Select>
            <Input
              placeholder={tr("Sender profile ID", "Yuboruvchi profile ID", "ID profilya otpravitelya")}
              value={filterDraft.sendProfileId}
              onChange={(event) =>
                setFilterDraft((previous) => ({ ...previous, sendProfileId: event.target.value }))
              }
            />
            <Select
              value={filterDraft.acceptorProfileId}
              onChange={(event) =>
                setFilterDraft((previous) => ({ ...previous, acceptorProfileId: event.target.value }))
              }
            >
              <option value="">{tr("Acceptor", "Qabul qiluvchi", "РџСЂРёРЅРёРјР°СЋС‰РёР№")}</option>
              {acceptors.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {`${profile.name} ${profile.surname}`.trim() || profile.username || "-"}
                </option>
              ))}
            </Select>

            {allMode ? (
              <>
                <Input
                  placeholder={tr("Application ID", "Ariza ID", "ID zayavki")}
                  value={filterDraft.id}
                  onChange={(event) => setFilterDraft((previous) => ({ ...previous, id: event.target.value }))}
                />
                <Input
                  placeholder={tr("Description", "Tavsif", "Opisanie")}
                  value={filterDraft.description}
                  onChange={(event) =>
                    setFilterDraft((previous) => ({ ...previous, description: event.target.value }))
                  }
                />
                <Input
                  placeholder={tr("KPI Ball", "KPI Ball", "KPI Ball")}
                  value={filterDraft.kpiBall}
                  onChange={(event) =>
                    setFilterDraft((previous) => ({ ...previous, kpiBall: event.target.value }))
                  }
                />
                <Input
                  placeholder={tr("KPI Ball Limit", "KPI Ball limiti", "Limit KPI Ball")}
                  value={filterDraft.kpiBallLimit}
                  onChange={(event) =>
                    setFilterDraft((previous) => ({ ...previous, kpiBallLimit: event.target.value }))
                  }
                />
                <Input
                  placeholder={tr("Deadline", "Deadline", "Deadline")}
                  value={filterDraft.deadline}
                  onChange={(event) =>
                    setFilterDraft((previous) => ({ ...previous, deadline: event.target.value }))
                  }
                />

                <div className="space-y-1">
                  <Label>{tr("Created date from", "Yaratilgan sana boshi", "Data sozdaniya nachalo")}</Label>
                  <Input type="date" value={filterDraft.createdDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, createdDateFrom: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Created date to", "Yaratilgan sana oxiri", "Data sozdaniya konets")}</Label>
                  <Input type="date" value={filterDraft.createdDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, createdDateTo: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Admin checked date from", "Admin tekshirgan sana boshi", "Proverka adminom nachalo")}</Label>
                  <Input type="date" value={filterDraft.adminCheckedDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, adminCheckedDateFrom: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Admin checked date to", "Admin tekshirgan sana oxiri", "Proverka adminom konets")}</Label>
                  <Input type="date" value={filterDraft.adminCheckedDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, adminCheckedDateTo: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Employee approved date from", "Xodim tasdiqlagan sana boshi", "Sotrudnik podtverdil nachalo")}</Label>
                  <Input type="date" value={filterDraft.employeeApprovedDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeApprovedDateFrom: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Employee approved date to", "Xodim tasdiqlagan sana oxiri", "Sotrudnik podtverdil konets")}</Label>
                  <Input type="date" value={filterDraft.employeeApprovedDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeApprovedDateTo: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Employee end date from", "Xodim yakunlagan sana boshi", "Sotrudnik zavershil nachalo")}</Label>
                  <Input type="date" value={filterDraft.employeeEndDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeEndDateFrom: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Employee end date to", "Xodim yakunlagan sana oxiri", "Sotrudnik zavershil konets")}</Label>
                  <Input type="date" value={filterDraft.employeeEndDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeEndDateTo: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Limit date from", "Limit sana boshi", "Limit data nachalo")}</Label>
                  <Input type="date" value={filterDraft.limitDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, limitDateFrom: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Limit date to", "Limit sana oxiri", "Limit data konets")}</Label>
                  <Input type="date" value={filterDraft.limitDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, limitDateTo: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Updated date from", "Yangilangan sana boshi", "Obnovleno nachalo")}</Label>
                  <Input type="date" value={filterDraft.updatedDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, updatedDateFrom: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{tr("Updated date to", "Yangilangan sana oxiri", "Obnovleno konets")}</Label>
                  <Input type="date" value={filterDraft.updatedDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, updatedDateTo: event.target.value }))} />
                </div>
              </>
            ) : null}

            <div className="flex items-center gap-2 md:col-span-4">
              <Button type="submit">
                <Search className="size-4" aria-hidden />
                {tr("Apply", "Qo'llash", "РџСЂРёРјРµРЅРёС‚СЊ")}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilter}>
                {tr("Reset", "Tozalash", "РЎР±СЂРѕСЃ")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setAllMode((previous) => !previous)}>
                {allMode
                  ? tr("Full filter", "To'liq filter", "Polniy filtr")
                  : tr("Default filter", "Standart filter", "Standartniy filtr")}
              </Button>
              <Badge variant={filterMode ? "yellow" : "neutral"}>
                {filterMode ? tr("Filter applied", "Filtr qo'llangan", "Filtr primenen") : tr("No filter", "Filtr yo'q", "Bez filtra")}
              </Badge>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("applications")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Vsego")}: {totalElements} | {tr("Page", "Sahifa", "Stranitsa")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionMessage ? <Message type="success">{actionMessage}</Message> : null}
          {actionError ? <Message type="error">{actionError}</Message> : null}
          {!buildingId ? (
            <Message type="error">{tr("Admin session has no buildingId.", "Admin sessionda buildingId yo'q.", "V sessii admina net buildingId.")}</Message>
          ) : null}
          {applicationsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading applications...", "Arizalar yuklanmoqda...", "Zagruzka zayavok...")}
              </span>
            </Message>
          ) : null}
          {applicationsQuery.isError ? (
            <Message type="error">
              {applicationsQuery.error instanceof Error
                ? applicationsQuery.error.message
                : tr("Failed to load applications.", "Arizalarni yuklab bo'lmadi.", "Ne udalos zagruzit zayavki.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Nazvanie")}</th>
                  <th className="px-3 py-2">{tr("Status", "Holat", "Status")}</th>
                  <th className="px-3 py-2">{tr("Sender", "Yuboruvchi", "Otpravitel")}</th>
                  <th className="px-3 py-2">{tr("Acceptor", "Qabul qiluvchi", "РџСЂРёРЅРёРјР°СЋС‰РёР№")}</th>
                  <th className="px-3 py-2">{tr("Category", "Kategoriya", "Kategoriya")}</th>
                  <th className="px-3 py-2">{tr("Service", "Xizmat", "Usluga")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Sozdano")}</th>
                  <th className="px-3 py-2">{tr("Details", "Batafsil", "Podrobnee")}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-t border-border/70">
                    <td className="px-3 py-2">
                      <div className="font-medium">{application.title || "-"}</div>
                      <div className="max-w-[18rem] truncate text-xs text-muted-foreground">
                        {application.description || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        <Select
                          className="min-w-[155px]"
                          value={application.status ?? "SENT"}
                          disabled={updateStatusMutation.isPending}
                          onChange={(event) => {
                            const next = event.target.value as ApplicationStatus;
                            if (!next) return;
                            saveStatus(application, next);
                          }}
                        >
                          <option value={application.status ?? "SENT"}>
                            {statusLabel(application.status ?? "SENT", tr)}
                          </option>
                          {ADMIN_ACTION_STATUSES.filter((status) => status !== (application.status ?? "SENT")).map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status, tr)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {application.sendProfileFullName ||
                        (application.sendProfileId ? profileNameById.get(application.sendProfileId) : undefined) ||
                        "-"}
                    </td>
                    <td className="px-3 py-2">
                      {application.acceptorProfileFullName ||
                        (application.acceptorProfileId ? profileNameById.get(application.acceptorProfileId) : undefined) ||
                        tr("Not assigned yet", "Hali qabul qilinmagan", "Р•С‰С‘ РЅРµ РїСЂРёРЅСЏС‚Рѕ")}
                    </td>
                    <td className="px-3 py-2">
                      {application.categoryTitle ||
                        (application.categoryId ? categoryTitleById.get(application.categoryId) : undefined) ||
                        "-"}
                    </td>
                    <td className="px-3 py-2">
                      {application.offeringTitle ||
                        (application.offeringId ? offeringTitleById.get(application.offeringId) : undefined) ||
                        "-"}
                    </td>
                    <td className="px-3 py-2">{formatDateTime(application.createdDate)}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelectedApplication(application)}>
                        <Eye className="size-4" aria-hidden />
                        {tr("Open", "Ochish", "Otkryt")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!applicationsQuery.isLoading && applications.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                      {tr("No applications found.", "Arizalar topilmadi.", "Zayavki ne naydeny.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="admin-applications-page-size">
              {tr("Page size", "Sahifa hajmi", "Р Р°Р·РјРµСЂ СЃС‚СЂР°РЅРёС†С‹")}
            </Label>
            <Select
              id="admin-applications-page-size"
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
                disabled={page <= 1 || applicationsQuery.isFetching}
                onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              >
                {tr("Previous", "Oldingi", "Nazad")}
              </Button>
              <Badge variant="neutral">
                {page}/{totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || applicationsQuery.isFetching}
                onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              >
                {tr("Next", "Keyingi", "Vpered")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedApplication ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedApplication(null)}
        >
          <Card
            className="flex max-h-[90vh] w-full max-w-3xl flex-col border-border/80 bg-card shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader className="sticky top-0 z-10 flex flex-row items-start justify-between gap-3 border-b border-border/70 bg-card">
              <div>
                <CardTitle className="text-lg">{tr("Application Details", "Ariza tafsilotlari", "Detali zayavki")}</CardTitle>
                <CardDescription>{selectedApplication.title || "-"}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedApplication(null)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="grid flex-1 gap-2 overflow-y-auto p-6 md:grid-cols-2">
              <DetailItem label={tr("Title", "Nomi", "Nazvanie")} value={selectedApplication.title || "-"} />
              <DetailItem label={tr("Status", "Holat", "Status")} value={statusLabel(selectedApplication.status ?? "SENT", tr)} />
              <div className="md:col-span-2">
                <DetailItem label={tr("Description", "Tavsif", "Opisanie")} value={selectedApplication.description || "-"} />
              </div>
              <div className="md:col-span-2">
                <DetailItem label={tr("Comments", "Izoh", "РљРѕРјРјРµРЅС‚Р°СЂРёР№")} value={selectedApplication.comments || "-"} />
              </div>
              <DetailItem label="KPI Ball" value={selectedApplication.kpiBall?.toString() || "-"} />
              <DetailItem label="KPI Ball Limit" value={selectedApplication.kpiBallLimit?.toString() || "-"} />
              <DetailItem label={tr("Deadline (hours)", "Deadline (soat)", "Deadline (chasy)")} value={selectedApplication.deadline !== undefined && selectedApplication.deadline !== null ? `${selectedApplication.deadline} soat` : "-"} />
              <DetailItem
                label={tr("Visible", "Ko'rinadi", "Vidimost")}
                value={
                  selectedApplication.visible === undefined
                    ? "-"
                    : selectedApplication.visible
                      ? tr("Yes", "Ha", "Da")
                      : tr("No", "Yo'q", "Net")
                }
              />
              <DetailItem
                label={tr("Sender", "Yuboruvchi", "Otpravitel")}
                value={
                  selectedApplication.sendProfileFullName ||
                  `${senderDetailQuery.data?.name || ""} ${senderDetailQuery.data?.surname || ""}`.trim() ||
                  senderDetailQuery.data?.username ||
                  (selectedApplication.sendProfileId ? profileNameById.get(selectedApplication.sendProfileId) : undefined) ||
                  "-"
                }
              />
              <DetailItem
                label={tr("Acceptor", "Qabul qiluvchi", "РџСЂРёРЅРёРјР°СЋС‰РёР№")}
                value={
                  selectedApplication.acceptorProfileFullName ||
                  `${acceptorDetailQuery.data?.name || ""} ${acceptorDetailQuery.data?.surname || ""}`.trim() ||
                  acceptorDetailQuery.data?.username ||
                  (selectedApplication.acceptorProfileId
                    ? profileNameById.get(selectedApplication.acceptorProfileId)
                    : undefined) ||
                  tr("Not assigned yet", "Hali qabul qilinmagan", "Р•С‰С‘ РЅРµ РїСЂРёРЅСЏС‚Рѕ")
                }
              />
              <DetailItem
                label={tr("Department", "Bo'lim", "Otdel")}
                value={selectedApplication.departmentTitle || departmentDetailQuery.data?.title || "-"}
              />
              <DetailItem
                label={tr("Building", "Bino", "Р—РґР°РЅРёРµ")}
                value={selectedApplication.buildingTitle || buildingDetailQuery.data?.title || "-"}
              />
              <DetailItem
                label={tr("Category", "Kategoriya", "Kategoriya")}
                value={
                  selectedApplication.categoryTitle ||
                  categoryDetailQuery.data?.title ||
                  (selectedApplication.categoryId ? categoryTitleById.get(selectedApplication.categoryId) : undefined) ||
                  "-"
                }
              />
              <DetailItem
                label={tr("Service", "Xizmat", "Usluga")}
                value={
                  selectedApplication.offeringTitle ||
                  offeringDetailQuery.data?.title ||
                  (selectedApplication.offeringId ? offeringTitleById.get(selectedApplication.offeringId) : undefined) ||
                  "-"
                }
              />
              <DetailItem label={tr("Created", "Yaratilgan", "Sozdano")} value={formatDateTime(selectedApplication.createdDate)} />
              <DetailItem label={tr("Admin checked", "Admin tekshirgan", "Provereno adminom")} value={formatDateTime(selectedApplication.adminCheckedDate)} />
              <DetailItem label={tr("Employee approved", "Xodim tasdiqlagan", "Sotrudnik podtverdil")} value={formatDateTime(selectedApplication.employeeApprovedDate)} />
              <DetailItem label={tr("Employee ended", "Xodim yakunlagan", "Sotrudnik zavershil")} value={formatDateTime(selectedApplication.employeeEndDate)} />
              <DetailItem label={tr("Limit date", "Limit sana", "Limit data")} value={formatDateTime(selectedApplication.limitDate)} />
              <DetailItem label={tr("Updated", "Yangilangan", "Obnovleno")} value={formatDateTime(selectedApplication.updatedDate)} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}

