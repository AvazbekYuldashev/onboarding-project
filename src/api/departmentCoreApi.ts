import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { DepartmentPageResponse, DepartmentResponseDTO } from "@/types/departmentOwner";

const DEPARTMENT_CORE_BASE_PATH = "/api/v1/department-core";
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

export async function getMyDepartment(): Promise<DepartmentResponseDTO> {
  try {
    const response = await apiClient.get<unknown>(
      `${DEPARTMENT_CORE_BASE_PATH}/by-my`,
      withLanguage(),
    );
    return normalizeDepartment(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load my department.");
  }
}

export async function getDepartmentById(id: string): Promise<DepartmentResponseDTO> {
  try {
    const response = await apiClient.get<unknown>(
      `${DEPARTMENT_CORE_BASE_PATH}/by-id/${encodeURIComponent(id)}`,
      withLanguage(),
    );
    return normalizeDepartment(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load department by id.");
  }
}

export async function getAllCoreDepartments(page = 1, size = 200): Promise<DepartmentPageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${DEPARTMENT_CORE_BASE_PATH}/all`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeDepartmentPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load departments.");
  }
}
