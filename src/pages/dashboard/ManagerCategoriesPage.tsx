import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, PlusCircle, Tags, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getBuildingsByDepartment } from "@/api/buildingCoreApi";
import { getCategoriesByDepartment, getCategoryById } from "@/api/categoryCoreApi";
import { createManagerCategory, updateManagerCategory } from "@/api/categoryManagerApi";
import { getMyProfile } from "@/api/profileApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { CategoryManagerCreateDTO, CategoryManagerUpdateDTO } from "@/types/categoryManager";
import type { CategoryResponseDTO } from "@/types/categoryOwner";

interface CreateFormState {
  title: string;
  description: string;
  buildingId: string;
}

interface UpdateFormState {
  id: string;
  title: string;
  description: string;
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
  buildingId: "",
};

const defaultUpdateForm: UpdateFormState = {
  id: "",
  title: "",
  description: "",
  buildingId: "",
};

export function ManagerCategoriesPage() {
  const session = useAuthStore((state) => state.session);
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [updateForm, setUpdateForm] = useState<UpdateFormState>(defaultUpdateForm);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile", "me", "manager-categories"],
    queryFn: getMyProfile,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const departmentId = session?.departmentId?.trim() || profileQuery.data?.departmentId?.trim() || "";

  const categoriesQuery = useQuery({
    queryKey: ["manager-categories", departmentId, page, size],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size };
      return getCategoriesByDepartment(departmentId, page, size);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 30_000,
  });

  const buildingsForSelectQuery = useQuery({
    queryKey: ["manager-categories-buildings-select", departmentId],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size: 200 };
      return getBuildingsByDepartment(departmentId, 1, 200);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 60_000,
  });

  const categories = categoriesQuery.data?.content ?? [];
  const buildings = buildingsForSelectQuery.data?.content ?? [];
  const totalPages = Math.max(categoriesQuery.data?.totalPages ?? 1, 1);
  const totalElements = categoriesQuery.data?.totalElements ?? 0;

  const createMutation = useMutation({
    mutationFn: createManagerCategory,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(tr(`Category created: ${created.title}`, `Kategoriya yaratildi: ${created.title}`, `Категория создана: ${created.title}`));
      setCreateForm(defaultCreateForm);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-categories"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to create category.", "Kategoriyani yaratib bo'lmadi.", "Не удалось создать категорию."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateManagerCategory,
    onSuccess: (message) => {
      setUpdateError("");
      setUpdateMessage(message);
      setIsUpdateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-categories"] });
    },
    onError: (error) => {
      setUpdateMessage("");
      setUpdateError(error instanceof Error ? error.message : tr("Failed to update category.", "Kategoriyani yangilab bo'lmadi.", "Не удалось обновить категорию."));
    },
  });

  useEffect(() => {
    if (!isCreateModalOpen && !isUpdateModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
        setIsUpdateModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateModalOpen, isUpdateModalOpen]);

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CategoryManagerCreateDTO = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      departmentId,
      buildingId: createForm.buildingId.trim() || undefined,
    };

    if (!payload.title || !payload.description || !departmentId || !payload.buildingId) {
      setCreateMessage("");
      setCreateError(tr("Title, description and building are required.", "Nomi, tavsifi va bino majburiy.", "Название, описание и здание обязательны."));
      return;
    }

    createMutation.mutate(payload);
  };

  const openEditModal = async (category: CategoryResponseDTO) => {
    setUpdateMessage("");
    setUpdateError("");
    try {
      const full = await getCategoryById(category.id);
      setUpdateForm({
        id: full.id,
        title: full.title ?? "",
        description: full.description ?? "",
        buildingId: full.buildingId ?? "",
      });
    } catch {
      setUpdateForm({
        id: category.id,
        title: category.title ?? "",
        description: category.description ?? "",
        buildingId: category.buildingId ?? "",
      });
    }
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: CategoryManagerUpdateDTO = {
      id: updateForm.id.trim(),
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      departmentId,
      buildingId: updateForm.buildingId.trim() || undefined,
    };

    if (!payload.id || !payload.title || !payload.description || !departmentId || !payload.buildingId) {
      setUpdateMessage("");
      setUpdateError(tr("Id, title, description and building are required.", "Id, nomi, tavsifi va bino majburiy.", "Id, название, описание и здание обязательны."));
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
            <CardTitle className="text-2xl">{t("categories")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Manager categories module.", "Menejer kategoriyalar moduli.", "Модуль категорий менеджера.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {tr("Department ID from manager session/profile:", "Manager session/profile dan olingan department ID:", "Department ID из сессии/профиля менеджера:")}{" "}
            <Badge variant="neutral">{departmentId || "-"}</Badge>
          </p>
          {!profileQuery.isLoading && !departmentId ? (
            <Message type="error">Manager session has no departmentId.</Message>
          ) : null}
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
            {tr("Create category", "Kategoriya yaratish", "Создать категорию")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("categories")}</CardTitle>
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
              {categoriesQuery.error instanceof Error
                ? categoriesQuery.error.message
                : tr("Failed to load categories.", "Kategoriyalarni yuklab bo'lmadi.", "Не удалось загрузить категории.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">Building ID</th>
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
                    <td className="px-3 py-2">{category.buildingId || "-"}</td>
                    <td className="px-3 py-2">{category.createdDate ?? "-"}</td>
                    <td className="px-3 py-2">{category.updatedDate ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void openEditModal(category)}>
                        <Pencil className="size-4" aria-hidden />
                        {tr("Edit", "Tahrirlash", "Изменить")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!categoriesQuery.isLoading && categories.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                      {tr("No categories found.", "Kategoriyalar topilmadi.", "Категории не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="manager-categories-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="manager-categories-page-size"
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

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Create Category", "Kategoriya yaratish", "Создать категорию")}</CardTitle>
                <CardDescription>{tr("Fill required fields and create a new category.", "Majburiy maydonlarni to'ldirib yangi kategoriya yarating.", "Заполните обязательные поля и создайте новую категорию.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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
                {buildingsForSelectQuery.isLoading ? (
                  <Message type="info">{tr("Loading buildings...", "Binolar yuklanmoqda...", "Загрузка зданий...")}</Message>
                ) : null}
                {buildingsForSelectQuery.isError ? (
                  <Message type="error">{tr("Failed to load buildings.", "Binolarni yuklab bo'lmadi.", "Не удалось загрузить здания.")}</Message>
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

      {isUpdateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Update Category", "Kategoriyani yangilash", "Обновить категорию")}</CardTitle>
                <CardDescription>{tr("Edit category fields and save updates.", "Kategoriya maydonlarini tahrirlab, saqlang.", "Измените поля категории и сохраните.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsUpdateModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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

