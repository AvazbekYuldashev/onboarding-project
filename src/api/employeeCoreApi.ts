import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { EmployeePageResponse, EmployeeResponseDTO } from "@/types/employeeCore";

const EMPLOYEE_CORE_BASE_PATH = "/api/v1/employee-core";
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

function normalizeEmployee(payload: unknown): EmployeeResponseDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid employee response.");
  }

  return {
    id: readString(payload.id),
    name: readString(payload.name),
    surname: readString(payload.surname),
    username: readString(payload.username),
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
    createdDate: readString(payload.createdDate) || undefined,
    inProgress: typeof payload.inProgress === "boolean" ? payload.inProgress : undefined,
  };
}

function normalizeEmployeePage(payload: unknown): EmployeePageResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid employees page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeEmployee(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function getEmployeesByDepartment(
  departmentId: string,
  page = 1,
  size = 10,
): Promise<EmployeePageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${EMPLOYEE_CORE_BASE_PATH}/by-department/${encodeURIComponent(departmentId)}`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeEmployeePage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load employees by department.");
  }
}

export async function getEmployeesByBuilding(
  buildingId: string,
  page = 1,
  size = 10,
): Promise<EmployeePageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${EMPLOYEE_CORE_BASE_PATH}/by-building/${encodeURIComponent(buildingId)}`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeEmployeePage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load employees by building.");
  }
}

export async function getEmployeeById(id: string): Promise<EmployeeResponseDTO> {
  try {
    const response = await apiClient.get<unknown>(
      `${EMPLOYEE_CORE_BASE_PATH}/${encodeURIComponent(id)}`,
      withLanguage(),
    );
    return normalizeEmployee(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load employee by id.");
  }
}
