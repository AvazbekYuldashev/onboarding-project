import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import { resolveProfileRole } from "@/features/auth/roles";
import { resolveGeneralStatus } from "@/features/auth/statuses";
import type {
  AppResponse,
  CodeConfirmDTO,
  ProfileDTO,
  ProfileDetailUpdateDTO,
  ProfilePasswordUpdateDTO,
  ProfileUsernameUpdateDTO,
} from "@/types/auth";

const PROFILE_BASE_PATH = "/api/v1/profile";
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
    return new Error("Unauthorized request. Please login again.");
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

function normalizeAppResponseMessage(payload: unknown, fallbackMessage: string): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallbackMessage;
  }

  return readString(payload.message ?? payload.data ?? payload.result ?? payload.content, fallbackMessage);
}

function normalizeProfile(payload: unknown): ProfileDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid profile response.");
  }

  return {
    id: readString(payload.id),
    name: readString(payload.name),
    surname: readString(payload.surname),
    username: readString(payload.username),
    role: resolveProfileRole(readString(payload.role)),
    status: resolveGeneralStatus(readString(payload.status)),
    departmentId: readString(payload.departmentId) || undefined,
    buildingId: readString(payload.buildingId) || undefined,
    jwt: readString(payload.jwt) || undefined,
    createdDate: readString(payload.createdDate) || undefined,
    isEmployee: typeof payload.isEmployee === "boolean" ? payload.isEmployee : undefined,
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
  };
}

export async function getMyProfile(): Promise<ProfileDTO> {
  const paths = [PROFILE_BASE_PATH, `${PROFILE_BASE_PATH}/my`, `${PROFILE_BASE_PATH}/me`];
  try {
    for (const path of paths) {
      try {
        const response = await apiClient.get<unknown>(path, withLanguage());
        return normalizeProfile(response.data);
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          throw error;
        }
        const status = error.response?.status;
        if (status === 404 || status === 405) {
          continue;
        }
        throw error;
      }
    }
    throw new Error("Profile endpoint not found.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to load account profile.");
  }
}

export async function updateProfileDetail(payload: ProfileDetailUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${PROFILE_BASE_PATH}/detail`,
      payload,
      withLanguage(),
    );
    return normalizeAppResponseMessage(response.data, "Profile details updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update profile details.");
  }
}

export async function updateProfilePhoto(photoId: string): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${PROFILE_BASE_PATH}/photo/${encodeURIComponent(photoId)}`,
      null,
      withLanguage(),
    );
    return normalizeAppResponseMessage(response.data, "Profile photo updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update profile photo.");
  }
}

export async function updateProfilePassword(payload: ProfilePasswordUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${PROFILE_BASE_PATH}/password`,
      payload,
      withLanguage(),
    );
    return normalizeAppResponseMessage(response.data, "Password updated successfully.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update password.");
  }
}

export async function updateProfileUsername(payload: ProfileUsernameUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${PROFILE_BASE_PATH}/username`,
      payload,
      withLanguage(),
    );
    return normalizeAppResponseMessage(
      response.data,
      "Username update request accepted. Confirmation code sent.",
    );
  } catch (error) {
    throw parseAxiosError(error, "Failed to update username.");
  }
}

export async function updateProfileUsernameConfirm(payload: CodeConfirmDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${PROFILE_BASE_PATH}/username/confirm`,
      payload,
      withLanguage(),
    );
    return normalizeAppResponseMessage(response.data, "Username updated successfully.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to confirm username update.");
  }
}

export async function deleteMyProfile(profileId: string): Promise<string> {
  try {
    const response = await apiClient.delete<AppResponse<string>>(
      `${PROFILE_BASE_PATH}/${encodeURIComponent(profileId)}`,
      withLanguage(),
    );
    return normalizeAppResponseMessage(response.data, "Account deleted successfully.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to delete account.");
  }
}
