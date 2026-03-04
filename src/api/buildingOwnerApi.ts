import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { AppResponse } from "@/types/auth";
import type {
  BuildingOwnerCreateDTO,
  BuildingOwnerUpdateDTO,
  BuildingPageResponse,
  BuildingResponseDTO,
} from "@/types/buildingOwner";

const BUILDING_OWNER_BASE_PATH = "/api/v1/building-owner";
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
  return readString(value.message ?? value.error ?? value.detail);
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

function normalizeMessageResponse(payload: unknown, fallbackMessage: string): string {
  if (typeof payload === "string") return payload;
  if (!isRecord(payload)) return fallbackMessage;
  return readString(payload.message ?? payload.data ?? payload.result ?? payload.content, fallbackMessage);
}

function normalizeBuilding(payload: unknown): BuildingResponseDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid building response.");
  }

  return {
    id: readString(payload.id),
    title: readString(payload.title),
    description: readString(payload.description),
    chiefId: readString(payload.chiefId),
    departmentId: readString(payload.departmentId),
    createdDate: readString(payload.createdDate) || undefined,
    updatedDate: readString(payload.updatedDate) || undefined,
    visible: typeof payload.visible === "boolean" ? payload.visible : undefined,
  };
}

function normalizeBuildingPage(payload: unknown): BuildingPageResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid buildings page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeBuilding(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function createOwnerBuilding(payload: BuildingOwnerCreateDTO): Promise<BuildingResponseDTO> {
  try {
    const response = await apiClient.post<unknown>(
      `${BUILDING_OWNER_BASE_PATH}/create`,
      payload,
      withLanguage(),
    );
    return normalizeBuilding(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to create building.");
  }
}

export async function getOwnerBuildings(page = 1, size = 10): Promise<BuildingPageResponse> {
  try {
    const response = await apiClient.get<unknown>(`${BUILDING_OWNER_BASE_PATH}/all`, {
      ...withLanguage(),
      params: { page, size },
    });
    return normalizeBuildingPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load buildings.");
  }
}

export async function updateOwnerBuildingEntity(payload: BuildingOwnerUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${BUILDING_OWNER_BASE_PATH}/update`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Building updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update building.");
  }
}
