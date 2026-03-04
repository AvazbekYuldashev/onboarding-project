import { useQuery } from "@tanstack/react-query";
import { Loader2, Tags } from "lucide-react";
import { useState } from "react";
import { getCategoriesByBuilding } from "@/api/categoryCoreApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/authStore";
import { useI18n } from "@/features/i18n/messages";

function Message({ type, children }: { type: "error" | "info"; children: React.ReactNode }) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

export function EmployeeCategoriesPage() {
  const session = useAuthStore((state) => state.session);
  const { language, t } = useI18n();
  const tr = (en: string, uz: string, ru: string) =>
    language === "UZ" ? uz : language === "RU" ? ru : en;

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const buildingId = session?.buildingId?.trim() || "";

  const categoriesQuery = useQuery({
    queryKey: ["employee-categories", "by-building", buildingId, page, size],
    queryFn: () => getCategoriesByBuilding(buildingId, page, size),
    enabled: Boolean(buildingId),
    staleTime: 30_000,
  });

  const items = categoriesQuery.data?.content ?? [];
  const totalPages = Math.max(categoriesQuery.data?.totalPages ?? 1, 1);
  const totalElements = categoriesQuery.data?.totalElements ?? 0;

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tags className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("categories")}</CardTitle>
          </div>
          <CardDescription>{tr("Categories by your building.", "Sizning bino bo'yicha kategoriyalar.", "Kategorii po vashemu zdaniyu.")}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">{t("categories")}</CardTitle>
          <CardDescription>
            {tr("Total", "Jami", "Всего")}: {totalElements} | {tr("Page", "Sahifa", "Страница")} {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!buildingId ? <Message type="error">Employee session has no buildingId.</Message> : null}
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
                  <th className="px-3 py-2">{tr("Visible", "Ko'rinadi", "Видимость")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border/70">
                    <td className="px-3 py-2">{item.title || "-"}</td>
                    <td className="px-3 py-2">{item.description || "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={item.visible ? "green" : "neutral"}>
                        {item.visible === undefined ? "-" : item.visible ? tr("Visible", "Ko'rinadi", "Виден") : tr("Hidden", "Yashirin", "Скрыт")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="employee-categories-page-size">{tr("Page size", "Sahifa hajmi", "Размер страницы")}</Label>
            <Select id="employee-categories-page-size" value={String(size)} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" disabled={page <= 1 || categoriesQuery.isFetching} onClick={() => setPage((p) => Math.max(p - 1, 1))}>{tr("Previous", "Oldingi", "Назад")}</Button>
              <Badge variant="neutral">{page}/{totalPages}</Badge>
              <Button type="button" variant="outline" disabled={page >= totalPages || categoriesQuery.isFetching} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>{tr("Next", "Keyingi", "Вперёд")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
