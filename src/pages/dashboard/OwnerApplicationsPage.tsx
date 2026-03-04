import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterOwnerApplications,
  updateOwnerApplicationStatus,
} from "@/api/applicationOwnerApi";
import { getOwnerBuildings } from "@/api/buildingOwnerApi";
import { getOwnerCategories } from "@/api/categoryOwnerApi";
import { getOwnerOfferings } from "@/api/offeringOwnerApi";
import { getOwnerProfiles } from "@/api/profileOwnerApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/messages";
import type {
  ApplicationFilterDTO,
  ApplicationResponseDTO,
  ApplicationStatus,
} from "@/types/applicationOwner";

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
  visible: "" | "true" | "false";
  sendProfileId: string;
  acceptorProfileId: string;
  departmentId: string;
  buildingId: string;
  categoryId: string;
  offeringId: string;
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

function toOptionalBoolean(value: "" | "true" | "false"): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function getStatusVariant(status?: ApplicationStatus): "neutral" | "green" | "yellow" | "red" {
  if (!status) return "neutral";
  if (status === "COMPLETED" || status === "APPROVED") return "green";
  if (status === "REJECTED" || status === "DENIED") return "red";
  return "yellow";
}

function statusLabel(status: ApplicationStatus, tr: (en: string, uz: string, ru: string) => string): string {
  if (status === "SENT") return tr("Sent", "Yuborilgan", "РћС‚РїСЂР°РІР»РµРЅР°");
  if (status === "APPROVED") return tr("Approved", "Tasdiqlangan", "РћРґРѕР±СЂРµРЅР°");
  if (status === "REJECTED") return tr("Rejected", "Rad etilgan", "РћС‚РєР»РѕРЅРµРЅР°");
  if (status === "IN_PROGRESS") return tr("In progress", "Jarayonda", "Р’ РїСЂРѕС†РµСЃСЃРµ");
  if (status === "REVIEW") return tr("Review", "Ko'rib chiqildi", "РќР° РїСЂРѕРІРµСЂРєРµ");
  if (status === "DENIED") return tr("Denied", "Bekor qilingan", "РћС‚РєР°Р·Р°РЅРѕ");
  return tr("Completed", "Yakunlangan", "Р—Р°РІРµСЂС€РµРЅР°");
}

