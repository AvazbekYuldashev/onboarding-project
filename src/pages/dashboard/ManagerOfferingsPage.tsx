import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Pencil, PlusCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getBuildingsByDepartment } from "@/api/buildingCoreApi";
import { getCategoriesByDepartment } from "@/api/categoryCoreApi";
import { getOfferingById, getOfferingsByDepartment } from "@/api/offeringCoreApi";
import { createManagerOffering, updateManagerOffering } from "@/api/offeringManagerApi";
import { getMyProfile } from "@/api/profileApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { OfferingManagerCreateDTO, OfferingManagerUpdateDTO } from "@/types/offeringManager";
import type { OfferingResponseDTO } from "@/types/offeringOwner";

interface CreateFormState {
  title: string;
  description: string;
  kpiBall: string;
  deadline: string;
  categoryId: string;
  buildingId: string;
}

interface UpdateFormState {
  id: string;
  title: string;
  description: string;
  kpiBall: string;
  deadline: string;
  categoryId: string;
  buildingId: string;
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

const defaultCreateForm: CreateFormState = {
  title: "",
  description: "",
  kpiBall: "",
  deadline: "",
  categoryId: "",
  buildingId: "",
};

const defaultUpdateForm: UpdateFormState = {
  id: "",
  title: "",
  description: "",
  kpiBall: "",
  deadline: "",
  categoryId: "",
  buildingId: "",
};

export function ManagerOfferingsPage() {
  const session = useAuthStore((state) => state.session);
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [updateForm, setUpdateForm] = useState<UpdateFormState>(defaultUpdateForm);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", "me", "manager-offerings"],
    queryFn: getMyProfile,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const departmentId = session?.departmentId?.trim() || profileQuery.data?.departmentId?.trim() || "";

  const offeringsQuery = useQuery({
    queryKey: ["manager-offerings", departmentId, page, size],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size };
      return getOfferingsByDepartment(departmentId, page, size);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 30_000,
  });

