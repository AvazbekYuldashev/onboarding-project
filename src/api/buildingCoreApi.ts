import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { BuildingPageResponse, BuildingResponseDTO } from "@/types/buildingManager";

const BUILDING_CORE_BASE_PATH = "/api/v1/building-core";
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

export async function getBuildingById(id: string): Promise<BuildingResponseDTO> {
  try {
    const response = await apiClient.get<unknown>(
      `${BUILDING_CORE_BASE_PATH}/by-id/${encodeURIComponent(id)}`,
      withLanguage(),
    );
    return normalizeBuilding(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load building by id.");
  }
}

export async function getBuildingsByDepartment(
  departmentId: string,
  page = 1,
  size = 10,
): Promise<BuildingPageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${BUILDING_CORE_BASE_PATH}/department/${encodeURIComponent(departmentId)}`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeBuildingPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load buildings by department.");
  }
}

