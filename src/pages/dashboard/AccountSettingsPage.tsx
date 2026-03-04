import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCheck, Loader2, Save, Settings2, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { uploadAttachFile } from "@/api/attachApi";
import { API_BASE_URL } from "@/api/client";
import {
  deleteMyProfile,
  getMyProfile,
  updateProfileDetail,
  updateProfilePassword,
  updateProfilePhoto,
  updateProfileUsername,
  updateProfileUsernameConfirm,
} from "@/api/profileApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/authStore";
import { getRoleLabel } from "@/features/auth/roles";

interface DetailForm {
  name: string;
  surname: string;
}

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value)
  );
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

  if (photo?.id) {
    return buildApiUrl(`/api/v1/attach/open/${encodeURIComponent(photo.id)}`);
  }

  return null;
}

function Message({
  type,
  children,
}: {
  type: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  if (type === "success") {
    return (
      <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
        {children}
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
        {children}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function AccountSettingsPage() {
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const patchSession = useAuthStore((state) => state.patchSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [detailForm, setDetailForm] = useState<DetailForm>({ name: "", surname: "" });
  const [usernameCandidate, setUsernameCandidate] = useState("");
  const [usernameCode, setUsernameCode] = useState("");
  const [isUsernameConfirmStepOpen, setIsUsernameConfirmStepOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const [detailMessage, setDetailMessage] = useState<string>("");
  const [detailError, setDetailError] = useState<string>("");
  const [usernameMessage, setUsernameMessage] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");
  const [passwordMessage, setPasswordMessage] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [photoMessage, setPhotoMessage] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string>("");

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setDetailForm({
      name: profileQuery.data.name,
      surname: profileQuery.data.surname,
    });
    setUsernameCandidate(profileQuery.data.username);
    setUsernameCode("");
    setIsUsernameConfirmStepOpen(false);
    patchSession({
      id: profileQuery.data.id,
      username: profileQuery.data.username,
      departmentId: profileQuery.data.departmentId,
      buildingId: profileQuery.data.buildingId,
      role: profileQuery.data.role,
      isEmployee: profileQuery.data.isEmployee,
      jwt: profileQuery.data.jwt ?? session?.jwt,
    });
  }, [patchSession, profileQuery.data, session?.jwt]);

  const detailMutation = useMutation({
    mutationFn: updateProfileDetail,
    onSuccess: (message) => {
      setDetailError("");
      setDetailMessage(message);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (error) => {
      setDetailMessage("");
      setDetailError(error instanceof Error ? error.message : "Failed to update details.");
    },
  });

  const usernameMutation = useMutation({
    mutationFn: updateProfileUsername,
    onSuccess: (message) => {
      setUsernameError("");
      setUsernameMessage(message);
      setUsernameCode("");
      setIsUsernameConfirmStepOpen(true);
    },
    onError: (error) => {
      setUsernameMessage("");
      setUsernameError(error instanceof Error ? error.message : "Failed to update username.");
      setIsUsernameConfirmStepOpen(false);
    },
  });

  const usernameConfirmMutation = useMutation({
    mutationFn: updateProfileUsernameConfirm,
    onSuccess: (message) => {
      setUsernameError("");
      setUsernameMessage(message);
      setUsernameCode("");
      setIsUsernameConfirmStepOpen(false);
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (error) => {
      setUsernameMessage("");
      setUsernameError(error instanceof Error ? error.message : "Failed to confirm username.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: updateProfilePassword,
    onSuccess: (message) => {
      setPasswordError("");
      setPasswordMessage(message);
      setPasswordForm({
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      setPasswordMessage("");
      setPasswordError(error instanceof Error ? error.message : "Failed to update password.");
    },
  });

  const uploadAndApplyPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const attach = await uploadAttachFile(file);
      if (!attach.id) {
        throw new Error("Upload succeeded, but attach id was not returned.");
      }

      const message = await updateProfilePhoto(attach.id);
      return {
        attach,
        message,
      };
    },
    onSuccess: ({ message }) => {
      setPhotoError("");
      setPhotoMessage(message);
      if (photoFileInputRef.current) {
        photoFileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (error) => {
      setPhotoMessage("");
      setPhotoError(error instanceof Error ? error.message : "Failed to upload and apply photo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMyProfile,
    onSuccess: () => {
      clearSession();
      navigate("/auth/login", { replace: true });
    },
    onError: (error) => {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account.");
    },
  });

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  const profile = profileQuery.data;
  const profilePhotoSrc = useMemo(
    () => resolvePhotoSrc(profile?.photo),
    [profile?.photo?.id, profile?.photo?.originName, profile?.photo?.url],
  );

  useEffect(() => {
    setPhotoLoadError(false);
    setIsPhotoPreviewOpen(false);
  }, [profilePhotoSrc]);

  useEffect(() => {
    if (!isPhotoPreviewOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPhotoPreviewOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPhotoPreviewOpen]);

  const submitDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (detailForm.name.trim().length < 2 || detailForm.surname.trim().length < 2) {
      setDetailMessage("");
      setDetailError("Name and surname must be at least 2 characters.");
      return;
    }

    detailMutation.mutate({
      name: detailForm.name.trim(),
      surname: detailForm.surname.trim(),
    });
  };

  const submitUsername = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (usernameCandidate.trim().length < 3) {
      setUsernameMessage("");
      setUsernameError("Username must be at least 3 characters.");
      return;
    }

    usernameMutation.mutate({ username: usernameCandidate.trim() });
  };

  const submitUsernameCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usernameCode.trim()) {
      setUsernameMessage("");
      setUsernameError("Code is required.");
      return;
    }

    usernameConfirmMutation.mutate({ code: usernameCode.trim() });
  };

  const submitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordForm.newPassword) {
      setPasswordMessage("");
      setPasswordError("New password is required.");
      return;
    }
    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordMessage("");
      setPasswordError(
        "New password must be at least 8 chars and include uppercase, lowercase, and number.",
      );
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("");
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    passwordMutation.mutate({
      newPassword: passwordForm.newPassword,
    });
  };

  const openPhotoPicker = () => {
    if (photoFileInputRef.current) {
      photoFileInputRef.current.value = "";
      photoFileInputRef.current.click();
    }
  };

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoMessage("");
    setPhotoError("");
    uploadAndApplyPhotoMutation.mutate(file);
  };

  const submitDelete = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteError("");
    deleteMutation.mutate(session.id);
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <Card className="border-border/80 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-primary" aria-hidden />
            <CardTitle className="text-2xl">Account Settings</CardTitle>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">Account Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {profileQuery.isLoading ? (
            <Message type="info">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading profile...
              </span>
            </Message>
          ) : null}

          {profileQuery.isError ? (
            <Message type="error">
              {profileQuery.error instanceof Error
                ? profileQuery.error.message
                : "Failed to load profile."}
            </Message>
          ) : null}

          <div className="mb-3 flex items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
            {profilePhotoSrc && !photoLoadError ? (
              <button
                type="button"
                className="size-20 overflow-hidden rounded-xl border border-border/70 bg-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                onClick={() => setIsPhotoPreviewOpen(true)}
                aria-label="Open profile photo preview"
                title="Open profile photo"
              >
                <img
                  src={profilePhotoSrc}
                  alt={`${profile?.name ?? session.username} profile photo`}
                  className="size-full object-cover"
                  onError={() => setPhotoLoadError(true)}
                />
              </button>
            ) : (
              <div className="size-20 overflow-hidden rounded-xl border border-border/70 bg-card">
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <UserRound className="size-8" aria-hidden />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground">
                {profilePhotoSrc && !photoLoadError
                  ? "Photo loaded from profile data. Click the image to enlarge."
                  : "No valid photo found. Use Edit photo to upload one."}
              </p>
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoFileChange}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openPhotoPicker}
                disabled={uploadAndApplyPhotoMutation.isPending}
              >
                {uploadAndApplyPhotoMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Uploading...
                  </>
                ) : (
                  "Edit photo"
                )}
              </Button>
            </div>
          </div>

          {photoMessage ? <Message type="success">{photoMessage}</Message> : null}
          {photoError ? <Message type="error">{photoError}</Message> : null}

          <p>
            <span className="text-muted-foreground">id:</span> {profile?.id ?? session.id}
          </p>
          <p>
            <span className="text-muted-foreground">name:</span> {profile?.name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">surname:</span> {profile?.surname ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">username:</span> {profile?.username ?? session.username}
          </p>
          <p>
            <span className="text-muted-foreground">role:</span> {getRoleLabel(profile?.role ?? session.role)}
          </p>
          <p>
            <span className="text-muted-foreground">departmentId:</span>{" "}
            {profile?.departmentId ?? session.departmentId ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">buildingId:</span>{" "}
            {profile?.buildingId ?? session.buildingId ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">photoId:</span> {profile?.photo?.id ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">isEmployee:</span>{" "}
            {profile?.isEmployee === undefined
              ? session.isEmployee === undefined
                ? "-"
                : String(session.isEmployee)
              : String(profile.isEmployee)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-lg">Account Actions</CardTitle>
          <CardDescription>
            All update operations are grouped in one section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Update Profile Details</h3>
            </div>
            {detailMessage ? <Message type="success">{detailMessage}</Message> : null}
            {detailError ? <Message type="error">{detailError}</Message> : null}
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitDetails}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={detailForm.name}
                  onChange={(event) =>
                    setDetailForm((previous) => ({ ...previous, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  value={detailForm.surname}
                  onChange={(event) =>
                    setDetailForm((previous) => ({ ...previous, surname: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={detailMutation.isPending}>
                  {detailMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" aria-hidden />
                      Save details
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>

          <div className="border-t border-border/70" />

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Update Username</h3>
            </div>
            {usernameMessage ? <Message type="success">{usernameMessage}</Message> : null}
            {usernameError ? <Message type="error">{usernameError}</Message> : null}

            <form className="space-y-3" onSubmit={submitUsername}>
              <div className="space-y-2">
                <Label htmlFor="username">New username</Label>
                <Input
                  id="username"
                  value={usernameCandidate}
                  onChange={(event) => {
                    setUsernameCandidate(event.target.value);
                    setUsernameMessage("");
                    setUsernameError("");
                    setUsernameCode("");
                    setIsUsernameConfirmStepOpen(false);
                  }}
                />
              </div>
              <Button type="submit" disabled={usernameMutation.isPending}>
                {usernameMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sending request...
                  </>
                ) : (
                  "Send username update code"
                )}
              </Button>
            </form>

            {isUsernameConfirmStepOpen ? (
              <form className="space-y-3" onSubmit={submitUsernameCode}>
                <div className="space-y-2">
                  <Label htmlFor="username-code">Confirmation code</Label>
                  <Input
                    id="username-code"
                    value={usernameCode}
                    onChange={(event) => setUsernameCode(event.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline" disabled={usernameConfirmMutation.isPending}>
                  {usernameConfirmMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="size-4" aria-hidden />
                      Confirm username code
                    </>
                  )}
                </Button>
              </form>
            ) : null}
          </section>

          <div className="border-t border-border/70" />

          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Update Password</h3>
            </div>
            {passwordMessage ? <Message type="success">{passwordMessage}</Message> : null}
            {passwordError ? <Message type="error">{passwordError}</Message> : null}
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitPassword}>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({ ...previous, newPassword: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Updating...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </div>
            </form>
          </section>

          <div className="border-t border-border/70" />

          <section className="space-y-4 rounded-lg border border-danger/35 bg-danger/5 p-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-danger">Danger Zone</h3>
            </div>
            <Message type="info">
              <span className="inline-flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4" aria-hidden />
                This action permanently deletes the currently authenticated account.
              </span>
            </Message>
            {deleteError ? <Message type="error">{deleteError}</Message> : null}
            <form className="space-y-4" onSubmit={submitDelete}>
              <Button type="submit" variant="destructive" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" aria-hidden />
                    Delete account
                  </>
                )}
              </Button>
            </form>
          </section>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle className="text-base">Security Note</CardTitle>
        </CardHeader>
        <CardContent className="flex items-start gap-2 text-sm text-muted-foreground">
          <UserRound className="mt-0.5 size-4" aria-hidden />
          This module is shared across all roles with identical UI and behavior.
        </CardContent>
      </Card>

      {isPhotoPreviewOpen && profilePhotoSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Profile photo preview"
          onClick={() => setIsPhotoPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl rounded-xl border border-white/15 bg-black/40 p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3 z-10"
              onClick={() => setIsPhotoPreviewOpen(false)}
              aria-label="Close photo preview"
            >
              <X className="size-4" aria-hidden />
            </Button>
            <img
              src={profilePhotoSrc}
              alt={`${profile?.name ?? session.username} profile photo enlarged preview`}
              className="mx-auto max-h-[85vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
