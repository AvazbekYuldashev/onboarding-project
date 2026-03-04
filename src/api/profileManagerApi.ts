import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import { resolveProfileRole } from "@/features/auth/roles";
import { resolveGeneralStatus } from "@/features/auth/statuses";
import type { ProfileOwnerFilterDTO, PageResponse, ProfileResponseOwnerDTO } from "@/types/profileOwner";

const PROFILE_MANAGER_BASE_PATH =
  import.meta.env.VITE_PROFILE_MANAGER_BASE_PATH?.trim() || "/api/v1/profile-owner";
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function extractErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";
  const directMessage = readString(value.message ?? value.error ?? value.detail);
  if (directMessage) return directMessage;
  return "";
}

function parseAxiosError(error: unknown, fallbackMessage: string): Error {
  if (!axios.isAxiosError(error)) return new Error(fallbackMessage);
  const responseMessage = extractErrorMessage(error.response?.data);
  if (responseMessage) return new Error(responseMessage);
  if (error.response?.status === 401) return new Error("Unauthorized request.");
  if (error.response?.status === 403) return new Error("Forbidden request.");
  return new Error(fallbackMessage);
}

function withLanguage(): AxiosRequestConfig {
  return {
    headers: {
      "Accept-Language": getAppLanguage(),
    },
  };
}

function normalizeManagerUser(payload: unknown): ProfileResponseOwnerDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid users response.");
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

function normalizeManagerUsersPage(payload: unknown): PageResponse<ProfileResponseOwnerDTO> {
  if (!isRecord(payload)) {
    throw new Error("Invalid page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeManagerUser(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function getManagerUsers(page = 1, size = 10): Promise<PageResponse<ProfileResponseOwnerDTO>> {
  try {
    const response = await apiClient.get<unknown>(`${PROFILE_MANAGER_BASE_PATH}/all`, {
      ...withLanguage(),
      params: { page, size },
    });
    return normalizeManagerUsersPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load users.");
  }
}

export async function filterManagerUsers(
  payload: ProfileOwnerFilterDTO,
  page = 1,
  size = 10,
): Promise<PageResponse<ProfileResponseOwnerDTO>> {
  try {
    const response = await apiClient.post<unknown>(
      `${PROFILE_MANAGER_BASE_PATH}/filter`,
      payload,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeManagerUsersPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to filter users.");
  }
}
