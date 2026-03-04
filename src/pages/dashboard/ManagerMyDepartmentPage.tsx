import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyManagerDepartment, updateMyManagerDepartment } from "@/api/departmentManagerApi";
import { getEmployeeById } from "@/api/employeeCoreApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/features/i18n/messages";

export function ManagerMyDepartmentPage() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const departmentQuery = useQuery({
    queryKey: ["department-manager", "my"],
    queryFn: getMyManagerDepartment,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: updateMyManagerDepartment,
    onSuccess: (resultMessage) => {
      setError("");
      setMessage(resultMessage);
      queryClient.invalidateQueries({ queryKey: ["department-manager", "my"] });
    },
    onError: (mutationError) => {
      setMessage("");
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update my department.",
      );
    },
  });

  const chiefQuery = useQuery({
    queryKey: ["employee-core", "by-id", departmentQuery.data?.chiefId],
    queryFn: () => getEmployeeById(departmentQuery.data!.chiefId),
    enabled: Boolean(departmentQuery.data?.chiefId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!departmentQuery.data) return;
    setTitle(departmentQuery.data.title ?? "");
    setDescription(departmentQuery.data.description ?? "");
  }, [departmentQuery.data]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!departmentQuery.data?.id) {
      setMessage("");
      setError("Department id is missing.");
      return;
    }
    if (!title.trim()) {
      setMessage("");
      setError("Department title is required.");
      return;
    }

    updateMutation.mutate({
      id: departmentQuery.data.id,
      title: title.trim(),
      description: description.trim(),
    });
  };

  const currentDepartment = departmentQuery.data;

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("myDepartment")}</CardTitle>
          </div>
          <CardDescription>
            Manage your department title and description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {departmentQuery.isLoading ? (
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading my department...
              </span>
            </div>
          ) : null}
          {departmentQuery.isError ? (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
              {departmentQuery.error instanceof Error
                ? departmentQuery.error.message
                : "Failed to load my department."}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-success">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
              {error}
            </div>
          ) : null}

          {!departmentQuery.isLoading && currentDepartment ? (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current department
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Department ID</p>
                  <p className="break-all font-medium">{currentDepartment.id || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Chief</p>
                  <p className="break-all font-medium">
                    {chiefQuery.isLoading ? "Loading..." : null}
                    {!chiefQuery.isLoading && chiefQuery.data
                      ? `${chiefQuery.data.name} ${chiefQuery.data.surname} (${chiefQuery.data.username})`
                      : null}
                    {!chiefQuery.isLoading && !chiefQuery.data ? currentDepartment.chiefId || "-" : null}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium">{currentDepartment.title || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap font-medium">
                    {currentDepartment.description || "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!departmentQuery.isLoading && !currentDepartment && !departmentQuery.isError ? (
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-muted-foreground">
              Department data not found for current manager.
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="manager-department-title">Title</Label>
              <Input
                id="manager-department-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={departmentQuery.isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-department-description">Description</Label>
              <textarea
                id="manager-department-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={departmentQuery.isLoading}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button
              type="submit"
              disabled={departmentQuery.isLoading || updateMutation.isPending || !departmentQuery.data?.id}
            >
              {updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              Save update
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
