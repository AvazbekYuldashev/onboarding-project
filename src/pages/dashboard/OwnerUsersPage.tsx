import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Search, Trash2, Upload, UserPlus, UserRound, Users, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadAttachFile } from "@/api/attachApi";
import { API_BASE_URL } from "@/api/client";
import { getOwnerBuildings } from "@/api/buildingOwnerApi";
import {
  createOwnerProfile,
  deleteOwnerProfile,
  filterOwnerProfiles,
  getOwnerProfiles,
  updateOwnerBuilding,
  updateOwnerDepartment,
  updateOwnerPassword,
  updateOwnerPhoto,
  updateOwnerRole,
  updateOwnerStatus,
} from "@/api/profileOwnerApi";
import { getOwnerDepartments } from "@/api/departmentOwnerApi";
import { getRoleLabel, PROFILE_ROLES } from "@/features/auth/roles";
import { GENERAL_STATUSES, getGeneralStatusLabel } from "@/features/auth/statuses";
import type { ProfileRole } from "@/types/auth";
import type { GeneralStatus } from "@/types/status";
import type { ProfileOwnerFilterDTO, ProfileResponseOwnerDTO } from "@/types/profileOwner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/messages";

type ActionKind = "department" | "building" | "role" | "status" | "password" | "photo" | "delete";

interface CreateFormState {
  name: string;
  surname: string;
  username: string;
  password: string;
  role: ProfileRole;
  status: GeneralStatus;
  departmentId: string;
  buildingId: string;
  photoId: string;
}

interface FilterDraftState {
  name: string;
  surname: string;
  username: string;
}

