import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getBuildingById, getBuildingsByDepartment } from "@/api/buildingCoreApi";
import { createManagerBuilding, updateManagerBuilding } from "@/api/buildingManagerApi";
import { getEmployeesByDepartment } from "@/api/employeeCoreApi";
import { getMyProfile } from "@/api/profileApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { BuildingManagerCreateDTO, BuildingManagerUpdateDTO, BuildingResponseDTO } from "@/types/buildingManager";

interface CreateFormState {
  title: string;
  description: string;
  chiefId: string;
}

interface UpdateFormState {
  id: string;
  title: string;
  description: string;
  chiefId: string;
}

const defaultCreateForm: CreateFormState = {
  title: "",
  description: "",
  chiefId: "",
};

const defaultUpdateForm: UpdateFormState = {
  id: "",
  title: "",
  description: "",
  chiefId: "",
};

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

export function ManagerBuildingsPage() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
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
    queryKey: ["profile", "me", "manager-buildings"],
    queryFn: getMyProfile,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const departmentId = session?.departmentId?.trim() || profileQuery.data?.departmentId?.trim() || "";

  const buildingsQuery = useQuery({
    queryKey: ["manager-buildings", departmentId, page, size],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size };
      return getBuildingsByDepartment(departmentId, page, size);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 30_000,
  });

  const chiefsQuery = useQuery({
    queryKey: ["manager-buildings-chief-users", departmentId],
    queryFn: async () => {
      if (!departmentId) return { content: [], totalElements: 0, totalPages: 1, number: 0, size: 200 };
      return getEmployeesByDepartment(departmentId, 1, 200);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 60_000,
  });
  const chiefs = chiefsQuery.data?.content ?? [];
  const buildings = buildingsQuery.data?.content ?? [];
  const totalPages = Math.max(buildingsQuery.data?.totalPages ?? 1, 1);
  const totalElements = buildingsQuery.data?.totalElements ?? 0;

  const selectedCreateChiefName = useMemo(() => {
    const chief = chiefs.find((entry) => entry.id === createForm.chiefId);
    if (!chief) return "-";
    return `${chief.name} ${chief.surname}`.trim() || chief.username;
  }, [chiefs, createForm.chiefId]);

  const createMutation = useMutation({
    mutationFn: createManagerBuilding,
    onSuccess: (result) => {
      setCreateError("");
      setCreateMessage(
        tr(`Building created: ${result.title}`, `Bino yaratildi: ${result.title}`, `Здание создано: ${result.title}`),
      );
      setCreateForm(defaultCreateForm);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-buildings"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(
        error instanceof Error
          ? error.message
          : tr("Failed to create building.", "Binoni yaratib bo'lmadi.", "Не удалось создать здание."),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateManagerBuilding,
    onSuccess: (resultMessage) => {
      setUpdateError("");
      setUpdateMessage(resultMessage);
      setIsUpdateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["manager-buildings"] });
    },
    onError: (error) => {
      setUpdateMessage("");
      setUpdateError(
        error instanceof Error
          ? error.message
          : tr("Failed to update building.", "Binoni yangilab bo'lmadi.", "Не удалось обновить здание."),
      );
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
    const payload: BuildingManagerCreateDTO = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      chiefId: createForm.chiefId.trim(),
    };

    if (!payload.title || !payload.description || !payload.chiefId) {
      setCreateMessage("");
      setCreateError(
        tr("Title, description and chief are required.", "Nomi, tavsifi va chief majburiy.", "Название, описание и chief обязательны."),
      );
      return;
    }

    createMutation.mutate(payload);
  };

  const openEditModal = async (building: BuildingResponseDTO) => {
    setUpdateError("");
    setUpdateMessage("");
    try {
      const full = await getBuildingById(building.id);
      setUpdateForm({
        id: full.id ?? building.id,
        title: full.title ?? "",
        description: full.description ?? "",
        chiefId: full.chiefId ?? "",
      });
    } catch {
      setUpdateForm({
        id: building.id,
        title: building.title ?? "",
        description: building.description ?? "",
        chiefId: building.chiefId ?? "",
      });
    }
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: BuildingManagerUpdateDTO = {
      id: updateForm.id.trim(),
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      chiefId: updateForm.chiefId.trim(),
    };

    if (!payload.id || !payload.title || !payload.description || !payload.chiefId) {
      setUpdateMessage("");
      setUpdateError(
        tr("Id, title, description and chief are required.", "Id, nomi, tavsifi va chief majburiy.", "Id, название, описание и chief обязательны."),
      );
      return;
    }

    updateMutation.mutate(payload);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("buildings")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Manager building create/update module.", "Menejer uchun bino yaratish/yangilash moduli.", "Модуль создания/обновления зданий для менеджера.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {tr("Department ID is taken from manager session/profile.", "Department ID manager session/profile dan olinadi.", "Department ID берется из сессии/профиля менеджера.")}{" "}
            <Badge variant="neutral">{departmentId || "-"}</Badge>
          </p>
          {!profileQuery.isLoading && !departmentId ? (
            <Message type="error">Manager session has no departmentId.</Message>
          ) : null}
          {createMessage ? <Message type="success">{createMessage}</Message> : null}
          {updateMessage ? <Message type="success">{updateMessage}</Message> : null}
          {createError ? <Message type="error">{createError}</Message> : null}
          {updateError ? <Message type="error">{updateError}</Message> : null}
          <div className="flex flex-wrap gap-2">
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
              {tr("Create building", "Bino yaratish", "Создать здание")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("buildings")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {buildingsQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading buildings...", "Binolar yuklanmoqda...", "Загрузка зданий...")}
              </span>
            </Message>
          ) : null}
          {buildingsQuery.isError ? (
            <Message type="error">
              {buildingsQuery.error instanceof Error
                ? buildingsQuery.error.message
                : tr("Failed to load buildings.", "Binolarni yuklab bo'lmadi.", "Не удалось загрузить здания.")}
            </Message>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">Chief ID</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Создано")}</th>
                  <th className="px-3 py-2">{tr("Updated", "Yangilangan", "Обновлено")}</th>
                  <th className="px-3 py-2">{tr("Actions", "Amallar", "Действия")}</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{building.title || "-"}</td>
                    <td className="px-3 py-2">{building.description || "-"}</td>
                    <td className="px-3 py-2">{building.chiefId || "-"}</td>
                    <td className="px-3 py-2">{building.createdDate ?? "-"}</td>
                    <td className="px-3 py-2">{building.updatedDate ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void openEditModal(building)}>
                        <Pencil className="size-4" aria-hidden />
                        {tr("Edit", "Tahrirlash", "Изменить")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!buildingsQuery.isLoading && buildings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>
                      {tr("No buildings found.", "Binolar topilmadi.", "Здания не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="manager-buildings-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="manager-buildings-page-size"
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
              <Button type="button" variant="outline" disabled={page <= 1 || buildingsQuery.isFetching} onClick={() => setPage((previous) => Math.max(previous - 1, 1))}>
                {tr("Previous", "Oldingi", "Назад")}
              </Button>
              <Badge variant="neutral">
                {page}/{totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || buildingsQuery.isFetching}
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
                <CardTitle className="text-lg">{tr("Create Building", "Bino yaratish", "Создать здание")}</CardTitle>
                <CardDescription>{tr("Fill fields and submit.", "Maydonlarni to'ldirib saqlang.", "Заполните поля и сохраните.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={submitCreate}>
                <Input
                  placeholder={tr("Building title", "Bino nomi", "Название здания")}
                  value={createForm.title}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <textarea
                  placeholder={tr("Description", "Tavsif", "Описание")}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Select
                  value={createForm.chiefId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, chiefId: event.target.value }))}
                >
                  <option value="">{tr("Select chief user", "Chief foydalanuvchini tanlang", "Выберите chief пользователя")}</option>
                  {chiefs.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${user.name} ${user.surname}`.trim()} ({user.username})
                    </option>
                  ))}
                </Select>
                <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                  {tr("Selected chief", "Tanlangan chief", "Выбранный chief")}: {selectedCreateChiefName}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || chiefsQuery.isLoading}>
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PlusCircle className="size-4" aria-hidden />}
                    {tr("Create", "Yaratish", "Создать")}
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
                <CardTitle className="text-lg">{tr("Update Building", "Binoni yangilash", "Обновить здание")}</CardTitle>
                <CardDescription>{tr("Update selected building.", "Tanlangan binoni yangilang.", "Обновите выбранное здание.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsUpdateModalOpen(false)}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={submitUpdate}>
                <Input value={updateForm.id} disabled />
                <Input
                  placeholder={tr("Building title", "Bino nomi", "Название здания")}
                  value={updateForm.title}
                  onChange={(event) => setUpdateForm((prev) => ({ ...prev, title: event.target.value }))}
                />
                <textarea
                  placeholder={tr("Description", "Tavsif", "Описание")}
                  value={updateForm.description}
                  onChange={(event) => setUpdateForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Select
                  value={updateForm.chiefId}
                  onChange={(event) => setUpdateForm((prev) => ({ ...prev, chiefId: event.target.value }))}
                >
                  <option value="">{tr("Select chief user", "Chief foydalanuvchini tanlang", "Выберите chief пользователя")}</option>
                  {chiefs.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${user.name} ${user.surname}`.trim()} ({user.username})
                    </option>
                  ))}
                  {updateForm.chiefId && !chiefs.some((user) => user.id === updateForm.chiefId) ? (
                    <option value={updateForm.chiefId}>{updateForm.chiefId} (current)</option>
                  ) : null}
                </Select>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateMutation.isPending || chiefsQuery.isLoading}>
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

