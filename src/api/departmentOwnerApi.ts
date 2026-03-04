import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { AppResponse } from "@/types/auth";
import type {
  DepartmentOwnerCreateDTO,
  DepartmentOwnerUpdateDTO,
  DepartmentPageResponse,
  DepartmentResponseDTO,
} from "@/types/departmentOwner";

const DEPARTMENT_OWNER_BASE_PATH = "/api/v1/department-owner";
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

function normalizeDepartment(payload: unknown): DepartmentResponseDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid department response.");
  }

  return {
    id: readString(payload.id),
    title: readString(payload.title),
    description: readString(payload.description),
    chiefId: readString(payload.chiefId),
    visible: typeof payload.visible === "boolean" ? payload.visible : undefined,
    createdDate: readString(payload.createdDate) || undefined,
    updatedDate: readString(payload.updatedDate) || undefined,
  };
}

function normalizeDepartmentPage(payload: unknown): DepartmentPageResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid departments page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeDepartment(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function createOwnerDepartment(payload: DepartmentOwnerCreateDTO): Promise<DepartmentResponseDTO> {
  try {
    const response = await apiClient.post<unknown>(
      `${DEPARTMENT_OWNER_BASE_PATH}/create`,
      payload,
      withLanguage(),
    );
    return normalizeDepartment(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to create department.");
  }
}

export async function getOwnerDepartments(page = 1, size = 10): Promise<DepartmentPageResponse> {
  try {
    const response = await apiClient.get<unknown>(`${DEPARTMENT_OWNER_BASE_PATH}/all`, {
      ...withLanguage(),
      params: { page, size },
    });
    return normalizeDepartmentPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load departments.");
  }
}

export async function updateOwnerDepartmentEntity(payload: DepartmentOwnerUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${DEPARTMENT_OWNER_BASE_PATH}/update`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Department updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update department.");
  }
}
