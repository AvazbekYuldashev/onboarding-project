import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, PlusCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createApplication } from "@/api/applicationCoreApi";
import { getBuildingsByDepartment } from "@/api/buildingCoreApi";
import { getCategoriesByBuilding } from "@/api/categoryCoreApi";
import { getAllCoreDepartments } from "@/api/departmentCoreApi";
import { getOfferingsByCategory } from "@/api/offeringCoreApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/messages";
import type { ApplicationCreateDTO } from "@/types/applicationOwner";

function Message({
  type,
  children,
}: {
  type: "error" | "info" | "success";
  children: React.ReactNode;
}) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : type === "success"
        ? "border-success/40 bg-success/10 text-success"
        : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;


















}

interface FilterState {
  departmentId: string;
  buildingId: string;
  categoryId: string;
}

interface ApplicationModalState {
  offeringId: string;
  offeringTitle: string;
  title: string;
  description: string;
  comments: string;
}

const APPLICATION_TITLE_OPTIONS = [
  "ARIZA",
  "TALABNOMA",
  "ILTIMOSNOMA",
  "SHIKOYAT",
  "TAKLIF",
] as const;

const defaultFilterState: FilterState = {
  departmentId: "",
  buildingId: "",
  categoryId: "",
};

const defaultApplicationModalState: ApplicationModalState = {
  offeringId: "",
  offeringTitle: "",
  title: "",
  description: "",
  comments: "",
};

