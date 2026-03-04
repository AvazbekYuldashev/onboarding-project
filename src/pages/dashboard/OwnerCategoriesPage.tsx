import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, PlusCircle, Tags, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createOwnerCategory,
  getOwnerCategories,
  updateOwnerCategoryEntity,
} from "@/api/categoryOwnerApi";
import { getOwnerBuildings } from "@/api/buildingOwnerApi";
import { getOwnerDepartments } from "@/api/departmentOwnerApi";
import type {
  CategoryOwnerCreateDTO,
  CategoryOwnerUpdateDTO,
  CategoryResponseDTO,
} from "@/types/categoryOwner";
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
  departmentId: string;
  buildingId: string;
}

interface UpdateFormState {
  id: string;
  title: string;
  description: string;
  departmentId: string;
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
  departmentId: "",
  buildingId: "",
};

const defaultUpdateForm: UpdateFormState = {
  id: "",
  title: "",
  description: "",
  departmentId: "",
  buildingId: "",
};

export function OwnerCategoriesPage() {
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

  const categoriesQuery = useQuery({
    queryKey: ["owner-categories", page, size],
    queryFn: () => getOwnerCategories(page, size),
    staleTime: 30_000,
  });

  const departmentsForSelectQuery = useQuery({
    queryKey: ["owner-categories-departments-select"],
    queryFn: () => getOwnerDepartments(1, 200),
    staleTime: 60_000,
  });

  const buildingsForSelectQuery = useQuery({
    queryKey: ["owner-categories-buildings-select"],
    queryFn: () => getOwnerBuildings(1, 200),
    staleTime: 60_000,
  });

  const categories = categoriesQuery.data?.content ?? [];
  const departments = departmentsForSelectQuery.data?.content ?? [];
  const buildings = buildingsForSelectQuery.data?.content ?? [];
  const totalPages = Math.max(categoriesQuery.data?.totalPages ?? 1, 1);
  const totalElements = categoriesQuery.data?.totalElements ?? 0;
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

  const createMutation = useMutation({
    mutationFn: createOwnerCategory,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(tr(`Category created: ${created.title}`, `Kategoriya yaratildi: ${created.title}`, `Категория создана: ${created.title}`));
      setCreateForm(defaultCreateForm);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["owner-categories"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to create category.", "Kategoriyani yaratib bo'lmadi.", "Не удалось создать категорию."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOwnerCategoryEntity,
    onSuccess: (message) => {
      setUpdateError("");
      setUpdateMessage(message);
      queryClient.invalidateQueries({ queryKey: ["owner-categories"] });
    },
    onError: (error) => {
      setUpdateMessage("");
      setUpdateError(error instanceof Error ? error.message : tr("Failed to update category.", "Kategoriyani yangilab bo'lmadi.", "Не удалось обновить категорию."));
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
    const payload: CategoryOwnerCreateDTO = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      departmentId: createForm.departmentId.trim(),
      buildingId: createForm.buildingId.trim(),
    };

    if (!payload.title || !payload.departmentId || !payload.buildingId) {
      setCreateMessage("");
      setCreateError(tr("Title, department and building are required.", "Nomi, bo'lim va bino majburiy.", "Название, отдел и здание обязательны."));
      return;
    }

    createMutation.mutate(payload);
  };

  const openEditModal = (category: CategoryResponseDTO) => {
    setUpdateMessage("");
    setUpdateError("");
    setUpdateForm({
      id: category.id,
      title: category.title ?? "",
      description: category.description ?? "",
      departmentId: category.departmentId ?? "",
      buildingId: category.buildingId ?? "",
    });
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CategoryOwnerUpdateDTO = {
      id: updateForm.id.trim(),
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      departmentId: updateForm.departmentId.trim(),
      buildingId: updateForm.buildingId.trim(),
    };

    if (!payload.id || !payload.title || !payload.departmentId || !payload.buildingId) {
      setUpdateMessage("");
      setUpdateError(tr("Id, title, department and building are required.", "Id, nom, bo'lim va bino majburiy.", "Id, название, отдел и здание обязательны."));
      return;
    }

    updateMutation.mutate(payload);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tags className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Categories", "Kategoriyalar", "Категории")}</CardTitle>
          </div>
          <CardDescription>{tr("Owner categories management module.", "Ega uchun kategoriyalar boshqaruvi moduli.", "Модуль управления категориями для владельца.")}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Create Category", "Kategoriya yaratish", "Создать категорию")}</CardTitle>
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
          <CardTitle className="text-lg">{tr("Categories", "Kategoriyalar", "Категории")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading categories...", "Kategoriyalar yuklanmoqda...", "Загрузка категорий...")}
              </span>
            </Message>
          ) : null}
          {categoriesQuery.isError ? (
            <Message type="error">
              {categoriesQuery.error instanceof Error ? categoriesQuery.error.message : tr("Failed to load categories.", "Kategoriyalarni yuklab bo'lmadi.", "Не удалось загрузить категории.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">{tr("Department", "Bo'lim", "Отдел")}</th>
                  <th className="px-3 py-2">{tr("Building", "Bino", "Здание")}</th>
                  <th className="px-3 py-2">{tr("Visible", "Ko'rinadi", "Видимость")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Создано")}</th>
                  <th className="px-3 py-2">{tr("Updated", "Yangilangan", "Обновлено")}</th>
                  <th className="px-3 py-2">{tr("Actions", "Amallar", "Действия")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{category.title || "-"}</td>
                    <td className="px-3 py-2">{category.description || "-"}</td>
                    <td className="px-3 py-2">{category.departmentId ? departmentTitleById.get(category.departmentId) ?? category.departmentId : "-"}</td>
                    <td className="px-3 py-2">{category.buildingId ? buildingTitleById.get(category.buildingId) ?? category.buildingId : "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={category.visible ? "green" : "neutral"}>
                        {category.visible === undefined ? "-" : category.visible ? tr("Visible", "Ko'rinadi", "Виден") : tr("Hidden", "Yashirin", "Скрыт")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{category.createdDate ?? "-"}</td>
                    <td className="px-3 py-2">{category.updatedDate ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(category)}>
                        <Pencil className="size-4" aria-hidden />
                        {tr("Edit", "Tahrirlash", "Изменить")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!categoriesQuery.isLoading && categories.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                      {tr("No categories found.", "Kategoriyalar topilmadi.", "Категории не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="categories-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="categories-page-size"
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
              <Button type="button" variant="outline" disabled={page <= 1 || categoriesQuery.isFetching} onClick={() => setPage((previous) => Math.max(previous - 1, 1))}>
                {tr("Previous", "Oldingi", "Назад")}
              </Button>
              <Badge variant="neutral">
                {page}/{totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || categoriesQuery.isFetching}
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
                <CardTitle className="text-lg">{tr("Update Category", "Kategoriyani yangilash", "Обновить категорию")}</CardTitle>
                <CardDescription>{tr("Edit category fields and save updates.", "Kategoriya maydonlarini tahrirlab, o'zgarishlarni saqlang.", "Измените поля категории и сохраните изменения.")}</CardDescription>
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
                <Input
                  placeholder={tr("Category title", "Kategoriya nomi", "Название категории")}
                  value={updateForm.title}
                  onChange={(event) => setUpdateForm((previous) => ({ ...previous, title: event.target.value }))}
                />
                <textarea
                  placeholder={tr("Description", "Tavsif", "Описание")}
                  value={updateForm.description}
                  onChange={(event) => setUpdateForm((previous) => ({ ...previous, description: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Select
                  value={updateForm.departmentId}
                  onChange={(event) => setUpdateForm((previous) => ({ ...previous, departmentId: event.target.value }))}
                >
                  <option value="">{tr("Select department", "Bo'limni tanlang", "Выберите отдел")}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.title}
                    </option>
                  ))}
                  {updateForm.departmentId && !departments.some((department) => department.id === updateForm.departmentId) ? (
                    <option value={updateForm.departmentId}>{updateForm.departmentId} (current)</option>
                  ) : null}
                </Select>
                <Select
                  value={updateForm.buildingId}
                  onChange={(event) => setUpdateForm((previous) => ({ ...previous, buildingId: event.target.value }))}
                >
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
                {departmentsForSelectQuery.isLoading || buildingsForSelectQuery.isLoading ? (
                  <Message type="info">{tr("Loading departments and buildings...", "Bo'limlar va binolar yuklanmoqda...", "Загрузка отделов и зданий...")}</Message>
                ) : null}
                {departmentsForSelectQuery.isError || buildingsForSelectQuery.isError ? (
                  <Message type="error">{tr("Failed to load departments or buildings.", "Bo'limlar yoki binolarni yuklab bo'lmadi.", "Не удалось загрузить отделы или здания.")}</Message>
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
                <CardTitle className="text-lg">{tr("Create Category", "Kategoriya yaratish", "Создать категорию")}</CardTitle>
                <CardDescription>{tr("Fill required fields and create a new category.", "Majburiy maydonlarni to'ldirib yangi kategoriya yarating.", "Заполните обязательные поля и создайте новую категорию.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} aria-label={tr("Close create modal", "Yaratish modalini yopish", "Закрыть модал создания")}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {createMessage ? <Message type="success">{createMessage}</Message> : null}
              {createError ? <Message type="error">{createError}</Message> : null}
              <form className="space-y-4" onSubmit={submitCreate}>
                <Input
                  placeholder={tr("Category title", "Kategoriya nomi", "Название категории")}
                  value={createForm.title}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, title: event.target.value }))}
                />
                <textarea
                  placeholder={tr("Description", "Tavsif", "Описание")}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, description: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Select
                  value={createForm.departmentId}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, departmentId: event.target.value }))}
                >
                  <option value="">{tr("Select department", "Bo'limni tanlang", "Выберите отдел")}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.title}
                    </option>
                  ))}
                </Select>
                <Select
                  value={createForm.buildingId}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, buildingId: event.target.value }))}
                >
                  <option value="">{tr("Select building", "Binoni tanlang", "Выберите здание")}</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.title}
                    </option>
                  ))}
                </Select>
                {departmentsForSelectQuery.isLoading || buildingsForSelectQuery.isLoading ? (
                  <Message type="info">{tr("Loading departments and buildings...", "Bo'limlar va binolar yuklanmoqda...", "Загрузка отделов и зданий...")}</Message>
                ) : null}
                {departmentsForSelectQuery.isError || buildingsForSelectQuery.isError ? (
                  <Message type="error">{tr("Failed to load departments or buildings.", "Bo'limlar yoki binolarni yuklab bo'lmadi.", "Не удалось загрузить отделы или здания.")}</Message>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PlusCircle className="size-4" aria-hidden />}
                    {tr("Create category", "Kategoriya yaratish", "Создать категорию")}
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
