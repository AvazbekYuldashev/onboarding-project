import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { AppResponse } from "@/types/auth";
import type { DepartmentManagerUpdateDTO, DepartmentResponseDTO } from "@/types/departmentOwner";

const DEPARTMENT_MANAGER_BASE_PATH = "/api/v1/department-manager";
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
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

export async function getMyManagerDepartment(): Promise<DepartmentResponseDTO> {
  try {
    const response = await apiClient.get<unknown>(
      `${DEPARTMENT_MANAGER_BASE_PATH}/my`,
      withLanguage(),
    );
    return normalizeDepartment(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load my department.");
  }
}

export async function updateMyManagerDepartment(payload: DepartmentManagerUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${DEPARTMENT_MANAGER_BASE_PATH}/update`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Department updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update my department.");
  }
}

