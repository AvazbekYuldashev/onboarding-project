import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  createOwnerBuilding,
  getOwnerBuildings,
  updateOwnerBuildingEntity,
} from "@/api/buildingOwnerApi";
import { getOwnerDepartments } from "@/api/departmentOwnerApi";
import { getOwnerProfiles } from "@/api/profileOwnerApi";
import type {
  BuildingOwnerCreateDTO,
  BuildingOwnerUpdateDTO,
  BuildingResponseDTO,
} from "@/types/buildingOwner";
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
  chiefId: string;
  departmentId: string;
}

interface UpdateFormState {
  id: string;
  title: string;
  description: string;
  chiefId: string;
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
  chiefId: "",
  departmentId: "",
};

const defaultUpdateForm: UpdateFormState = {
  id: "",
  title: "",
  description: "",
  chiefId: "",
  departmentId: "",
};

export function OwnerBuildingsPage() {
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

  const buildingsQuery = useQuery({
    queryKey: ["owner-buildings", page, size],
    queryFn: () => getOwnerBuildings(page, size),
    staleTime: 30_000,
  });

  const chiefUsersQuery = useQuery({
    queryKey: ["owner-buildings-chief-users"],
    queryFn: () => getOwnerProfiles(1, 200),
    staleTime: 60_000,
  });

  const departmentsForSelectQuery = useQuery({
    queryKey: ["owner-buildings-departments-select"],
    queryFn: () => getOwnerDepartments(1, 200),
    staleTime: 60_000,
  });

  const buildings = buildingsQuery.data?.content ?? [];
  const chiefUsers = chiefUsersQuery.data?.content ?? [];
  const departments = departmentsForSelectQuery.data?.content ?? [];
  const totalPages = Math.max(buildingsQuery.data?.totalPages ?? 1, 1);
  const totalElements = buildingsQuery.data?.totalElements ?? 0;
  const chiefDisplayById = useMemo(
    () =>
      new Map(
        chiefUsers.map((user) => {
          const fullName = `${user.name} ${user.surname}`.trim();
          return [user.id, fullName || user.username || user.id];
        }),
      ),
    [chiefUsers],
  );
  const departmentTitleById = useMemo(
    () =>
      new Map(
        departments.map((department) => [department.id, department.title || department.id]),
      ),
    [departments],
  );

  const createMutation = useMutation({
    mutationFn: createOwnerBuilding,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(tr(`Building created: ${created.title}`, `Bino yaratildi: ${created.title}`, `Здание создано: ${created.title}`));
      setCreateForm(defaultCreateForm);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["owner-buildings"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to create building.", "Binoni yaratib bo'lmadi.", "Не удалось создать здание."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOwnerBuildingEntity,
    onSuccess: (message) => {
      setUpdateError("");
      setUpdateMessage(message);
      queryClient.invalidateQueries({ queryKey: ["owner-buildings"] });
    },
    onError: (error) => {
      setUpdateMessage("");
      setUpdateError(error instanceof Error ? error.message : tr("Failed to update building.", "Binoni yangilab bo'lmadi.", "Не удалось обновить здание."));
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
    const payload: BuildingOwnerCreateDTO = {
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      chiefId: createForm.chiefId.trim(),
      departmentId: createForm.departmentId.trim(),
    };

    if (!payload.title || !payload.chiefId || !payload.departmentId) {
      setCreateMessage("");
      setCreateError(tr("Title, chief and department are required.", "Nomi, chief va bo'lim majburiy.", "Название, chief и отдел обязательны."));
      return;
    }

    createMutation.mutate(payload);
  };

  const openEditModal = (building: BuildingResponseDTO) => {
    setUpdateMessage("");
    setUpdateError("");
    setUpdateForm({
      id: building.id,
      title: building.title ?? "",
      description: building.description ?? "",
      chiefId: building.chiefId ?? "",
      departmentId: building.departmentId ?? "",
    });
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: BuildingOwnerUpdateDTO = {
      id: updateForm.id.trim(),
      title: updateForm.title.trim(),
      description: updateForm.description.trim(),
      chiefId: updateForm.chiefId.trim(),
      departmentId: updateForm.departmentId.trim(),
    };

    if (!payload.id || !payload.title || !payload.chiefId || !payload.departmentId) {
      setUpdateMessage("");
      setUpdateError(tr("Id, title, chief and department are required.", "Id, nom, chief va bo'lim majburiy.", "Id, название, chief и отдел обязательны."));
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
            <CardTitle className="text-2xl">{tr("Buildings", "Binolar", "Здания")}</CardTitle>
          </div>
          <CardDescription>{tr("Owner buildings management module.", "Ega uchun binolar boshqaruvi moduli.", "Модуль управления зданиями для владельца.")}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Create Building", "Bino yaratish", "Создать здание")}</CardTitle>
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
          <CardTitle className="text-lg">{tr("Buildings", "Binolar", "Здания")}</CardTitle>
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
              {buildingsQuery.error instanceof Error ? buildingsQuery.error.message : tr("Failed to load buildings.", "Binolarni yuklab bo'lmadi.", "Не удалось загрузить здания.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">{tr("Chief", "Bo'lim boshlig'i", "Руководитель")}</th>
                  <th className="px-3 py-2">{tr("Department", "Bo'lim", "Отдел")}</th>
                  <th className="px-3 py-2">{tr("Visible", "Ko'rinadi", "Видимость")}</th>
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
                    <td className="px-3 py-2">{building.chiefId ? chiefDisplayById.get(building.chiefId) ?? building.chiefId : "-"}</td>
                    <td className="px-3 py-2">{building.departmentId ? departmentTitleById.get(building.departmentId) ?? building.departmentId : "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={building.visible ? "green" : "neutral"}>
                        {building.visible === undefined ? "-" : building.visible ? tr("Visible", "Ko'rinadi", "Виден") : tr("Hidden", "Yashirin", "Скрыт")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{building.createdDate ?? "-"}</td>
                    <td className="px-3 py-2">{building.updatedDate ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(building)}>
                        <Pencil className="size-4" aria-hidden />
                        {tr("Edit", "Tahrirlash", "Изменить")}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!buildingsQuery.isLoading && buildings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                      {tr("No buildings found.", "Binolar topilmadi.", "Здания не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="buildings-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="buildings-page-size"
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

      {isUpdateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-3xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("Update Building", "Binoni yangilash", "Обновить здание")}</CardTitle>
                <CardDescription>{tr("Edit building fields and save updates.", "Bino maydonlarini tahrirlab saqlang.", "Измените поля здания и сохраните.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsUpdateModalOpen(false)} aria-label="Close update modal">
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {updateMessage ? <Message type="success">{updateMessage}</Message> : null}
              {updateError ? <Message type="error">{updateError}</Message> : null}
              <form className="space-y-4" onSubmit={submitUpdate}>
                <Input value={updateForm.id} disabled />
                <Input
                  placeholder={tr("Building title", "Bino nomi", "Название здания")}
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
                  value={updateForm.chiefId}
                  onChange={(event) => setUpdateForm((previous) => ({ ...previous, chiefId: event.target.value }))}
                >
                  <option value="">{tr("Select chief user", "Chief foydalanuvchini tanlang", "Выберите chief пользователя")}</option>
                  {chiefUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${user.name} ${user.surname}`.trim()} ({user.username})
                    </option>
                  ))}
                  {updateForm.chiefId && !chiefUsers.some((user) => user.id === updateForm.chiefId) ? (
                    <option value={updateForm.chiefId}>{updateForm.chiefId} (current)</option>
                  ) : null}
                </Select>
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
                {chiefUsersQuery.isLoading || departmentsForSelectQuery.isLoading ? (
                  <Message type="info">{tr("Loading chief users and departments...", "Chief foydalanuvchilar va bo'limlar yuklanmoqda...", "Загрузка chief пользователей и отделов...")}</Message>
                ) : null}
                {chiefUsersQuery.isError || departmentsForSelectQuery.isError ? (
                  <Message type="error">{tr("Failed to load chief users or departments.", "Chief foydalanuvchilar yoki bo'limlarni yuklab bo'lmadi.", "Не удалось загрузить chief пользователей или отделы.")}</Message>
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
                <CardTitle className="text-lg">{tr("Create Building", "Bino yaratish", "Создать здание")}</CardTitle>
                <CardDescription>{tr("Fill required fields and create a new building.", "Majburiy maydonlarni to'ldirib yangi bino yarating.", "Заполните обязательные поля и создайте новое здание.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} aria-label="Close create modal">
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {createMessage ? <Message type="success">{createMessage}</Message> : null}
              {createError ? <Message type="error">{createError}</Message> : null}
              <form className="space-y-4" onSubmit={submitCreate}>
                <Input
                  placeholder={tr("Building title", "Bino nomi", "Название здания")}
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
                  value={createForm.chiefId}
                  onChange={(event) => setCreateForm((previous) => ({ ...previous, chiefId: event.target.value }))}
                >
                  <option value="">{tr("Select chief user", "Chief foydalanuvchini tanlang", "Выберите chief пользователя")}</option>
                  {chiefUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {`${user.name} ${user.surname}`.trim()} ({user.username})
                    </option>
                  ))}
                </Select>
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
                {chiefUsersQuery.isLoading || departmentsForSelectQuery.isLoading ? (
                  <Message type="info">{tr("Loading chief users and departments...", "Chief foydalanuvchilar va bo'limlar yuklanmoqda...", "Загрузка chief пользователей и отделов...")}</Message>
                ) : null}
                {chiefUsersQuery.isError || departmentsForSelectQuery.isError ? (
                  <Message type="error">{tr("Failed to load chief users or departments.", "Chief foydalanuvchilar yoki bo'limlarni yuklab bo'lmadi.", "Не удалось загрузить chief пользователей или отделы.")}</Message>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PlusCircle className="size-4" aria-hidden />}
                    {tr("Create building", "Bino yaratish", "Создать здание")}
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
