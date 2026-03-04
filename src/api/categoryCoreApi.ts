import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { CategoryResponseDTO } from "@/types/categoryOwner";
import type { CategoryPageResponse } from "@/types/categoryManager";

const CATEGORY_CORE_BASE_PATH = "/api/v1/category-core";
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

function normalizeCategory(payload: unknown): CategoryResponseDTO {
  if (!isRecord(payload)) throw new Error("Invalid category response.");
  return {
    id: readString(payload.id),
    title: readString(payload.title),
    description: readString(payload.description),
    departmentId: readString(payload.departmentId),
    buildingId: readString(payload.buildingId),
    visible: typeof payload.visible === "boolean" ? payload.visible : undefined,
    createdDate: readString(payload.createdDate) || undefined,
    updatedDate: readString(payload.updatedDate) || undefined,
  };
}

function normalizeCategoryPage(payload: unknown): CategoryPageResponse {
  if (!isRecord(payload)) throw new Error("Invalid category page response.");
  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeCategory(entry))
    : [];
  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function getCategoryById(id: string): Promise<CategoryResponseDTO> {
  try {
    const response = await apiClient.get<unknown>(
      `${CATEGORY_CORE_BASE_PATH}/by-id/${encodeURIComponent(id)}`,
      withLanguage(),
    );
    return normalizeCategory(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load category by id.");
  }
}

export async function getCategoriesByDepartment(
  departmentId: string,
  page = 1,
  size = 10,
): Promise<CategoryPageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${CATEGORY_CORE_BASE_PATH}/by-department-id/${encodeURIComponent(departmentId)}`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeCategoryPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load categories by department.");
  }
}

export async function getCategoriesByBuilding(
  buildingId: string,
  page = 1,
  size = 10,
): Promise<CategoryPageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${CATEGORY_CORE_BASE_PATH}/by-building-id/${encodeURIComponent(buildingId)}`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeCategoryPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load categories by building.");
  }
}
