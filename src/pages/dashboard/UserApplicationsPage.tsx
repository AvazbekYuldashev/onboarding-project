import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, FileText, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getMyApplications, updateMyApplicationStatus } from "@/api/applicationCoreApi";
import { getBuildingById } from "@/api/buildingCoreApi";
import { getCategoryById } from "@/api/categoryCoreApi";
import { getDepartmentById } from "@/api/departmentCoreApi";
import { getEmployeeById } from "@/api/employeeCoreApi";
import { getOfferingById } from "@/api/offeringCoreApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/messages";
import type { ApplicationResponseDTO, ApplicationStatus } from "@/types/applicationOwner";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "SENT",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "REVIEW",
  "DENIED",
  "COMPLETED",
];

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

function statusLabel(status: ApplicationStatus | undefined, tr: (en: string, uz: string, ru: string) => string): string {
  if (status === "SENT") return tr("Sent", "Yuborilgan", "Отправлена");
  if (status === "APPROVED") return tr("Approved", "Tasdiqlangan", "Одобрена");
  if (status === "REJECTED") return tr("Rejected", "Rad etilgan", "Отклонена");
  if (status === "IN_PROGRESS") return tr("In progress", "Jarayonda", "В процессе");
  if (status === "REVIEW") return tr("Review", "Ko'rib chiqildi", "На проверке");
  if (status === "DENIED") return tr("Denied", "Bekor qilingan", "Отказано");
  if (status === "COMPLETED") return tr("Completed", "Yakunlangan", "Завершена");
  return "-";
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

export function UserApplicationsPage() {
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationResponseDTO | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, ApplicationStatus>>({});
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const applicationsQuery = useQuery({
    queryKey: ["user-applications", page, size],
    queryFn: () => getMyApplications(page, size),
    staleTime: 30_000,
  });
  const updateStatusMutation = useMutation({
    mutationFn: updateMyApplicationStatus,
    onSuccess: (message) => {
      setActionError("");
      setActionMessage(message);
      queryClient.invalidateQueries({ queryKey: ["user-applications"] });
    },
    onError: (error) => {
      setActionMessage("");
      setActionError(
        error instanceof Error
          ? error.message
          : tr(
              "Failed to update application status.",
              "Ariza holatini yangilab bo'lmadi.",
              "Не удалось обновить статус заявки.",
            ),
      );
    },
  });

  const departmentDetailQuery = useQuery({
    queryKey: ["user-application-department", selectedApplication?.departmentId],
    queryFn: () => getDepartmentById(selectedApplication?.departmentId ?? ""),
    enabled: Boolean(selectedApplication?.departmentId),
    retry: false,
  });
  const buildingDetailQuery = useQuery({
    queryKey: ["user-application-building", selectedApplication?.buildingId],
    queryFn: () => getBuildingById(selectedApplication?.buildingId ?? ""),
    enabled: Boolean(selectedApplication?.buildingId),
    retry: false,
  });
  const categoryDetailQuery = useQuery({
    queryKey: ["user-application-category", selectedApplication?.categoryId],
    queryFn: () => getCategoryById(selectedApplication?.categoryId ?? ""),
    enabled: Boolean(selectedApplication?.categoryId),
    retry: false,
  });
  const offeringDetailQuery = useQuery({
    queryKey: ["user-application-offering", selectedApplication?.offeringId],
    queryFn: () => getOfferingById(selectedApplication?.offeringId ?? ""),
    enabled: Boolean(selectedApplication?.offeringId),
    retry: false,
  });
  const senderDetailQuery = useQuery({
    queryKey: ["user-application-sender", selectedApplication?.sendProfileId],
    queryFn: () => getEmployeeById(selectedApplication?.sendProfileId ?? ""),
    enabled: Boolean(selectedApplication?.sendProfileId),
    retry: false,
  });
  const acceptorDetailQuery = useQuery({
    queryKey: ["user-application-acceptor", selectedApplication?.acceptorProfileId],
    queryFn: () => getEmployeeById(selectedApplication?.acceptorProfileId ?? ""),
    enabled: Boolean(selectedApplication?.acceptorProfileId),
    retry: false,
  });

  const applications = applicationsQuery.data?.content ?? [];
  const categoryIdsToResolve = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .filter((application) => !application.categoryTitle && application.categoryId)
            .map((application) => application.categoryId as string),
        ),
      ),
    [applications],
  );
  const unresolvedCategoryQueries = useQueries({
    queries: categoryIdsToResolve.map((categoryId) => ({
      queryKey: ["user-application-category-row", categoryId],
      queryFn: () => getCategoryById(categoryId),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const categoryTitleById = useMemo(() => {
    const map = new Map<string, string>();
    categoryIdsToResolve.forEach((categoryId, index) => {
      const title = unresolvedCategoryQueries[index]?.data?.title;
      if (title) {
        map.set(categoryId, title);
      }
    });
    return map;
  }, [categoryIdsToResolve, unresolvedCategoryQueries]);
  const offeringIdsToResolve = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .filter((application) => !application.offeringTitle && application.offeringId)
            .map((application) => application.offeringId as string),
        ),
      ),
    [applications],
  );
  const unresolvedOfferingQueries = useQueries({
    queries: offeringIdsToResolve.map((offeringId) => ({
      queryKey: ["user-application-offering-row", offeringId],
      queryFn: () => getOfferingById(offeringId),
      staleTime: 60_000,
      retry: false,
    })),
  });
  const offeringTitleById = useMemo(() => {
    const map = new Map<string, string>();
    offeringIdsToResolve.forEach((offeringId, index) => {
      const title = unresolvedOfferingQueries[index]?.data?.title;
      if (title) {
        map.set(offeringId, title);
      }
    });
    return map;
  }, [offeringIdsToResolve, unresolvedOfferingQueries]);
  const totalPages = Math.max(applicationsQuery.data?.totalPages ?? 1, 1);
  const totalElements = applicationsQuery.data?.totalElements ?? 0;

  const pickStatus = (application: ApplicationResponseDTO): ApplicationStatus => {
    const selected = statusMap[application.id];
    return selected ?? application.status ?? "SENT";
  };
  const saveStatus = (application: ApplicationResponseDTO) => {
    const id = application.id.trim();
    if (!id) {
      setActionMessage("");
      setActionError(tr("Application id is required.", "Ariza id majburiy.", "Требуется id заявки."));
      return;
    }
    updateStatusMutation.mutate({ id, status: pickStatus(application) });
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
            {tr("Your applications list.", "Sizning arizalaringiz ro'yxati.", "Список ваших заявок.")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("applications")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionMessage ? <Message type="success">{actionMessage}</Message> : null}
          {actionError ? <Message type="error">{actionError}</Message> : null}
          {applicationsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading applications...", "Arizalar yuklanmoqda...", "Загрузка заявок...")}
              </span>
            </Message>
          ) : null}
          {applicationsQuery.isError ? (
            <Message type="error">
              {applicationsQuery.error instanceof Error
                ? applicationsQuery.error.message
                : tr("Failed to load applications.", "Arizalarni yuklab bo'lmadi.", "Не удалось загрузить заявки.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Status", "Holat", "Статус")}</th>
                  <th className="px-3 py-2">{tr("Change status", "Holatni o'zgartirish", "Изменить статус")}</th>
                  <th className="px-3 py-2">{tr("Category", "Kategoriya", "Категория")}</th>
                  <th className="px-3 py-2">{tr("Service", "Xizmat", "Услуга")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Создано")}</th>
                  <th className="px-3 py-2">{tr("Action", "Amal", "Действие")}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{application.title || "-"}</td>
                    <td className="px-3 py-2">{statusLabel(application.status, tr)}</td>
                    <td className="px-3 py-2">
                      <div className="flex min-w-[14rem] items-center gap-2">
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
                          {tr("Save", "Saqlash", "Сохранить")}
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2">{application.categoryTitle || (application.categoryId ? categoryTitleById.get(application.categoryId) ?? application.categoryId : "-")}</td>
                    <td className="px-3 py-2">{application.offeringTitle || (application.offeringId ? offeringTitleById.get(application.offeringId) ?? application.offeringId : "-")}</td>
                    <td className="px-3 py-2">{formatDateTime(application.createdDate)}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelectedApplication(application)}>
                        <Eye className="size-4" aria-hidden />
                        {tr("Details", "Batafsil", "Подробнее")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!applicationsQuery.isLoading && applications.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>
                      {tr("No applications found.", "Arizalar topilmadi.", "Заявки не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="user-applications-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="user-applications-page-size"
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
              <Button type="button" variant="outline" disabled={page <= 1 || applicationsQuery.isFetching} onClick={() => setPage((previous) => Math.max(previous - 1, 1))}>
                {tr("Previous", "Oldingi", "Назад")}
              </Button>
              <Badge variant="neutral">{page}/{totalPages}</Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || applicationsQuery.isFetching}
                onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              >
                {tr("Next", "Keyingi", "Вперед")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedApplication ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Application Details", "Ariza tafsilotlari", "Детали заявки")}</CardTitle>
                <CardDescription>{selectedApplication.title || "-"}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedApplication(null)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              <DetailItem label="ID" value={selectedApplication.id || "-"} mono />
              <DetailItem label={tr("Status", "Holat", "Статус")} value={statusLabel(selectedApplication.status, tr)} />
              <div className="md:col-span-2">
                <DetailItem label={tr("Description", "Tavsif", "Описание")} value={selectedApplication.description || "-"} />
              </div>
              <DetailItem label="Deadline" value={selectedApplication.deadline !== undefined && selectedApplication.deadline !== null ? `${selectedApplication.deadline} soat` : "-"} />
              <DetailItem
                label={tr("Sender", "Yuboruvchi", "Отправитель")}
                value={
                  selectedApplication.sendProfileFullName ||
                  `${senderDetailQuery.data?.name || ""} ${senderDetailQuery.data?.surname || ""}`.trim() ||
                  "-"
                }
              />
              <DetailItem
                label={tr("Acceptor", "Qabul qiluvchi", "Принимающий")}
                value={
                  selectedApplication.acceptorProfileFullName ||
                  `${acceptorDetailQuery.data?.name || ""} ${acceptorDetailQuery.data?.surname || ""}`.trim() ||
                  "-"
                }
              />
              <DetailItem
                label={tr("Department", "Bo'lim", "Отдел")}
                value={selectedApplication.departmentTitle || departmentDetailQuery.data?.title || "-"}
              />
              <DetailItem
                label={tr("Building", "Bino", "Здание")}
                value={selectedApplication.buildingTitle || buildingDetailQuery.data?.title || "-"}
              />
              <DetailItem
                label={tr("Category", "Kategoriya", "Категория")}
                value={selectedApplication.categoryTitle || categoryDetailQuery.data?.title || "-"}
              />
              <DetailItem
                label={tr("Service", "Xizmat", "Услуга")}
                value={selectedApplication.offeringTitle || offeringDetailQuery.data?.title || "-"}
              />
              <DetailItem label={tr("Created", "Yaratilgan", "Создано")} value={formatDateTime(selectedApplication.createdDate)} />
              <DetailItem label="Updated" value={formatDateTime(selectedApplication.updatedDate)} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