export function UserOfferingsPage() {
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState<ApplicationModalState>(defaultApplicationModalState);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const departmentsQuery = useQuery({
    queryKey: ["department", "all", "user-offerings"],
    queryFn: () => getAllCoreDepartments(1, 200),
    staleTime: 60_000,
  });

  const departments = departmentsQuery.data?.content ?? [];
  const selectedDepartmentId = filters.departmentId;

  const buildingsQuery = useQuery({
    queryKey: ["user-offerings-buildings", selectedDepartmentId],
    queryFn: () => getBuildingsByDepartment(selectedDepartmentId, 1, 200),
    enabled: Boolean(selectedDepartmentId),
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["user-offerings-categories", filters.buildingId],
    queryFn: () => getCategoriesByBuilding(filters.buildingId, 1, 200),
    enabled: Boolean(filters.buildingId),
    staleTime: 60_000,
  });

  const offeringsQuery = useQuery({
    queryKey: ["user-offerings-filtered", selectedDepartmentId, filters.buildingId, filters.categoryId, page, size],
    queryFn: async () => {
      if (!selectedDepartmentId || !filters.buildingId || !filters.categoryId) {
        return { content: [], totalElements: 0, totalPages: 1, number: 0, size };
      }
      return getOfferingsByCategory(filters.categoryId, page, size);
    },
    enabled: Boolean(selectedDepartmentId && filters.buildingId && filters.categoryId),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(
        tr(
          `Application created: ${created.title || created.id}`,
          `Ariza yaratildi: ${created.title || created.id}`,
          `Р—Р°СЏРІРєР° СЃРѕР·РґР°РЅР°: ${created.title || created.id}`,
        ),
      );
      setIsModalOpen(false);
      setModalState(defaultApplicationModalState);
      queryClient.invalidateQueries({ queryKey: ["user-applications"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(
        error instanceof Error
          ? error.message
          : tr("Failed to create application.", "Ariza yaratib bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р·Р°СЏРІРєСѓ."),
      );
    },
  });

  const buildings = buildingsQuery.data?.content ?? [];
  const categories = categoriesQuery.data?.content ?? [];
  const offeringsRaw = offeringsQuery.data?.content ?? [];
  const offerings = useMemo(
    () =>
      offeringsRaw.filter(
        (item) => item.departmentId === selectedDepartmentId && item.buildingId === filters.buildingId,
      ),
    [offeringsRaw, selectedDepartmentId, filters.buildingId],
  );
  const selectedDepartmentTitle = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId)?.title ?? selectedDepartmentId,
    [departments, selectedDepartmentId],
  );
  const selectedBuildingTitle = useMemo(
    () => buildings.find((building) => building.id === filters.buildingId)?.title ?? filters.buildingId,
    [buildings, filters.buildingId],
  );
  const selectedCategoryTitle = useMemo(
    () => categories.find((category) => category.id === filters.categoryId)?.title ?? filters.categoryId,
    [categories, filters.categoryId],
  );
  const totalPages = Math.max(offeringsQuery.data?.totalPages ?? 1, 1);
  const totalElements = offerings.length;

  const openModal = (offeringId: string, offeringTitle: string) => {
    setCreateMessage("");
    setCreateError("");
    setModalState({
      offeringId,
      offeringTitle,
      title: "",
      description: "",
      comments: "",
    });
    setIsModalOpen(true);
  };

  const submitApplication = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !modalState.title.trim() ||
      !modalState.description.trim() ||
      !modalState.comments.trim() ||
      !selectedDepartmentId ||
      !filters.buildingId ||
      !filters.categoryId ||
      !modalState.offeringId
    ) {
      setCreateMessage("");
      setCreateError(
        tr(
          "Title, description, comments, department, building, category and service are required.",
          "Nomi, tavsif, izoh, bo'lim, bino, kategoriya va xizmat majburiy.",
          "РќР°Р·РІР°РЅРёРµ, РѕРїРёСЃР°РЅРёРµ, РєРѕРјРјРµРЅС‚Р°СЂРёР№, РѕС‚РґРµР», Р·РґР°РЅРёРµ, РєР°С‚РµРіРѕСЂРёСЏ Рё СѓСЃР»СѓРіР° РѕР±СЏР·Р°С‚РµР»СЊРЅС‹.",
        ),
      );
      return;
    }

    const payload: ApplicationCreateDTO = {
      title: modalState.title.trim(),
      description: modalState.description.trim(),
      comments: modalState.comments.trim(),
      departmentId: selectedDepartmentId,
      buildingId: filters.buildingId,
      categoryId: filters.categoryId,
      offeringId: modalState.offeringId,
    };

    createMutation.mutate(payload);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("offerings")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Select department, building and category to load services.", "Xizmatlarni ko'rish uchun bo'lim, bino va kategoriyani tanlang.", "Р’С‹Р±РµСЂРёС‚Рµ РѕС‚РґРµР», Р·РґР°РЅРёРµ Рё РєР°С‚РµРіРѕСЂРёСЋ РґР»СЏ Р·Р°РіСЂСѓР·РєРё СѓСЃР»СѓРі.")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Filters", "Filtrlar", "Р¤РёР»СЊС‚СЂС‹")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {departmentsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading departments...", "Bo'limlar yuklanmoqda...", "Р—Р°РіСЂСѓР·РєР° РѕС‚РґРµР»РѕРІ...")}
              </span>
            </Message>
          ) : null}
          {departmentsQuery.isError ? (
            <Message type="error">
              {departmentsQuery.error instanceof Error
                ? departmentsQuery.error.message
                : tr("Failed to load departments.", "Bo'limlarni yuklab bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕС‚РґРµР»С‹.")}
            </Message>
          ) : null}

          <Select
            value={selectedDepartmentId}
            onChange={(event) => {
              setFilters({
                departmentId: event.target.value,
                buildingId: "",
                categoryId: "",
              });
              setPage(1);
            }}
          >
            <option value="">{tr("Select department", "Bo'limni tanlang", "Р’С‹Р±РµСЂРёС‚Рµ РѕС‚РґРµР»")}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.title || department.id}
              </option>
            ))}
          </Select>

          <Select
            value={filters.buildingId}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, buildingId: event.target.value, categoryId: "" }));
              setPage(1);
            }}
            disabled={!selectedDepartmentId}
          >
            <option value="">{tr("Select building", "Binoni tanlang", "Р’С‹Р±РµСЂРёС‚Рµ Р·РґР°РЅРёРµ")}</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.title || building.id}
              </option>
            ))}
          </Select>

          <Select
            value={filters.categoryId}
            onChange={(event) => {
              setFilters((prev) => ({ ...prev, categoryId: event.target.value }));
              setPage(1);
            }}
            disabled={!selectedDepartmentId || !filters.buildingId}
          >
            <option value="">{tr("Select category", "Kategoriyani tanlang", "Р’С‹Р±РµСЂРёС‚Рµ РєР°С‚РµРіРѕСЂРёСЋ")}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title || category.id}
              </option>
            ))}
          </Select>
          <div className="md:col-span-3 space-y-2">
            {createMessage ? <Message type="success">{createMessage}</Message> : null}
            {createError ? <Message type="error">{createError}</Message> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("offerings")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Р’СЃРµРіРѕ")}: {totalElements} | {tr("Page", "Sahifa", "РЎС‚СЂР°РЅРёС†Р°")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offeringsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading offerings...", "Xizmatlar yuklanmoqda...", "Р—Р°РіСЂСѓР·РєР° СѓСЃР»СѓРі...")}
              </span>
            </Message>
          ) : null}
          {offeringsQuery.isError ? (
            <Message type="error">
              {offeringsQuery.error instanceof Error ? offeringsQuery.error.message : tr("Failed to load offerings.", "Xizmatlarni yuklab bo'lmadi.", "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СѓСЃР»СѓРіРё.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "РќР°Р·РІР°РЅРёРµ")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "РћРїРёСЃР°РЅРёРµ")}</th>
                  <th className="px-3 py-2">KPI</th>
                  <th className="px-3 py-2">Deadline</th>
                  <th className="px-3 py-2">{tr("Action", "Amal", "Р”РµР№СЃС‚РІРёРµ")}</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((offering) => (
                  <tr key={offering.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{offering.title || "-"}</td>
                    <td className="px-3 py-2">{offering.description || "-"}</td>
                    <td className="px-3 py-2">{offering.kpiBall ?? "-"}</td>
                    <td className="px-3 py-2">{offering.deadline !== undefined && offering.deadline !== null ? `${offering.deadline} soat` : "-"}</td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openModal(offering.id, offering.title || offering.id)}
                      >
                        <PlusCircle className="size-4" aria-hidden />
                        {tr("Leave application", "Ariza qoldirish", "РћСЃС‚Р°РІРёС‚СЊ Р·Р°СЏРІРєСѓ")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!offeringsQuery.isLoading && offerings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                      {tr("No offerings found.", "Xizmatlar topilmadi.", "РЈСЃР»СѓРіРё РЅРµ РЅР°Р№РґРµРЅС‹.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="user-offerings-page-size">{tr("Page size", "Sahifa hajmi", "Р Р°Р·РјРµСЂ СЃС‚СЂР°РЅРёС†С‹")}</Label>
            <Select
              id="user-offerings-page-size"
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
              <Button type="button" variant="outline" disabled={page <= 1 || offeringsQuery.isFetching} onClick={() => setPage((previous) => Math.max(previous - 1, 1))}>
                {tr("Previous", "Oldingi", "РќР°Р·Р°Рґ")}
              </Button>
              <Badge variant="neutral">
                {page}/{totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || offeringsQuery.isFetching}
                onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              >
                {tr("Next", "Keyingi", "Р’РїРµСЂРµРґ")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Create Application", "Ariza yaratish", "РЎРѕР·РґР°С‚СЊ Р·Р°СЏРІРєСѓ")}</CardTitle>
                <CardDescription>
                  {tr("Service", "Xizmat", "РЈСЃР»СѓРіР°")}: {modalState.offeringTitle}
                </CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={submitApplication}>
                <Select
                  value={modalState.title}
                  onChange={(event) => setModalState((prev) => ({ ...prev, title: event.target.value }))}
                >
                  <option value="">{tr("Select application type", "Ariza turini tanlang", "Выберите тип заявки")}</option>
                  {APPLICATION_TITLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <textarea
                  placeholder={tr("Description", "Tavsif", "РћРїРёСЃР°РЅРёРµ")}
                  value={modalState.description}
                  onChange={(event) => setModalState((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <textarea
                  placeholder={tr(
                    "Please include your details and your department/chair/dean's office.",
                    "Iltimos, o'zingiz haqingizda ma'lumot qoldiring va qaysi bo'lim/kafedra/dekanat ekaningizni yozing. Arizangizni olganimizdan so'ng siz bilan bog'lanishimiz uchun bu kerak.",
                    "РџРѕР¶Р°Р»СѓР№СЃС‚Р°, СѓРєР°Р¶РёС‚Рµ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ СЃРµР±Рµ Рё РЅР°РїРёС€РёС‚Рµ, Рє РєР°РєРѕРјСѓ РѕС‚РґРµР»Сѓ/РєР°С„РµРґСЂРµ/РґРµРєР°РЅР°С‚Сѓ РІС‹ РѕС‚РЅРѕСЃРёС‚РµСЃСЊ. Р­С‚Рѕ РЅСѓР¶РЅРѕ, С‡С‚РѕР±С‹ РјС‹ РјРѕРіР»Рё СЃРІСЏР·Р°С‚СЊСЃСЏ СЃ РІР°РјРё РїРѕСЃР»Рµ РїРѕР»СѓС‡РµРЅРёСЏ Р·Р°СЏРІРєРё.",
                  )}
                  value={modalState.comments}
                  onChange={(event) => setModalState((prev) => ({ ...prev, comments: event.target.value }))}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                  <div>{tr("Department", "Bo'lim", "Отдел")}: {selectedDepartmentTitle || "-"}</div>
                  <div>{tr("Building", "Bino", "Здание")}: {selectedBuildingTitle || "-"}</div>
                  <div>{tr("Category", "Kategoriya", "Категория")}: {selectedCategoryTitle || "-"}</div>
                  <div>{tr("Offering", "Xizmat", "Услуга")}: {modalState.offeringTitle || modalState.offeringId || "-"}</div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PlusCircle className="size-4" aria-hidden />}
                    {tr("Send application", "Ariza yuborish", "РћС‚РїСЂР°РІРёС‚СЊ Р·Р°СЏРІРєСѓ")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    {tr("Cancel", "Bekor qilish", "РћС‚РјРµРЅР°")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}