interface ActionFormState {
  targetId: string;
  departmentId: string;
  buildingId: string;
  role: ProfileRole;
  status: GeneralStatus;
  password: string;
  photoId: string;
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

function getStatusVariant(status?: string): "neutral" | "green" | "yellow" | "red" {
  const value = status?.toUpperCase() ?? "";
  if (!value) return "neutral";
  if (value.includes("BLOCK") || value.includes("INACTIVE")) return "red";
  if (value === "ACTIVE") return "green";
  return "yellow";
}

function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function resolvePhotoSrc(photo?: { url?: string; originName?: string; id?: string }, photoId?: string): string | null {
  const url = photo?.url?.trim();
  if (url) {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return buildApiUrl(url);
  }

  if (photo?.originName) {
    return buildApiUrl(`/api/v1/attach/open/${encodeURIComponent(photo.originName)}`);
  }

  const resolvedId = photo?.id ?? photoId;
  if (resolvedId) {
    return buildApiUrl(`/api/v1/attach/open/${encodeURIComponent(resolvedId)}`);
  }

  return null;
}

const defaultCreateForm: CreateFormState = {
  name: "",
  surname: "",
  username: "",
  password: "",
  role: "ROLE_USER",
  status: "ACTIVE",
  departmentId: "",
  buildingId: "",
  photoId: "",
};

const defaultFilterDraft: FilterDraftState = {
  name: "",
  surname: "",
  username: "",
};

const defaultActionForm: ActionFormState = {
  targetId: "",
  departmentId: "",
  buildingId: "",
  role: "ROLE_USER",
  status: "ACTIVE",
  password: "",
  photoId: "",
};

export function OwnerUsersPage() {
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const createPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filterDraft, setFilterDraft] = useState(defaultFilterDraft);
  const [appliedFilter, setAppliedFilter] = useState<ProfileOwnerFilterDTO | null>(null);

  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [actionForm, setActionForm] = useState(defaultActionForm);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["owner-users", page, size, appliedFilter],
    queryFn: () => (appliedFilter ? filterOwnerProfiles(appliedFilter, page, size) : getOwnerProfiles(page, size)),
    staleTime: 30_000,
  });

  const users = usersQuery.data?.content ?? [];
  const totalPages = Math.max(usersQuery.data?.totalPages ?? 1, 1);
  const totalElements = usersQuery.data?.totalElements ?? 0;
  const filterMode = useMemo(() => appliedFilter !== null, [appliedFilter]);
  const departmentsForSelectQuery = useQuery({
    queryKey: ["owner-users-departments-select"],
    queryFn: () => getOwnerDepartments(1, 200),
    staleTime: 60_000,
  });
  const buildingsForSelectQuery = useQuery({
    queryKey: ["owner-users-buildings-select"],
    queryFn: () => getOwnerBuildings(1, 200),
    staleTime: 60_000,
  });
  const departments = departmentsForSelectQuery.data?.content ?? [];
  const buildings = buildingsForSelectQuery.data?.content ?? [];
  const departmentTitleMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department.title || department.id])),
    [departments],
  );
  const buildingTitleMap = useMemo(
    () => new Map(buildings.map((building) => [building.id, building.title || building.id])),
    [buildings],
  );
  const buildingsForSelectedDepartment = useMemo(
    () =>
      actionForm.departmentId
        ? buildings.filter((building) => building.departmentId === actionForm.departmentId)
        : buildings,
    [actionForm.departmentId, buildings],
  );

  const createMutation = useMutation({
    mutationFn: createOwnerProfile,
    onSuccess: (created) => {
      setCreateError("");
      setCreateMessage(`User created: ${created.username}`);
      setCreateForm((prev) => ({ ...defaultCreateForm, role: prev.role, status: prev.status }));
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to create user.", "Foydalanuvchini yaratib bo'lmadi.", "Не удалось создать пользователя."));
    },
  });

  const createPhotoUploadMutation = useMutation({
    mutationFn: uploadAttachFile,
    onSuccess: (attach) => {
      if (!attach.id) {
        setCreateMessage("");
        setCreateError(tr("Attachment id was not returned.", "Attachment id qaytmadi.", "Attachment id не был возвращен."));
        return;
      }

      setCreateError("");
      setCreateMessage(tr("Photo uploaded for create form.", "Create forma uchun rasm yuklandi.", "Фото загружено для формы создания."));
      setCreateForm((prev) => ({ ...prev, photoId: attach.id ?? "" }));
    },
    onError: (error) => {
      setCreateMessage("");
      setCreateError(error instanceof Error ? error.message : tr("Failed to upload photo.", "Rasmni yuklab bo'lmadi.", "Не удалось загрузить фото."));
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ kind, id }: { kind: ActionKind; id: string }) => {
      if (kind === "department") return updateOwnerDepartment({ id, departmentId: actionForm.departmentId.trim() });
      if (kind === "building") return updateOwnerBuilding({ id, buildingId: actionForm.buildingId.trim() });
      if (kind === "role") return updateOwnerRole({ id, role: actionForm.role });
      if (kind === "status") return updateOwnerStatus({ id, status: actionForm.status });
      if (kind === "password") return updateOwnerPassword({ id, password: actionForm.password.trim() });
      if (kind === "photo") return updateOwnerPhoto({ id, photoId: actionForm.photoId.trim() });
      return deleteOwnerProfile(id);
    },
    onSuccess: (message, variables) => {
      setActionError("");
      setActionMessage(message);
      if (variables.kind === "password") {
        setActionForm((prev) => ({ ...prev, password: "" }));
      }
      if (variables.kind === "delete" && variables.id === actionForm.targetId) {
        setActionForm(defaultActionForm);
        setSelectedUsername("");
      }
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
    },
    onError: (error) => {
      setActionMessage("");
      setActionError(error instanceof Error ? error.message : tr("Action failed.", "Amal bajarilmadi.", "Операция не выполнена."));
    },
  });

  const uploadAndApplyPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const targetId = actionForm.targetId.trim();
      if (!targetId) {
        throw new Error(tr("Target user id is required.", "Maqsadli user id majburiy.", "Target user id обязателен."));
      }

      const attach = await uploadAttachFile(file);
      if (!attach.id) {
        throw new Error(tr("Attachment id was not returned.", "Attachment id qaytmadi.", "Attachment id не был возвращен."));
      }

      const message = await updateOwnerPhoto({ id: targetId, photoId: attach.id });
      return { attachId: attach.id, message };
    },
    onSuccess: ({ attachId, message }) => {
      setActionError("");
      setActionMessage(message);
      setActionForm((prev) => ({ ...prev, photoId: attachId }));
      queryClient.invalidateQueries({ queryKey: ["owner-users"] });
    },
    onError: (error) => {
      setActionMessage("");
      setActionError(error instanceof Error ? error.message : tr("Failed to upload and update photo.", "Rasmni yuklash va yangilash amalga oshmadi.", "Не удалось загрузить и обновить фото."));
    },
  });

  const runAction = (kind: ActionKind, idOverride?: string) => {
    const id = (idOverride ?? actionForm.targetId).trim();
    if (!id) {
      setActionMessage("");
      setActionError(tr("Target user id is required.", "Maqsadli user id majburiy.", "Target user id обязателен."));
      return;
    }

    if (kind === "department" && !actionForm.departmentId.trim()) {
      setActionMessage("");
      setActionError(tr("Department id is required.", "Department id majburiy.", "Department id обязателен."));
      return;
    }
    if (kind === "building" && !actionForm.buildingId.trim()) {
      setActionMessage("");
      setActionError(tr("Building id is required.", "Building id majburiy.", "Building id обязателен."));
      return;
    }
    if (kind === "password" && !actionForm.password.trim()) {
      setActionMessage("");
      setActionError(tr("Password is required.", "Parol majburiy.", "Пароль обязателен."));
      return;
    }
    if (kind === "photo" && !actionForm.photoId.trim()) {
      setActionMessage("");
      setActionError(tr("Photo id is required.", "Photo id majburiy.", "Photo id обязателен."));
      return;
    }

    actionMutation.mutate({ kind, id });
  };

  const selectUser = (user: ProfileResponseOwnerDTO) => {
    setSelectedUsername(user.username);
    setActionMessage("");
    setActionError("");
    setActionForm({
      targetId: user.id,
      departmentId: user.departmentId ?? "",
      buildingId: user.buildingId ?? "",
      role: user.role,
      status: user.status ?? "ACTIVE",
      password: "",
      photoId: user.photoId ?? "",
    });
    setIsUpdateModalOpen(true);
  };

  useEffect(() => {
    const modalOpen = isCreateModalOpen || isUpdateModalOpen;
    if (!modalOpen) {
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

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = createForm.name.trim();
    const surname = createForm.surname.trim();
    const username = createForm.username.trim();
    const password = createForm.password.trim();

    if (!name || !surname || !username || !password) {
      setCreateMessage("");
      setCreateError(tr("Name, surname, username and password are required.", "Ism, familiya, username va parol majburiy.", "Имя, фамилия, username и пароль обязательны."));
      return;
    }

    createMutation.mutate({
      name,
      surname,
      username,
      password,
      role: createForm.role,
      status: createForm.status,
      departmentId: toOptional(createForm.departmentId),
      buildingId: toOptional(createForm.buildingId),
      photoId: toOptional(createForm.photoId),
    });
  };

  const applyFilter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: ProfileOwnerFilterDTO = {};
    if (toOptional(filterDraft.name)) payload.name = filterDraft.name.trim();
    if (toOptional(filterDraft.surname)) payload.surname = filterDraft.surname.trim();
    if (toOptional(filterDraft.username)) payload.username = filterDraft.username.trim();
    setPage(1);
    setAppliedFilter(Object.keys(payload).length ? payload : null);
  };

  const resetFilter = () => {
    setFilterDraft(defaultFilterDraft);
    setAppliedFilter(null);
    setPage(1);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Users Module", "Foydalanuvchilar moduli", "Модуль пользователей")}</CardTitle>
          </div>
          <CardDescription>{tr("Owner-only users management.", "Faqat ega uchun foydalanuvchilar boshqaruvi.", "Управление пользователями только для владельца.")}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Create User", "Foydalanuvchi yaratish", "Создать пользователя")}</CardTitle>
          <CardDescription>{tr("User creation now opens in a focused modal.", "Foydalanuvchi yaratish endi alohida modalda ochiladi.", "Создание пользователя теперь открывается в отдельном модальном окне.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {createMessage ? <Message type="success">{createMessage}</Message> : null}
          {createError ? <Message type="error">{createError}</Message> : null}
          <Button
            type="button"
            onClick={() => {
              setCreateError("");
              setCreateMessage("");
              setIsCreateModalOpen(true);
            }}
          >
            <UserPlus className="size-4" aria-hidden />
            {tr("Open create modal", "Yaratish modalini ochish", "Открыть модал создания")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Filters", "Filtrlar", "Фильтры")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" onSubmit={applyFilter}>
            <Input placeholder={tr("Name", "Ism", "Имя")} value={filterDraft.name} onChange={(e) => setFilterDraft((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder={tr("Surname", "Familiya", "Фамилия")} value={filterDraft.surname} onChange={(e) => setFilterDraft((p) => ({ ...p, surname: e.target.value }))} />
            <Input placeholder={tr("Username", "Username", "Username")} value={filterDraft.username} onChange={(e) => setFilterDraft((p) => ({ ...p, username: e.target.value }))} />
            <div className="flex items-center gap-2">
              <Button type="submit">
                <Search className="size-4" aria-hidden />
                {tr("Apply", "Qo'llash", "Применить")}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilter}>
                {tr("Reset", "Tozalash", "Сброс")}
              </Button>
              <Badge variant={filterMode ? "yellow" : "neutral"}>{filterMode ? tr("Filter mode", "Filtr rejimi", "Режим фильтра") : tr("All mode", "To'liq rejim", "Полный режим")}</Badge>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Users", "Foydalanuvchilar", "Пользователи")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usersQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading users...", "Foydalanuvchilar yuklanmoqda...", "Загрузка пользователей...")}
              </span>
            </Message>
          ) : null}
          {usersQuery.isError ? (
            <Message type="error">
              {usersQuery.error instanceof Error ? usersQuery.error.message : tr("Failed to load users.", "Foydalanuvchilarni yuklab bo'lmadi.", "Не удалось загрузить пользователей.")}
            </Message>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Photo", "Rasm", "Фото")}</th>
                  <th className="px-3 py-2">{tr("Name", "Ism", "Имя")}</th>
                  <th className="px-3 py-2">{tr("Username", "Username", "Username")}</th>
                  <th className="px-3 py-2">{tr("Role", "Rol", "Роль")}</th>
                  <th className="px-3 py-2">{tr("Status", "Holat", "Статус")}</th>
                  <th className="px-3 py-2">{tr("Department", "Bo'lim", "Отдел")}</th>
                  <th className="px-3 py-2">{tr("Building", "Bino", "Здание")}</th>
                  <th className="px-3 py-2">{tr("Actions", "Amallar", "Действия")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border/70">
                    <td className="px-3 py-2">
                      {resolvePhotoSrc(user.photo, user.photoId) ? (
                        <img
                          src={resolvePhotoSrc(user.photo, user.photoId) ?? ""}
                          alt={`${user.name} ${user.surname}`.trim() || user.username}
                          className="size-9 rounded-full border border-border/70 object-cover"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-muted-foreground">
                          <UserRound className="size-4" aria-hidden />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">{`${user.name} ${user.surname}`.trim()}</td>
                    <td className="px-3 py-2">{user.username}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={getStatusVariant(user.status)}>{user.status ? getGeneralStatusLabel(user.status as GeneralStatus) : "-"}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      {user.departmentId ? departmentTitleMap.get(user.departmentId) ?? user.departmentId : "-"}
                    </td>
                    <td className="px-3 py-2">{user.buildingId ? buildingTitleMap.get(user.buildingId) ?? user.buildingId : "-"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => selectUser(user)} aria-label={`${tr("Edit", "Tahrirlash", "Изменить")} ${user.username}`}>
                          <Pencil className="size-4" aria-hidden />
                          {tr("Edit", "Tahrirlash", "Изменить")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const accepted = window.confirm(tr(`Delete user "${user.username}"?`, `"${user.username}" foydalanuvchisini o'chirasizmi?`, `Удалить пользователя "${user.username}"?`));
                            if (accepted) {
                              runAction("delete", user.id);
                            }
                          }}
                          disabled={actionMutation.isPending}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          {tr("Delete", "O'chirish", "Удалить")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!usersQuery.isLoading && users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>
                      {tr("No users found.", "Foydalanuvchilar topilmadi.", "Пользователи не найдены.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select
              id="page-size"
              value={String(size)}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1 || usersQuery.isFetching} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                {tr("Previous", "Oldingi", "Назад")}
              </Button>
              <Badge variant="neutral">
                {page}/{totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages || usersQuery.isFetching}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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
                <CardTitle className="text-lg">{tr("Create User", "Foydalanuvchi yaratish", "Создать пользователя")}</CardTitle>
                <CardDescription>{tr("Fill required fields and create a new user.", "Majburiy maydonlarni to'ldirib yangi foydalanuvchi yarating.", "Заполните обязательные поля и создайте нового пользователя.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} aria-label={tr("Close create modal", "Yaratish modalini yopish", "Закрыть модал создания")}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {createMessage ? <Message type="success">{createMessage}</Message> : null}
              {createError ? <Message type="error">{createError}</Message> : null}
              <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreate}>
                <Input placeholder={tr("Name", "Ism", "Имя")} value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
                <Input placeholder={tr("Surname", "Familiya", "Фамилия")} value={createForm.surname} onChange={(e) => setCreateForm((p) => ({ ...p, surname: e.target.value }))} />
                <Input placeholder={tr("Username", "Username", "Username")} value={createForm.username} onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} />
                <Input type="password" placeholder={tr("Password", "Parol", "Пароль")} value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
                <Select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value as ProfileRole }))}>
                  {PROFILE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </Select>
                <Select value={createForm.status} onChange={(e) => setCreateForm((p) => ({ ...p, status: e.target.value as GeneralStatus }))}>
                  {GENERAL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getGeneralStatusLabel(status)}
                    </option>
                  ))}
                </Select>
                <Input placeholder={tr("Department ID", "Bo'lim ID", "ID отдела")} value={createForm.departmentId} onChange={(e) => setCreateForm((p) => ({ ...p, departmentId: e.target.value }))} />
                <Input placeholder={tr("Building ID", "Bino ID", "ID здания")} value={createForm.buildingId} onChange={(e) => setCreateForm((p) => ({ ...p, buildingId: e.target.value }))} />
                <div className="space-y-2 md:col-span-3">
                  <Input placeholder={tr("Photo ID", "Rasm ID", "ID фото")} value={createForm.photoId} disabled />
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={createPhotoInputRef}
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) createPhotoUploadMutation.mutate(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={createPhotoUploadMutation.isPending}
                      onClick={() => createPhotoInputRef.current?.click()}
                    >
                      {createPhotoUploadMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                      {tr("Upload photo", "Rasm yuklash", "Загрузить фото")}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 md:col-span-3">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
                    {tr("Create user", "Foydalanuvchi yaratish", "Создать пользователя")}
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
          <Card className="w-full max-w-4xl border-border/80 bg-card shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{tr("User Actions", "Foydalanuvchi amallari", "Действия пользователя")}</CardTitle>
                <CardDescription>{tr("Edit selected user with quick action tools.", "Tanlangan foydalanuvchini tezkor vositalar bilan tahrirlang.", "Изменяйте выбранного пользователя с помощью быстрых инструментов.")}</CardDescription>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setIsUpdateModalOpen(false)} aria-label={tr("Close user actions modal", "Foydalanuvchi amallari modalini yopish", "Закрыть модал действий пользователя")}>
                <X className="size-4" aria-hidden />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionMessage ? <Message type="success">{actionMessage}</Message> : null}
              {actionError ? <Message type="error">{actionError}</Message> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Input value={actionForm.targetId} placeholder={tr("Target user id", "Maqsadli user id", "Target user id")} disabled />
                <Input value={selectedUsername} placeholder={tr("Selected username", "Tanlangan username", "Выбранный username")} disabled />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4 text-primary" aria-hidden />{tr("Department", "Bo'lim", "Отдел")}</p>
                  <Select value={actionForm.departmentId} onChange={(e) => setActionForm((p) => ({ ...p, departmentId: e.target.value }))}>
                    <option value="">{tr("Select department", "Bo'limni tanlang", "Выберите отдел")}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.title}
                      </option>
                    ))}
                    {actionForm.departmentId && !departments.some((department) => department.id === actionForm.departmentId) ? (
                      <option value={actionForm.departmentId}>{actionForm.departmentId} (current)</option>
                    ) : null}
                  </Select>
                  {departmentsForSelectQuery.isLoading ? (
                    <Message type="info">{tr("Loading departments...", "Bo'limlar yuklanmoqda...", "Загрузка отделов...")}</Message>
                  ) : null}
                  {departmentsForSelectQuery.isError ? (
                    <Message type="error">{tr("Failed to load departments.", "Bo'limlarni yuklab bo'lmadi.", "Не удалось загрузить отделы.")}</Message>
                  ) : null}
                  <Button type="button" variant="outline" disabled={actionMutation.isPending} onClick={() => runAction("department")}>{tr("Save department", "Bo'limni saqlash", "Сохранить отдел")}</Button>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4 text-primary" aria-hidden />{tr("Building", "Bino", "Здание")}</p>
                  <Select value={actionForm.buildingId} onChange={(e) => setActionForm((p) => ({ ...p, buildingId: e.target.value }))}>
                    <option value="">{tr("Select building", "Binoni tanlang", "Выберите здание")}</option>
                    {buildingsForSelectedDepartment.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.title}
                      </option>
                    ))}
                    {actionForm.buildingId && !buildingsForSelectedDepartment.some((building) => building.id === actionForm.buildingId) ? (
                      <option value={actionForm.buildingId}>{actionForm.buildingId} (current)</option>
                    ) : null}
                  </Select>
                  {buildingsForSelectQuery.isLoading ? (
                    <Message type="info">{tr("Loading buildings...", "Binolar yuklanmoqda...", "Загрузка зданий...")}</Message>
                  ) : null}
                  {buildingsForSelectQuery.isError ? (
                    <Message type="error">{tr("Failed to load buildings.", "Binolarni yuklab bo'lmadi.", "Не удалось загрузить здания.")}</Message>
                  ) : null}
                  <Button type="button" variant="outline" disabled={actionMutation.isPending} onClick={() => runAction("building")}>{tr("Save building", "Binoni saqlash", "Сохранить здание")}</Button>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4 text-primary" aria-hidden />{tr("Role", "Rol", "Роль")}</p>
                  <Select value={actionForm.role} onChange={(e) => setActionForm((p) => ({ ...p, role: e.target.value as ProfileRole }))}>
                    {PROFILE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" disabled={actionMutation.isPending} onClick={() => runAction("role")}>{tr("Save role", "Rolni saqlash", "Сохранить роль")}</Button>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4 text-primary" aria-hidden />{tr("Status", "Holat", "Статус")}</p>
                  <Select value={actionForm.status} onChange={(e) => setActionForm((p) => ({ ...p, status: e.target.value as GeneralStatus }))}>
                    {GENERAL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {getGeneralStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" disabled={actionMutation.isPending} onClick={() => runAction("status")}>{tr("Save status", "Holatni saqlash", "Сохранить статус")}</Button>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4 text-primary" aria-hidden />{tr("Password", "Parol", "Пароль")}</p>
                  <Input type="password" placeholder={tr("New password", "Yangi parol", "Новый пароль")} value={actionForm.password} onChange={(e) => setActionForm((p) => ({ ...p, password: e.target.value }))} />
                  <Button type="button" variant="outline" disabled={actionMutation.isPending} onClick={() => runAction("password")}>{tr("Save password", "Parolni saqlash", "Сохранить пароль")}</Button>
                </div>
                <div className="space-y-2 rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4 text-primary" aria-hidden />{tr("Photo", "Rasm", "Фото")}</p>
                  <Input placeholder={tr("Photo ID", "Rasm ID", "ID фото")} value={actionForm.photoId} onChange={(e) => setActionForm((p) => ({ ...p, photoId: e.target.value }))} />
                  <div className="flex flex-wrap gap-2">
                    <input ref={photoInputRef} type="file" className="sr-only" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAndApplyPhotoMutation.mutate(file);
                    }} />
                    <Button type="button" variant="outline" disabled={uploadAndApplyPhotoMutation.isPending || !actionForm.targetId.trim()} onClick={() => photoInputRef.current?.click()}>
                      {uploadAndApplyPhotoMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                      {tr("Upload & apply", "Yuklash va qo'llash", "Загрузить и применить")}
                    </Button>
                    <Button type="button" variant="outline" disabled={actionMutation.isPending} onClick={() => runAction("photo")}>{tr("Apply photo id", "Rasm id ni qo'llash", "Применить id фото")}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