  const categoriesForSelectQuery = useQuery({
    queryKey: ["manager-offerings-categories-select", departmentId],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size: 200 };
      return getCategoriesByDepartment(departmentId, 1, 200);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 60_000,
  });

  const buildingsForSelectQuery = useQuery({
    queryKey: ["manager-offerings-buildings-select", departmentId],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size: 200 };
      return getBuildingsByDepartment(departmentId, 1, 200);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 60_000,
  });

  const offerings = offeringsQuery.data?.content ?? [];
  const categories = categoriesForSelectQuery.data?.content ?? [];
  const buildings = buildingsForSelectQuery.data?.content ?? [];
  const totalPages = Math.max(offeringsQuery.data?.totalPages ?? 1, 1);
  const totalElements = offeringsQuery.data?.totalElements ?? 0;

  const createMutation = useMutation({
    mutationFn: createManagerOffering,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(tr(`Offering created: ${created.title}`, `Xizmat yaratildi: ${created.title}`, `Услуга создана: ${created.title}`));
      setCreateForm(defaultCreateForm);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-offerings"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to create offering.", "Xizmatni yaratib bo'lmadi.", "Не удалось создать услугу."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateManagerOffering,
    onSuccess: (message) => {
      setUpdateError("");
      setUpdateMessage(message);
      setIsUpdateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-offerings"] });
    },
    onError: (error) => {
      setUpdateMessage("");
      setUpdateError(error instanceof Error ? error.message : tr("Failed to update offering.", "Xizmatni yangilab bo'lmadi.", "Не удалось обновить услугу."));
    },
  });

  useEffect(() => {
    if (!isCreateModalOpen && !isUpdateModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
        setIsUpdateModalOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateModalOpen, isUpdateModalOpen]);

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const kpiBall = Number(createForm.kpiBall.trim());
    const deadline = Number(createForm.deadline.trim());

    if (!createForm.title.trim() || !createForm.categoryId || !createForm.buildingId || !departmentId) {
      setCreateMessage("");
      setCreateError(tr("Title, category and building are required.", "Nomi, kategoriya va bino majburiy.", "Название, категория и здание обязательны."));
      return;
    }
    if (!Number.isFinite(kpiBall) || !Number.isFinite(deadline)) {
      setCreateMessage("");
      setCreateError(tr("KPI ball and deadline must be valid numbers.", "KPI ball va deadline to'g'ri raqam bo'lishi kerak.", "KPI балл и deadline должны быть корректными числами."));
      return;
    }

    const payload: OfferingManagerCreateDTO = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      kpiBall,
      deadline,
      categoryId: createForm.categoryId,
      buildingId: createForm.buildingId,
      departmentId,
    };
    createMutation.mutate(payload);
  };

  const openEditModal = async (offering: OfferingResponseDTO) => {
    setUpdateMessage("");
    setUpdateError("");
    try {
      const full = await getOfferingById(offering.id);
      setUpdateForm({
        id: full.id,
        title: full.title ?? "",
        description: full.description ?? "",
        kpiBall: full.kpiBall === undefined ? "" : String(full.kpiBall),
        deadline: full.deadline === undefined ? "" : String(full.deadline),
        categoryId: full.categoryId ?? "",
        buildingId: full.buildingId ?? "",
      });
    } catch {
      setUpdateForm({
        id: offering.id,
        title: offering.title ?? "",
        description: offering.description ?? "",
        kpiBall: offering.kpiBall === undefined ? "" : String(offering.kpiBall),
        deadline: offering.deadline === undefined ? "" : String(offering.deadline),
        categoryId: offering.categoryId ?? "",
        buildingId: offering.buildingId ?? "",
      });
    }
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const kpiBall = Number(updateForm.kpiBall.trim());
    const deadline = Number(updateForm.deadline.trim());

    if (!updateForm.id.trim() || !updateForm.title.trim() || !updateForm.categoryId || !updateForm.buildingId || !departmentId) {
      setUpdateMessage("");
      setUpdateError(tr("Id, title, category and building are required.", "Id, nomi, kategoriya va bino majburiy.", "Id, название, категория и здание обязательны."));
      return;
    }
    if (!Number.isFinite(kpiBall) || !Number.isFinite(deadline)) {
      setUpdateMessage("");
      setUpdateError(tr("KPI ball and deadline must be valid numbers.", "KPI ball va deadline to'g'ri raqam bo'lishi kerak.", "KPI балл и deadline должны быть корректными числами."));
      return;
    }

    const payload: OfferingManagerUpdateDTO = {
      id: updateForm.id.trim(),
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      kpiBall,
      deadline,
      categoryId: updateForm.categoryId,
      buildingId: updateForm.buildingId,
      departmentId,
    };
    updateMutation.mutate(payload);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("offerings")}</CardTitle>
          </div>
          <CardDescription>{tr("Manager services module.", "Menejer xizmatlar moduli.", "Модуль услуг менеджера.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {tr("Department ID from manager session/profile:", "Manager session/profile dan olingan department ID:", "Department ID из сессии/профиля менеджера:")}{" "}
            <Badge variant="neutral">{departmentId || "-"}</Badge>
          </p>
          {!profileQuery.isLoading && !departmentId ? <Message type="error">Manager session has no departmentId.</Message> : null}
          {createMessage ? <Message type="success">{createMessage}</Message> : null}
          {updateMessage ? <Message type="success">{updateMessage}</Message> : null}
          {createError ? <Message type="error">{createError}</Message> : null}
          {updateError ? <Message type="error">{updateError}</Message> : null}
          <Button
            type="button"
            onClick={() => {
              setCreateError("");
              setCreateMessage("");
              setIsCreateModalOpen(true);
            }}
            disabled={!departmentId}
          >
            <PlusCircle className="size-4" aria-hidden />
            {tr("Create offering", "Xizmat yaratish", "Создать услугу")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("offerings")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offeringsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading offerings...", "Xizmatlar yuklanmoqda...", "Загрузка услуг...")}
              </span>
            </Message>
          ) : null}
          {offeringsQuery.isError ? (
            <Message type="error">
              {offeringsQuery.error instanceof Error
                ? offeringsQuery.error.message
                : tr("Failed to load offerings.", "Xizmatlarni yuklab bo'lmadi.", "Не удалось загрузить услуги.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">KPI Ball</th>
                  <th className="px-3 py-2">Deadline</th>
                  <th className="px-3 py-2">Category ID</th>
                  <th className="px-3 py-2">Building ID</th>
                  <th className="px-3 py-2">{tr("Actions", "Amallar", "Действия")}</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((offering) => (
                  <tr key={offering.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{offering.title || "-"}</td>
                    <td className="px-3 py-2">{offering.description || "-"}</td>
                    <td className="px-3 py-2">{offering.kpiBall ?? "-"}</td>
                    <td className="px-3 py-2">{offering.deadline !== undefined && offering.deadline !== null ? `${offering.deadline} soat` : "-"}</td>
                    <td className="px-3 py-2">{offering.categoryId || "-"}</td>
                    <td className="px-3 py-2">{offering.buildingId || "-"}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void openEditModal(offering)}>
                        <Pencil className="size-4" aria-hidden />
                        {tr("Edit", "Tahrirlash", "Изменить")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!offeringsQuery.isLoading && offerings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>
                      {tr("No offerings found.", "Xizmatlar topilmadi.", "Услуги не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="manager-offerings-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="manager-offerings-page-size"
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
                {tr("Previous", "Oldingi", "Назад")}
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
                {tr("Next", "Keyingi", "Вперед")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Create Offering", "Xizmat yaratish", "Создать услугу")}</CardTitle>
                <CardDescription>{tr("Fill required fields and create a new offering.", "Majburiy maydonlarni to'ldirib yangi xizmat yarating.", "Заполните обязательные поля и создайте новую услугу.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={submitCreate}>
                <Input placeholder={tr("Offering title", "Xizmat nomi", "Название услуги")} value={createForm.title} onChange={(event) => setCreateForm((previous) => ({ ...previous, title: event.target.value }))} />
                <textarea
                  placeholder={tr("Description", "Tavsif", "Описание")}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, description: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Input placeholder={tr("KPI Ball (float)", "KPI Ball (float)", "KPI балл (float)")} value={createForm.kpiBall} onChange={(event) => setCreateForm((previous) => ({ ...previous, kpiBall: event.target.value }))} />
                <Input placeholder={tr("Deadline (long)", "Deadline (long)", "Deadline (long)")} value={createForm.deadline} onChange={(event) => setCreateForm((previous) => ({ ...previous, deadline: event.target.value }))} />
                <Select value={createForm.categoryId} onChange={(event) => setCreateForm((previous) => ({ ...previous, categoryId: event.target.value }))}>
                  <option value="">{tr("Select category", "Kategoriyani tanlang", "Выберите категорию")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </Select>
                <Select value={createForm.buildingId} onChange={(event) => setCreateForm((previous) => ({ ...previous, buildingId: event.target.value }))}>
                  <option value="">{tr("Select building", "Binoni tanlang", "Выберите здание")}</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.title}
                    </option>
                  ))}
                </Select>
                {categoriesForSelectQuery.isLoading || buildingsForSelectQuery.isLoading ? (
                  <Message type="info">{tr("Loading categories and buildings...", "Kategoriyalar va binolar yuklanmoqda...", "Загрузка категорий и зданий...")}</Message>
                ) : null}
                {categoriesForSelectQuery.isError || buildingsForSelectQuery.isError ? (
                  <Message type="error">{tr("Failed to load categories or buildings.", "Kategoriyalar yoki binolarni yuklab bo'lmadi.", "Не удалось загрузить категории или здания.")}</Message>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PlusCircle className="size-4" aria-hidden />}
                    {tr("Create offering", "Xizmat yaratish", "Создать услугу")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    {tr("Cancel", "Bekor qilish", "Отмена")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isUpdateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Update Offering", "Xizmatni yangilash", "Обновить услугу")}</CardTitle>
                <CardDescription>{tr("Edit offering fields and save updates.", "Xizmat maydonlarini tahrirlab, saqlang.", "Измените поля услуги и сохраните изменения.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsUpdateModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={submitUpdate}>
                <Input value={updateForm.id} disabled />
                <Input placeholder={tr("Offering title", "Xizmat nomi", "Название услуги")} value={updateForm.title} onChange={(event) => setUpdateForm((previous) => ({ ...previous, title: event.target.value }))} />
                <textarea
                  placeholder={tr("Description", "Tavsif", "Описание")}
                  value={updateForm.description}
                  onChange={(event) => setUpdateForm((previous) => ({ ...previous, description: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Input placeholder={tr("KPI Ball (float)", "KPI Ball (float)", "KPI балл (float)")} value={updateForm.kpiBall} onChange={(event) => setUpdateForm((previous) => ({ ...previous, kpiBall: event.target.value }))} />
                <Input placeholder={tr("Deadline (long)", "Deadline (long)", "Deadline (long)")} value={updateForm.deadline} onChange={(event) => setUpdateForm((previous) => ({ ...previous, deadline: event.target.value }))} />
                <Select value={updateForm.categoryId} onChange={(event) => setUpdateForm((previous) => ({ ...previous, categoryId: event.target.value }))}>
                  <option value="">{tr("Select category", "Kategoriyani tanlang", "Выберите категорию")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                  {updateForm.categoryId && !categories.some((category) => category.id === updateForm.categoryId) ? (
                    <option value={updateForm.categoryId}>{updateForm.categoryId} (current)</option>
                  ) : null}
                </Select>
                <Select value={updateForm.buildingId} onChange={(event) => setUpdateForm((previous) => ({ ...previous, buildingId: event.target.value }))}>
                  <option value="">{tr("Select building", "Binoni tanlang", "Выберите здание")}</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.title}
                    </option>
                  ))}
                  {updateForm.buildingId && !buildings.some((building) => building.id === updateForm.buildingId) ? (
                    <option value={updateForm.buildingId}>{updateForm.buildingId} (current)</option>
                  ) : null}
                </Select>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Pencil className="size-4" aria-hidden />}
                    {tr("Save update", "Yangilashni saqlash", "Сохранить изменения")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                    {tr("Cancel", "Bekor qilish", "Отмена")}
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
