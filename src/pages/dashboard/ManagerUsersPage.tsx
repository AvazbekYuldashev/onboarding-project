import { useQuery } from "@tanstack/react-query";
import { Loader2, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { getEmployeesByDepartment } from "@/api/employeeCoreApi";
import { API_BASE_URL } from "@/api/client";
import { getMyProfile } from "@/api/profileApi";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/authStore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function Message({
  type,
  children,
}: {
  type: "error" | "info";
  children: React.ReactNode;
}) {
  const classes =
    type === "error"
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-border bg-muted/50 text-muted-foreground";

  return <div className={`rounded-md border px-3 py-2 text-sm ${classes}`}>{children}</div>;
}

function getEmployeeActivity(inProgress?: boolean): { label: string; variant: "green" | "red" | "neutral" } {
  if (inProgress === true) return { label: "Faol", variant: "green" };
  if (inProgress === false) return { label: "Faol emas", variant: "red" };
  return { label: "Faol emas", variant: "neutral" };
}

function buildApiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function resolvePhotoSrc(photo?: { url?: string; originName?: string; id?: string }): string | null {
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

  const resolvedId = photo?.id;
  if (resolvedId) {
    return buildApiUrl(`/api/v1/attach/open/${encodeURIComponent(resolvedId)}`);
  }

  return null;
}

export function ManagerUsersPage() {
  const session = useAuthStore((state) => state.session);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const profileQuery = useQuery({
    queryKey: ["profile", "me", "manager-users"],
    queryFn: getMyProfile,
    enabled: Boolean(session),
    staleTime: 60_000,
  });
  const effectiveDepartmentId = session?.departmentId?.trim() || profileQuery.data?.departmentId?.trim() || "";

  const usersQuery = useQuery({
    queryKey: ["manager-users", effectiveDepartmentId, page, size],
    queryFn: async () => {
      const departmentId = effectiveDepartmentId;
      if (!departmentId) {
        return { content: [], totalElements: 0, totalPages: 1, number: 0, size };
      }
      return getEmployeesByDepartment(departmentId, page, size);
    },
    enabled: Boolean(session) && !profileQuery.isLoading,
    staleTime: 30_000,
  });

  const users = usersQuery.data?.content ?? [];
  const totalPages = Math.max(usersQuery.data?.totalPages ?? 1, 1);
  const totalElements = usersQuery.data?.totalElements ?? 0;

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">Manager Users</CardTitle>
          </div>
          <CardDescription>
            Team users by manager department.
            <span className="ml-2 text-xs text-muted-foreground">
              Department: {effectiveDepartmentId || "-"}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">Users</CardTitle>
          <CardDescription>
            Total: {totalElements} | Page {page}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usersQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading users...
              </span>
            </Message>
          ) : null}
          {profileQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading manager profile...
              </span>
            </Message>
          ) : null}
          {!profileQuery.isLoading && !effectiveDepartmentId ? (
            <Message type="error">Manager session has no departmentId.</Message>
          ) : null}
          {usersQuery.isError ? (
            <Message type="error">
              {usersQuery.error instanceof Error ? usersQuery.error.message : "Failed to load users."}
            </Message>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2">Photo</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border/70">
                    <td className="px-3 py-2">
                      {resolvePhotoSrc(user.photo) ? (
                        <img
                          src={resolvePhotoSrc(user.photo) ?? ""}
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
                      <Badge variant={getEmployeeActivity(user.inProgress).variant}>
                        {getEmployeeActivity(user.inProgress).label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{user.createdDate ?? "-"}</td>
                  </tr>
                ))}
                {!usersQuery.isLoading && users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="manager-page-size">Page size</Label>
            <Select
              id="manager-page-size"
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
                Previous
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
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
