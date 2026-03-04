import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { updateAdminBuilding } from "@/api/buildingAdminApi";
import { getBuildingById } from "@/api/buildingCoreApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";
import type { BuildingAdminUpdateDTO } from "@/types/buildingManager";

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

export function AdminBuildingsPage() {
  const session = useAuthStore((state) => state.session);
  const queryClient = useQueryClient();
  const { language } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const buildingId = session?.buildingId?.trim() || "";

  const buildingQuery = useQuery({
    queryKey: ["building-core", "by-id", buildingId, "admin"],
    queryFn: () => getBuildingById(buildingId),
    enabled: Boolean(buildingId),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminBuilding,
    onSuccess: (resultMessage) => {
      setError("");
      setMessage(resultMessage);
      queryClient.invalidateQueries({ queryKey: ["building-core", "by-id", buildingId, "admin"] });
    },
    onError: (mutationError) => {
      setMessage("");
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : tr("Failed to update building.", "Binoni yangilab bo'lmadi.", "Не удалось обновить здание."),
      );
    },
  });

  useEffect(() => {
    if (!buildingQuery.data) return;
    setTitle(buildingQuery.data.title ?? "");
    setDescription(buildingQuery.data.description ?? "");
  }, [buildingQuery.data]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!buildingQuery.data?.id) {
      setMessage("");
      setError(tr("Building id is missing.", "Bino id topilmadi.", "ID здания отсутствует."));
      return;
    }
    if (!title.trim()) {
      setMessage("");
      setError(tr("Title is required.", "Nomi majburiy.", "Название обязательно."));
      return;
    }

    const payload: BuildingAdminUpdateDTO = {
      id: buildingQuery.data.id,
      title: title.trim(),
      description: description.trim(),
    };
    updateMutation.mutate(payload);
  };

  const buildings = buildingQuery.data ? [buildingQuery.data] : [];

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{tr("Building", "Bino", "Здание")}</CardTitle>
          </div>
          <CardDescription>
            {tr("Admin building module.", "Admin bino moduli.", "Модуль здания администратора.")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Building Data", "Bino ma'lumotlari", "Данные здания")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!buildingId ? (
            <Message type="error">{tr("Admin session has no buildingId.", "Admin sessionda buildingId yo'q.", "В сессии админа нет buildingId.")}</Message>
          ) : null}

          {buildingQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tr("Loading building...", "Bino yuklanmoqda...", "Загрузка здания...")}
              </span>
            </Message>
          ) : null}

          {buildingQuery.isError ? (
            <Message type="error">
              {buildingQuery.error instanceof Error
                ? buildingQuery.error.message
                : tr("Failed to load building.", "Binoni yuklab bo'lmadi.", "Не удалось загрузить здание.")}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">{tr("Title", "Nomi", "Название")}</th>
                  <th className="px-3 py-2">{tr("Description", "Tavsif", "Описание")}</th>
                  <th className="px-3 py-2">{tr("Visible", "Ko'rinadi", "Видимость")}</th>
                  <th className="px-3 py-2">{tr("Created", "Yaratilgan", "Создано")}</th>
                  <th className="px-3 py-2">{tr("Updated", "Yangilangan", "Обновлено")}</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((item) => (
                  <tr key={item.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{item.title || "-"}</td>
                    <td className="px-3 py-2">{item.description || "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={item.visible ? "green" : "neutral"}>
                        {item.visible === undefined ? "-" : item.visible ? tr("Visible", "Ko'rinadi", "Виден") : tr("Hidden", "Yashirin", "Скрыт")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{item.createdDate ?? "-"}</td>
                    <td className="px-3 py-2">{item.updatedDate ?? "-"}</td>
                  </tr>
                ))}
                {!buildingQuery.isLoading && buildings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                      {tr("Building not found.", "Bino topilmadi.", "Здание не найдено.")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{tr("Update Building", "Binoni yangilash", "Обновить здание")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? <Message type="success">{message}</Message> : null}
          {error ? <Message type="error">{error}</Message> : null}

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="admin-building-title">{tr("Title", "Nomi", "Название")}</Label>
              <Input
                id="admin-building-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={buildingQuery.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-building-description">{tr("Description", "Tavsif", "Описание")}</Label>
              <textarea
                id="admin-building-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={buildingQuery.isLoading}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending || !buildingQuery.data?.id}>
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
              {tr("Save update", "Yangilashni saqlash", "Сохранить обновление")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