const defaultFilterDraft: FilterDraftState = {
  id: "",
  title: "",
  description: "",
  status: "",
  kpiBall: "",
  kpiBallLimit: "",
  deadline: "",
  visible: "",
  sendProfileId: "",
  acceptorProfileId: "",
  departmentId: "",
  buildingId: "",
  categoryId: "",
  offeringId: "",
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

export function OwnerApplicationsPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, _ru: string) =>
    language === "UZ" ? uz : language === "RU" ? en : en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filterDraft, setFilterDraft] = useState(defaultFilterDraft);
  const [appliedFilter, setAppliedFilter] = useState<ApplicationFilterDTO>({});
  const [allMode, setAllMode] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, ApplicationStatus>>({});
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const applicationsQuery = useQuery({
    queryKey: ["owner-applications", page, size, appliedFilter],
    queryFn: () => filterOwnerApplications(appliedFilter, page, size),
    staleTime: 30_000,
  });
  const categoriesForSelectQuery = useQuery({
    queryKey: ["owner-applications-categories-select"],
    queryFn: () => getOwnerCategories(1, 200),
    staleTime: 60_000,
  });
  const offeringsForSelectQuery = useQuery({
    queryKey: ["owner-applications-offerings-select"],
    queryFn: () => getOwnerOfferings(1, 200),
    staleTime: 60_000,
  });
  const acceptorsForSelectQuery = useQuery({
    queryKey: ["owner-applications-acceptors-select"],
    queryFn: () => getOwnerProfiles(1, 200),
    staleTime: 60_000,
  });
  const buildingsForSelectQuery = useQuery({
    queryKey: ["owner-applications-buildings-select"],
    queryFn: () => getOwnerBuildings(1, 200),
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

  const updateStatusMutation = useMutation({
    mutationFn: updateOwnerApplicationStatus,
    onSuccess: (message) => {
      setActionError("");
      setActionMessage(message);
      queryClient.invalidateQueries({ queryKey: ["owner-applications"] });
    },
    onError: (error) => {
      setActionMessage("");
      setActionError(error instanceof Error ? error.message : tr("Failed to update application status.", "Ariza holatini yangilab bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ СЃС‚Р°С‚СѓСЃ Р·Р°СЏРІРєРё."));
    },
  });

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
    if (toOptionalBoolean(filterDraft.visible) !== undefined) payload.visible = toOptionalBoolean(filterDraft.visible);
    if (toOptional(filterDraft.sendProfileId)) payload.sendProfileId = filterDraft.sendProfileId.trim();
    if (toOptional(filterDraft.acceptorProfileId)) payload.acceptorProfileId = filterDraft.acceptorProfileId.trim();
    if (toOptional(filterDraft.departmentId)) payload.departmentId = filterDraft.departmentId.trim();
    if (toOptional(filterDraft.buildingId)) payload.buildingId = filterDraft.buildingId.trim();
    if (toOptional(filterDraft.categoryId)) payload.categoryId = filterDraft.categoryId.trim();
    if (toOptional(filterDraft.offeringId)) payload.offeringId = filterDraft.offeringId.trim();
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

  const pickStatus = (application: ApplicationResponseDTO): ApplicationStatus => {
    const selected = statusMap[application.id];
    return selected ?? application.status ?? "SENT";
  };

  const saveStatus = (application: ApplicationResponseDTO) => {
    const id = application.id.trim();
    if (!id) {
      setActionMessage("");
      setActionError(tr("Application id is required.", "Ariza id majburiy.", "РўСЂРµР±СѓРµС‚СЃСЏ id Р·Р°СЏРІРєРё."));
      return;
    }
    const status = pickStatus(application);
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Applications", "Arizalar", "Р—Р°СЏРІРєРё")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Owner applications management module.", "Ega uchun arizalar boshqaruvi moduli.", "РњРѕРґСѓР»СЊ СѓРїСЂР°РІР»РµРЅРёСЏ Р·Р°СЏРІРєР°РјРё РґР»СЏ РІР»Р°РґРµР»СЊС†Р°.")}
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
              placeholder={tr("Title", "Nomi", "РќР°Р·РІР°РЅРёРµ")}
              value={filterDraft.title}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, title: event.target.value }))}
            />
            <Select
              value={filterDraft.status}
              onChange={(event) =>
                setFilterDraft((previous) => ({
                  ...previous,
                  status: event.target.value as "" | ApplicationStatus,
                }))
              }
            >
              <option value="">{tr("All statuses", "Barcha holatlar", "Р’СЃРµ СЃС‚Р°С‚СѓСЃС‹")}</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status, tr)}
                </option>
              ))}
            </Select>
            <Input
              placeholder={tr("Department ID", "Bo'lim ID", "ID РѕС‚РґРµР»Р°")}
              value={filterDraft.departmentId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, departmentId: event.target.value }))}
            />
            <Select
              value={filterDraft.buildingId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, buildingId: event.target.value }))}
            >
              <option value="">{tr("Building ID", "Bino ID", "ID Р·РґР°РЅРёСЏ")}</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.title || building.id}
                </option>
              ))}
              {filterDraft.buildingId && !buildings.some((building) => building.id === filterDraft.buildingId) ? (
                <option value={filterDraft.buildingId}>{filterDraft.buildingId}</option>
              ) : null}
            </Select>
            <Select
              value={filterDraft.categoryId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, categoryId: event.target.value }))}
            >
              <option value="">{tr("Category ID", "Kategoriya ID", "ID РєР°С‚РµРіРѕСЂРёРё")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title || category.id}
                </option>
              ))}
              {filterDraft.categoryId && !categories.some((category) => category.id === filterDraft.categoryId) ? (
                <option value={filterDraft.categoryId}>{filterDraft.categoryId}</option>
              ) : null}
            </Select>
            <Select
              value={filterDraft.offeringId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, offeringId: event.target.value }))}
            >
              <option value="">{tr("Offering ID", "Xizmat ID", "ID СѓСЃР»СѓРіРё")}</option>
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.title || offering.id}
                </option>
              ))}
              {filterDraft.offeringId && !offerings.some((offering) => offering.id === filterDraft.offeringId) ? (
                <option value={filterDraft.offeringId}>{filterDraft.offeringId}</option>
              ) : null}
            </Select>
            <Input
              placeholder={tr("Sender profile ID", "Yuboruvchi profile ID", "ID РїСЂРѕС„РёР»СЏ РѕС‚РїСЂР°РІРёС‚РµР»СЏ")}
              value={filterDraft.sendProfileId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, sendProfileId: event.target.value }))}
            />
            <Select
              value={filterDraft.acceptorProfileId}
              onChange={(event) => setFilterDraft((previous) => ({ ...previous, acceptorProfileId: event.target.value }))}
            >
              <option value="">{tr("Acceptor profile ID", "Qabul qiluvchi profile ID", "ID РїСЂРѕС„РёР»СЏ РїСЂРёРЅРёРјР°СЋС‰РµРіРѕ")}</option>
              {acceptors.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name || profile.surname
                    ? `${profile.name} ${profile.surname}`.trim()
                    : profile.username || profile.id}
                </option>
              ))}
              {filterDraft.acceptorProfileId && !acceptors.some((profile) => profile.id === filterDraft.acceptorProfileId) ? (
                <option value={filterDraft.acceptorProfileId}>{filterDraft.acceptorProfileId}</option>
              ) : null}
            </Select>
            {allMode ? (
              <>
                <Input
                  placeholder={tr("Application ID", "Ariza ID", "ID Р·Р°СЏРІРєРё")}
                  value={filterDraft.id}
                  onChange={(event) => setFilterDraft((previous) => ({ ...previous, id: event.target.value }))}
                />
                <Input
                  placeholder={tr("Description", "Tavsif", "РћРїРёСЃР°РЅРёРµ")}
                  value={filterDraft.description}
                  onChange={(event) => setFilterDraft((previous) => ({ ...previous, description: event.target.value }))}
                />
                <Input
                  placeholder={tr("KPI Ball", "KPI Ball", "KPI Р±Р°Р»Р»")}
                  value={filterDraft.kpiBall}
                  onChange={(event) => setFilterDraft((previous) => ({ ...previous, kpiBall: event.target.value }))}
                />
                <Input
                  placeholder={tr("KPI Ball Limit", "KPI Ball limiti", "Р›РёРјРёС‚ KPI Р±Р°Р»Р»Р°")}
                  value={filterDraft.kpiBallLimit}
                  onChange={(event) => setFilterDraft((previous) => ({ ...previous, kpiBallLimit: event.target.value }))}
                />
                <Input
                  placeholder={tr("Deadline", "Deadline", "Deadline")}
                  value={filterDraft.deadline}
                  onChange={(event) => setFilterDraft((previous) => ({ ...previous, deadline: event.target.value }))}
                />
                <Select
                  value={filterDraft.visible}
                  onChange={(event) =>
                    setFilterDraft((previous) => ({
                      ...previous,
                      visible: event.target.value as "" | "true" | "false",
                    }))
                  }
                >
                  <option value="">{tr("Visibility: all", "Ko'rinish: barchasi", "Р’РёРґРёРјРѕСЃС‚СЊ: РІСЃРµ")}</option>
                  <option value="true">{tr("Visible", "Ko'rinadigan", "Р’РёРґРёРјС‹Р№")}</option>
                  <option value="false">{tr("Hidden", "Yashirin", "РЎРєСЂС‹С‚С‹Р№")}</option>
                </Select>
                <div className="space-y-2 md:col-span-4">
                  <p className="text-sm font-medium">{tr("Date Ranges", "Sana oralig'i", "Р”РёР°РїР°Р·РѕРЅС‹ РґР°С‚")}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="created-date-from">{tr("Created date", "Yaratilgan sana", "Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="created-date-from">{tr("Start date", "Yaratilgan sana boshi", "Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ РЅР°С‡Р°Р»Рѕ")}</Label>
                          <Input id="created-date-from" type="date" value={filterDraft.createdDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, createdDateFrom: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="created-date-to">{tr("End date", "Yaratilgan sana oxiri", "Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ РєРѕРЅРµС†")}</Label>
                          <Input id="created-date-to" type="date" value={filterDraft.createdDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, createdDateTo: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="admin-checked-date-from">{tr("Admin checked date", "Admin tekshirgan sana", "Р”Р°С‚Р° РїСЂРѕРІРµСЂРєРё Р°РґРјРёРЅРѕРј")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="admin-checked-date-from">{tr("Start date", "Admin tekshirgan sana boshi", "Р”Р°С‚Р° РїСЂРѕРІРµСЂРєРё РЅР°С‡Р°Р»Рѕ")}</Label>
                          <Input id="admin-checked-date-from" type="date" value={filterDraft.adminCheckedDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, adminCheckedDateFrom: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="admin-checked-date-to">{tr("End date", "Admin tekshirgan sana oxiri", "Р”Р°С‚Р° РїСЂРѕРІРµСЂРєРё РєРѕРЅРµС†")}</Label>
                          <Input id="admin-checked-date-to" type="date" value={filterDraft.adminCheckedDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, adminCheckedDateTo: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="employee-approved-date-from">{tr("Employee approved date", "Xodim tasdiqlagan sana", "Р”Р°С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ СЃРѕС‚СЂСѓРґРЅРёРєРѕРј")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="employee-approved-date-from">{tr("Start date", "Xodim tasdiqlagan sana boshi", "Р”Р°С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РЅР°С‡Р°Р»Рѕ")}</Label>
                          <Input id="employee-approved-date-from" type="date" value={filterDraft.employeeApprovedDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeApprovedDateFrom: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="employee-approved-date-to">{tr("End date", "Xodim tasdiqlagan sana oxiri", "Р”Р°С‚Р° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ РєРѕРЅРµС†")}</Label>
                          <Input id="employee-approved-date-to" type="date" value={filterDraft.employeeApprovedDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeApprovedDateTo: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="employee-end-date-from">{tr("Employee end date", "Xodim yakunlagan sana", "Р”Р°С‚Р° Р·Р°РІРµСЂС€РµРЅРёСЏ СЃРѕС‚СЂСѓРґРЅРёРєРѕРј")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="employee-end-date-from">{tr("Start date", "Xodim yakunlagan sana boshi", "Р”Р°С‚Р° Р·Р°РІРµСЂС€РµРЅРёСЏ РЅР°С‡Р°Р»Рѕ")}</Label>
                          <Input id="employee-end-date-from" type="date" value={filterDraft.employeeEndDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeEndDateFrom: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="employee-end-date-to">{tr("End date", "Xodim yakunlagan sana oxiri", "Р”Р°С‚Р° Р·Р°РІРµСЂС€РµРЅРёСЏ РєРѕРЅРµС†")}</Label>
                          <Input id="employee-end-date-to" type="date" value={filterDraft.employeeEndDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, employeeEndDateTo: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="limit-date-from">{tr("Limit date", "Limit sana", "Р›РёРјРёС‚РЅР°СЏ РґР°С‚Р°")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="limit-date-from">{tr("Start date", "Limit sana boshi", "Р›РёРјРёС‚ РґР°С‚Р° РЅР°С‡Р°Р»Рѕ")}</Label>
                          <Input id="limit-date-from" type="date" value={filterDraft.limitDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, limitDateFrom: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="limit-date-to">{tr("End date", "Limit sana oxiri", "Р›РёРјРёС‚ РґР°С‚Р° РєРѕРЅРµС†")}</Label>
                          <Input id="limit-date-to" type="date" value={filterDraft.limitDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, limitDateTo: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="updated-date-from">{tr("Updated date", "Yangilangan sana", "Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ")}</Label>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="updated-date-from">{tr("Start date", "Yangilangan sana boshi", "Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ РЅР°С‡Р°Р»Рѕ")}</Label>
                          <Input id="updated-date-from" type="date" value={filterDraft.updatedDateFrom} onChange={(event) => setFilterDraft((previous) => ({ ...previous, updatedDateFrom: event.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="updated-date-to">{tr("End date", "Yangilangan sana oxiri", "Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ РєРѕРЅРµС†")}</Label>
                          <Input id="updated-date-to" type="date" value={filterDraft.updatedDateTo} onChange={(event) => setFilterDraft((previous) => ({ ...previous, updatedDateTo: event.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </div>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setAllMode((previous) => !previous)}
              >
                {allMode
                  ? tr("Full filter", "To'liq filter", "РџРѕР»РЅС‹Р№ С„РёР»СЊС‚СЂ")
                  : tr("Default filter", "Standart filter", "РЎС‚Р°РЅРґР°СЂС‚РЅС‹Р№ С„РёР»СЊС‚СЂ")}
              </Button>
              <Badge variant={filterMode ? "yellow" : "neutral"}>
                {filterMode ? tr("Filter applied", "Filtr qo'llangan", "Р¤РёР»СЊС‚СЂ РїСЂРёРјРµРЅРµРЅ") : tr("No filter", "Filtr yo'q", "Р‘РµР· С„РёР»СЊС‚СЂР°")}
              </Badge>
            </div>
            {buildingsForSelectQuery.isLoading || categoriesForSelectQuery.isLoading || offeringsForSelectQuery.isLoading || acceptorsForSelectQuery.isLoading ? (
              <div className="md:col-span-4">
                <Message type="info">
                  {tr(
                    "Loading buildings, categories, services and acceptors...",
                    "Binolar, kategoriyalar, xizmatlar va qabul qiluvchilar yuklanmoqda...",
                    "Р—Р°РіСЂСѓР·РєР° Р·РґР°РЅРёР№, РєР°С‚РµРіРѕСЂРёР№, СѓСЃР»СѓРі Рё РїСЂРёРЅРёРјР°СЋС‰РёС…...",
                  )}
                </Message>
              </div>
            ) : null}
            {buildingsForSelectQuery.isError || categoriesForSelectQuery.isError || offeringsForSelectQuery.isError || acceptorsForSelectQuery.isError ? (
              <div className="md:col-span-4">
                <Message type="error">
                  {tr(
                    "Failed to load select options.",
                    "Select variantlarini yuklab bo'lmadi.",
                    "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РІР°СЂРёР°РЅС‚С‹ РґР»СЏ select.",
                  )}
                </Message>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Applications", "Arizalar", "Р—Р°СЏРІРєРё")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Р’СЃРµРіРѕ")}: {totalElements} | {tr("Page", "Sahifa", "РЎС‚СЂР°РЅРёС†Р°")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionMessage ? <Message type="success">{actionMessage}</Message> : null}
          {actionError ? <Message type="error">{actionError}</Message> : null}

          {applicationsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading applications...", "Arizalar yuklanmoqda...", "Р—Р°РіСЂСѓР·РєР° Р·Р°СЏРІРѕРє...")}
              </span>
            </Message>
          ) : null}
          {applicationsQuery.isError ? (
            <Message type="error">
              {applicationsQuery.error instanceof Error
                ? applicationsQuery.error.message
                : tr("Failed to load applications.", "Arizalarni yuklab bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р·Р°СЏРІРєРё.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "РќР°Р·РІР°РЅРёРµ")}</th>
                  <th className="px-3 py-2">{tr("Status", "Holat", "РЎС‚Р°С‚СѓСЃ")}</th>
                  <th className="px-3 py-2">KPI</th>
                  <th className="px-3 py-2">KPI Limit</th>
                  <th className="px-3 py-2">{tr("Sender", "Yuboruvchi", "РћС‚РїСЂР°РІРёС‚РµР»СЊ")}</th>
                  <th className="px-3 py-2">{tr("Acceptor", "Qabul qiluvchi", "РџСЂРёРЅРёРјР°СЋС‰РёР№")}</th>
                  <th className="px-3 py-2">{tr("Department", "Bo'lim", "РћС‚РґРµР»")}</th>
                  <th className="px-3 py-2">{tr("Building", "Bino", "Р—РґР°РЅРёРµ")}</th>
                  <th className="px-3 py-2">{tr("Category", "Kategoriya", "РљР°С‚РµРіРѕСЂРёСЏ")}</th>
                  <th className="px-3 py-2">{tr("Service", "Xizmat", "РЈСЃР»СѓРіР°")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "РЎРѕР·РґР°РЅРѕ")}</th>
                  <th className="px-3 py-2">{tr("Actions", "Amallar", "Р”РµР№СЃС‚РІРёСЏ")}</th>
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
                      <Badge variant={getStatusVariant(application.status)}>
                        {application.status ? statusLabel(application.status, tr) : "-"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{application.kpiBall ?? "-"}</td>
                    <td className="px-3 py-2">{application.kpiBallLimit ?? "-"}</td>
                    <td className="px-3 py-2">{application.sendProfileFullName || application.sendProfileId || "-"}</td>
                    <td className="px-3 py-2">{application.acceptorProfileFullName || application.acceptorProfileId || "-"}</td>
                    <td className="px-3 py-2">{application.departmentTitle || application.departmentId || "-"}</td>
                    <td className="px-3 py-2">{application.buildingTitle || application.buildingId || "-"}</td>
                    <td className="px-3 py-2">{application.categoryTitle || application.categoryId || "-"}</td>
                    <td className="px-3 py-2">{application.offeringTitle || application.offeringId || "-"}</td>
                    <td className="px-3 py-2">{application.createdDate || "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-[16rem] items-center gap-2">
                        <Select
                          value={pickStatus(application)}
                          onChange={(event) =>
                            setStatusMap((previous) => ({
                              ...previous,
                              [application.id]: event.target.value as ApplicationStatus,
                            }))
                          }
                        >
                          {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status, tr)}
                            </option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => saveStatus(application)}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : (
                            <CheckCircle2 className="size-4" aria-hidden />
                          )}
                          {tr("Save status", "Holatni saqlash", "РЎРѕС…СЂР°РЅРёС‚СЊ СЃС‚Р°С‚СѓСЃ")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!applicationsQuery.isLoading && applications.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={12}>
                      {tr("No applications found.", "Arizalar topilmadi.", "Р—Р°СЏРІРєРё РЅРµ РЅР°Р№РґРµРЅС‹.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="applications-page-size">
              {tr("Page size", "Sahifa hajmi", "Р Р°Р·РјРµСЂ СЃС‚СЂР°РЅРёС†С‹")}
            </Label>
            <Select
              id="applications-page-size"
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
                {tr("Previous", "Oldingi", "РќР°Р·Р°Рґ")}
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
                {tr("Next", "Keyingi", "Р’РїРµСЂРµРґ")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

