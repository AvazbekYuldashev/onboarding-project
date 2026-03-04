import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Package, Pencil, PlusCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createOwnerOffering,
  getOwnerOfferings,
  updateOwnerOfferingEntity,
} from "@/api/offeringOwnerApi";
import { getOwnerBuildings } from "@/api/buildingOwnerApi";
import { getOwnerCategories } from "@/api/categoryOwnerApi";
import { getOwnerDepartments } from "@/api/departmentOwnerApi";
import type {
  OfferingOwnerCreateDTO,
  OfferingOwnerUpdateDTO,
  OfferingResponseDTO,
} from "@/types/offeringOwner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/messages";

interface CreateFormState {
  title: string;
  description: string;
  kpiBall: string;
  deadline: string;
  categoryId: string;
  buildingId: string;
  departmentId: string;
}

interface UpdateFormState {
  id: string;
  title: string;
  description: string;
  kpiBall: string;
  deadline: string;
  categoryId: string;
  buildingId: string;
  departmentId: string;
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
  departmentId: "",
};

const defaultUpdateForm: UpdateFormState = {
  id: "",
  title: "",
  description: "",
  kpiBall: "",
  deadline: "",
  categoryId: "",
  buildingId: "",
  departmentId: "",
};

export function OwnerOfferingsPage() {
  const { language } = useI18n();
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

  const offeringsQuery = useQuery({
    queryKey: ["owner-offerings", page, size],
    queryFn: () => getOwnerOfferings(page, size),
    staleTime: 30_000,
  });

  const categoriesForSelectQuery = useQuery({
    queryKey: ["owner-offerings-categories-select"],
    queryFn: () => getOwnerCategories(1, 200),
    staleTime: 60_000,
  });

  const departmentsForSelectQuery = useQuery({
    queryKey: ["owner-offerings-departments-select"],
    queryFn: () => getOwnerDepartments(1, 200),
    staleTime: 60_000,
  });

  const buildingsForSelectQuery = useQuery({
    queryKey: ["owner-offerings-buildings-select"],
    queryFn: () => getOwnerBuildings(1, 200),
    staleTime: 60_000,
  });

  const offerings = offeringsQuery.data?.content ?? [];
  const categories = categoriesForSelectQuery.data?.content ?? [];
  const departments = departmentsForSelectQuery.data?.content ?? [];
  const buildings = buildingsForSelectQuery.data?.content ?? [];
  const totalPages = Math.max(offeringsQuery.data?.totalPages ?? 1, 1);
  const totalElements = offeringsQuery.data?.totalElements ?? 0;
  const categoryTitleById = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.id, category.title || category.id]),
      ),
    [categories],
  );
  const departmentTitleById = useMemo(
    () =>
      new Map(
        departments.map((department) => [department.id, department.title || department.id]),
      ),
    [departments],
  );
  const buildingTitleById = useMemo(
    () =>
      new Map(
        buildings.map((building) => [building.id, building.title || building.id]),
      ),
    [buildings],
  );
  const createBuildings = useMemo(
    () =>
      createForm.departmentId
        ? buildings.filter((building) => building.departmentId === createForm.departmentId)
        : buildings,
    [buildings, createForm.departmentId],
  );
  const createCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          (!createForm.departmentId || category.departmentId === createForm.departmentId) &&
          (!createForm.buildingId || category.buildingId === createForm.buildingId),
      ),
    [categories, createForm.departmentId, createForm.buildingId],
  );
  const updateBuildings = useMemo(
    () =>
      updateForm.departmentId
        ? buildings.filter((building) => building.departmentId === updateForm.departmentId)
        : buildings,
    [buildings, updateForm.departmentId],
  );
  const updateCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          (!updateForm.departmentId || category.departmentId === updateForm.departmentId) &&
          (!updateForm.buildingId || category.buildingId === updateForm.buildingId),
      ),
    [categories, updateForm.departmentId, updateForm.buildingId],
  );

  const createMutation = useMutation({
    mutationFn: createOwnerOffering,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(tr(`Offering created: ${created.title}`, `Xizmat yaratildi: ${created.title}`, `Услуга создана: ${created.title}`));
      setCreateForm(defaultCreateForm);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["owner-offerings"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to create offering.", "Xizmatni yaratib bo'lmadi.", "Не удалось создать услугу."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOwnerOfferingEntity,
    onSuccess: (message) => {
      setUpdateError("");
      setUpdateMessage(message);
      queryClient.invalidateQueries({ queryKey: ["owner-offerings"] });
    },
    onError: (error) => {
      setUpdateMessage("");
      setUpdateError(error instanceof Error ? error.message : tr("Failed to update offering.", "Xizmatni yangilab bo'lmadi.", "Не удалось обновить услугу."));
    },
  });

  useEffect(() => {
    if (!isCreateModalOpen && !isUpdateModalOpen) {
      return;
    }

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

    if (!createForm.title.trim() || !createForm.categoryId || !createForm.departmentId || !createForm.buildingId) {
      setCreateMessage("");
      setCreateError(tr("Title, category, department and building are required.", "Nomi, kategoriya, bo'lim va bino majburiy.", "Название, категория, отдел и здание обязательны."));
      return;
    }
    if (!Number.isFinite(kpiBall) || !Number.isFinite(deadline)) {
      setCreateMessage("");
      setCreateError(tr("KPI ball and deadline must be valid numbers.", "KPI ball va deadline to'g'ri raqam bo'lishi kerak.", "KPI балл и deadline должны быть корректными числами."));
      return;
    }

    const payload: OfferingOwnerCreateDTO = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      kpiBall,
      deadline,
      categoryId: createForm.categoryId,
      buildingId: createForm.buildingId,
      departmentId: createForm.departmentId,
    };

    createMutation.mutate(payload);
  };

  const openEditModal = (offering: OfferingResponseDTO) => {
    setUpdateMessage("");
    setUpdateError("");
    setUpdateForm({
      id: offering.id,
      title: offering.title ?? "",
      description: offering.description ?? "",
      kpiBall: offering.kpiBall === undefined ? "" : String(offering.kpiBall),
      deadline: offering.deadline === undefined ? "" : String(offering.deadline),
      categoryId: offering.categoryId ?? "",
      buildingId: offering.buildingId ?? "",
      departmentId: offering.departmentId ?? "",
    });
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const kpiBall = Number(updateForm.kpiBall.trim());
    const deadline = Number(updateForm.deadline.trim());

    if (!updateForm.id.trim() || !updateForm.title.trim() || !updateForm.categoryId || !updateForm.departmentId || !updateForm.buildingId) {
      setUpdateMessage("");
      setUpdateError(tr("Id, title, category, department and building are required.", "Id, nom, kategoriya, bo'lim va bino majburiy.", "Id, название, категория, отдел и здание обязательны."));
      return;
    }
    if (!Number.isFinite(kpiBall) || !Number.isFinite(deadline)) {
      setUpdateMessage("");
      setUpdateError(tr("KPI ball and deadline must be valid numbers.", "KPI ball va deadline to'g'ri raqam bo'lishi kerak.", "KPI балл и deadline должны быть корректными числами."));
      return;
    }

    const payload: OfferingOwnerUpdateDTO = {
      id: updateForm.id.trim(),
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      kpiBall,
      deadline,
      categoryId: updateForm.categoryId,
      buildingId: updateForm.buildingId,
      departmentId: updateForm.departmentId,
    };

    updateMutation.mutate(payload);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Offerings", "Xizmatlar", "Услуги")}</CardTitle>
          </div>
          <CardDescription>{tr("Owner offerings management module.", "Ega uchun xizmatlar boshqaruvi moduli.", "Модуль управления услугами для владельца.")}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Create Offering", "Xizmat yaratish", "Создать услугу")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {createError ? <Message type="error">{createError}</Message> : null}
          <Button
            type="button"
            onClick={() => {
              setCreateMessage("");
              setCreateError("");
              setIsCreateModalOpen(true);
            }}
          >
            <PlusCircle className="size-4" aria-hidden />
            {tr("Open create modal", "Yaratish oynasini ochish", "Открыть модал создания")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Offerings", "Xizmatlar", "Услуги")}</CardTitle>
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
              {offeringsQuery.error instanceof Error ? offeringsQuery.error.message : tr("Failed to load offerings.", "Xizmatlarni yuklab bo'lmadi.", "Не удалось загрузить услуги.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Building</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">KPI Ball</th>
                  <th className="px-3 py-2">Deadline</th>
                  <th className="px-3 py-2">{tr("Visible", "Ko'rinadi", "Видимость")}</th>
                  <th className="px-3 py-2">{tr("Actions", "Amallar", "Действия")}</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((offering) => (
                  <tr key={offering.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{offering.title || "-"}</td>
                    <td className="px-3 py-2">{offering.description || "-"}</td>
                    <td className="px-3 py-2">{offering.categoryId ? categoryTitleById.get(offering.categoryId) ?? offering.categoryId : "-"}</td>
                    <td className="px-3 py-2">{offering.buildingId ? buildingTitleById.get(offering.buildingId) ?? offering.buildingId : "-"}</td>
                    <td className="px-3 py-2">{offering.departmentId ? departmentTitleById.get(offering.departmentId) ?? offering.departmentId : "-"}</td>
                    <td className="px-3 py-2">{offering.kpiBall ?? "-"}</td>
                    <td className="px-3 py-2">{offering.deadline !== undefined && offering.deadline !== null ? `${offering.deadline} soat` : "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={offering.visible ? "green" : "neutral"}>
                        {offering.visible === undefined ? "-" : offering.visible ? tr("Visible", "Ko'rinadi", "Виден") : tr("Hidden", "Yashirin", "Скрыт")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(offering)}>
                        <Pencil className="size-4" aria-hidden />
                        {tr("Edit", "Tahrirlash", "Изменить")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!offeringsQuery.isLoading && offerings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={9}>
                      {tr("No offerings found.", "Xizmatlar topilmadi.", "Услуги не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="offerings-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="offerings-page-size"
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

      {isUpdateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Update Offering", "Xizmatni yangilash", "Обновить услугу")}</CardTitle>
                <CardDescription>{tr("Edit offering fields and save updates.", "Xizmat maydonlarini tahrirlab, o'zgarishlarni saqlang.", "Измените поля услуги и сохраните изменения.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsUpdateModalOpen(false)} aria-label={tr("Close update modal", "Yangilash modalini yopish", "Закрыть модал обновления")}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateMessage ? <Message type="success">{updateMessage}</Message> : null}
              {updateError ? <Message type="error">{updateError}</Message> : null}
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
                <Select
                  value={updateForm.departmentId}
                  onChange={(event) =>
                    setUpdateForm((previous) => ({
                      ...previous,
                      departmentId: event.target.value,
                      buildingId: "",
                      categoryId: "",
                    }))
                  }
                >
                  <option value="">{tr("Select department", "Bolimni tanlang", "Select department")}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.title}
                    </option>
                  ))}
                </Select>
                <Select
                  value={updateForm.buildingId}
                  onChange={(event) =>
                    setUpdateForm((previous) => ({
                      ...previous,
                      buildingId: event.target.value,
                      categoryId: "",
                    }))
                  }
                >
                  <option value="">{tr("Select building", "Binoni tanlang", "Select building")}</option>
                  {updateBuildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.title}
                    </option>
                  ))}
                </Select>
                <Select value={updateForm.categoryId} onChange={(event) => setUpdateForm((previous) => ({ ...previous, categoryId: event.target.value }))}>
                  <option value="">{tr("Select category", "Kategoriyani tanlang", "Select category")}</option>
                  {updateCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </Select>
                {(categoriesForSelectQuery.isLoading || departmentsForSelectQuery.isLoading || buildingsForSelectQuery.isLoading) ? (
                  <Message type="info">{tr("Loading categories, departments and buildings...", "Kategoriyalar, bo'limlar va binolar yuklanmoqda...", "Загрузка категорий, отделов и зданий...")}</Message>
                ) : null}
                {(categoriesForSelectQuery.isError || departmentsForSelectQuery.isError || buildingsForSelectQuery.isError) ? (
                  <Message type="error">{tr("Failed to load categories, departments or buildings.", "Kategoriyalar, bo'limlar yoki binolarni yuklab bo'lmadi.", "Не удалось загрузить категории, отделы или здания.")}</Message>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
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

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Create Offering", "Xizmat yaratish", "Создать услугу")}</CardTitle>
                <CardDescription>{tr("Fill required fields and create a new offering.", "Majburiy maydonlarni to'ldirib yangi xizmat yarating.", "Заполните обязательные поля и создайте новую услугу.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} aria-label={tr("Close create modal", "Yaratish modalini yopish", "Закрыть модал создания")}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {createMessage ? <Message type="success">{createMessage}</Message> : null}
              {createError ? <Message type="error">{createError}</Message> : null}
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
                <Select
                  value={createForm.departmentId}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      departmentId: event.target.value,
                      buildingId: "",
                      categoryId: "",
                    }))
                  }
                >
                  <option value="">{tr("Select department", "Bolimni tanlang", "Select department")}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.title}
                    </option>
                  ))}
                </Select>
                <Select
                  value={createForm.buildingId}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      buildingId: event.target.value,
                      categoryId: "",
                    }))
                  }
                >
                  <option value="">{tr("Select building", "Binoni tanlang", "Select building")}</option>
                  {createBuildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.title}
                    </option>
                  ))}
                </Select>
                <Select value={createForm.categoryId} onChange={(event) => setCreateForm((previous) => ({ ...previous, categoryId: event.target.value }))}>
                  <option value="">{tr("Select category", "Kategoriyani tanlang", "Select category")}</option>
                  {createCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </Select>
                {(categoriesForSelectQuery.isLoading || departmentsForSelectQuery.isLoading || buildingsForSelectQuery.isLoading) ? (
                  <Message type="info">{tr("Loading categories, departments and buildings...", "Kategoriyalar, bo'limlar va binolar yuklanmoqda...", "Загрузка категорий, отделов и зданий...")}</Message>
                ) : null}
                {(categoriesForSelectQuery.isError || departmentsForSelectQuery.isError || buildingsForSelectQuery.isError) ? (
                  <Message type="error">{tr("Failed to load categories, departments or buildings.", "Kategoriyalar, bo'limlar yoki binolarni yuklab bo'lmadi.", "Не удалось загрузить категории, отделы или здания.")}</Message>
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
    </section>
  );
}

