import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import { resolveProfileRole } from "@/features/auth/roles";
import { resolveGeneralStatus } from "@/features/auth/statuses";
import type { AppResponse } from "@/types/auth";
import type {
  PageResponse,
  ProfileOwnerChangeBuildingDTO,
  ProfileOwnerChangeDepartmentDTO,
  ProfileOwnerChangeRoleDTO,
  ProfileOwnerChangeStatusDTO,
  ProfileOwnerCreateDTO,
  ProfileOwnerFilterDTO,
  ProfileOwnerPhotoUpdateDTO,
  ProfileOwnerUpdatePasswordDTO,
  ProfileResponseOwnerDTO,
} from "@/types/profileOwner";

const PROFILE_OWNER_BASE_PATH = "/api/v1/profile-owner";
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function extractErrorMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!isRecord(value)) {
    return "";
  }

  const directMessage = readString(value.message ?? value.error ?? value.detail);
  if (directMessage) {
    return directMessage;
  }

  const validationErrors = value.errors;
  if (Array.isArray(validationErrors)) {
    const firstError = validationErrors.find((entry) => typeof entry === "string");
    if (typeof firstError === "string") {
      return firstError;
    }
  }

  if (isRecord(validationErrors)) {
    const firstFieldError = Object.values(validationErrors).find((entry) => typeof entry === "string");
    if (typeof firstFieldError === "string") {
      return firstFieldError;
    }
  }

  return "";
}

function parseAxiosError(error: unknown, fallbackMessage: string): Error {
  if (!axios.isAxiosError(error)) {
    return new Error(fallbackMessage);
  }

  const responseMessage = extractErrorMessage(error.response?.data);
  if (responseMessage) {
    return new Error(responseMessage);
  }

  if (error.response?.status === 401) {
    return new Error("Unauthorized request.");
  }

  if (error.response?.status === 403) {
    return new Error("Forbidden request.");
  }

  return new Error(fallbackMessage);
}

function withLanguage(): AxiosRequestConfig {
  return {
    headers: {
      "Accept-Language": getAppLanguage(),
    },
  };
}

function normalizeMessageResponse(payload: unknown, fallbackMessage: string): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallbackMessage;
  }

  return readString(payload.message ?? payload.data ?? payload.result ?? payload.content, fallbackMessage);
}

function normalizeOwnerProfile(payload: unknown): ProfileResponseOwnerDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid owner profile response.");
  }

  return {
    id: readString(payload.id),
    name: readString(payload.name),
    surname: readString(payload.surname),
    username: readString(payload.username),
    photoId: readString(payload.photoId) || undefined,
    photo: isRecord(payload.photo)
      ? {
          id: readString(payload.photo.id) || undefined,
          originName: readString(payload.photo.originName ?? payload.photo.name) || undefined,
          size:
            typeof payload.photo.size === "number" && Number.isFinite(payload.photo.size)
              ? payload.photo.size
              : undefined,
          extension: readString(payload.photo.extension) || undefined,
          createdData: readString(payload.photo.createdData ?? payload.photo.createdDate) || undefined,
          url: readString(payload.photo.url) || undefined,
        }
      : undefined,
    status: resolveGeneralStatus(readString(payload.status)),
    buildingId: readString(payload.buildingId) || undefined,
    departmentId: readString(payload.departmentId) || undefined,
    role: resolveProfileRole(readString(payload.role)),
    createdDate: readString(payload.createdDate) || undefined,
    isEmployee: typeof payload.isEmployee === "boolean" ? payload.isEmployee : undefined,
  };
}

function normalizeOwnerPage(payload: unknown): PageResponse<ProfileResponseOwnerDTO> {
  if (!isRecord(payload)) {
    throw new Error("Invalid page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeOwnerProfile(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function createOwnerProfile(payload: ProfileOwnerCreateDTO): Promise<ProfileResponseOwnerDTO> {
  try {
    const response = await apiClient.post<unknown>(
      `${PROFILE_OWNER_BASE_PATH}/create`,
      payload,
      withLanguage(),
    );
    return normalizeOwnerProfile(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to create user.");
  }
}

export async function getOwnerProfiles(page = 1, size = 10): Promise<PageResponse<ProfileResponseOwnerDTO>> {
  try {
    const response = await apiClient.get<unknown>(`${PROFILE_OWNER_BASE_PATH}/all`, {
      ...withLanguage(),
      params: {
        page,
        size,
      },
    });
    return normalizeOwnerPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load users.");
  }
}

export async function filterOwnerProfiles(
  payload: ProfileOwnerFilterDTO,
  page = 1,
  size = 10,
): Promise<PageResponse<ProfileResponseOwnerDTO>> {
  try {
    const response = await apiClient.post<unknown>(
      `${PROFILE_OWNER_BASE_PATH}/filter`,
      payload,
      {
        ...withLanguage(),
        params: {
          page,
          size,
        },
      },
    );
    return normalizeOwnerPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to filter users.");
  }
}

export async function updateOwnerDepartment(payload: ProfileOwnerChangeDepartmentDTO): Promise<string> {
  try {
    const response = await apiClient.patch<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/department`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Department updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update department.");
  }
}

export async function updateOwnerBuilding(payload: ProfileOwnerChangeBuildingDTO): Promise<string> {
  try {
    const response = await apiClient.patch<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/building`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Building updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update building.");
  }
}

export async function updateOwnerPhoto(payload: ProfileOwnerPhotoUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/photo`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Photo updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update photo.");
  }
}

export async function updateOwnerStatus(payload: ProfileOwnerChangeStatusDTO): Promise<string> {
  try {
    const response = await apiClient.patch<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/status`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Status updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update status.");
  }
}

export async function updateOwnerRole(payload: ProfileOwnerChangeRoleDTO): Promise<string> {
  try {
    const response = await apiClient.patch<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/role`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Role updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update role.");
  }
}

export async function updateOwnerPassword(payload: ProfileOwnerUpdatePasswordDTO): Promise<string> {
  try {
    const response = await apiClient.patch<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/password`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Password updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update password.");
  }
}

export async function deleteOwnerProfile(id: string): Promise<string> {
  try {
    const response = await apiClient.delete<AppResponse<string>>(
      `${PROFILE_OWNER_BASE_PATH}/${encodeURIComponent(id)}`,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "User deleted.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to delete user.");
  }
}
