import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { KpiPageResponse, KpiResponseDTO } from "@/types/kpiCore";

const KPI_CORE_BASE_PATH = "/api/v1/kpi-core";
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

function normalizeKpi(payload: unknown): KpiResponseDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid KPI response.");
  }

  return {
    employeeId: readString(payload.employeeId),
    employeeName: readString(payload.employeeName),
    employeeSurname: readString(payload.employeeSurname),
    totalCount:
      payload.totalCount === undefined || payload.totalCount === null
        ? undefined
        : readNumber(payload.totalCount),
    acceptedTaskCount:
      payload.acceptedTaskCount === undefined || payload.acceptedTaskCount === null
        ? undefined
        : readNumber(payload.acceptedTaskCount),
    rejectedTaskCount:
      payload.rejectedTaskCount === undefined || payload.rejectedTaskCount === null
        ? undefined
        : readNumber(payload.rejectedTaskCount),
    completedTaskCount:
      payload.completedTaskCount === undefined || payload.completedTaskCount === null
        ? undefined
        : readNumber(payload.completedTaskCount),
    totalScore:
      payload.totalScore === undefined || payload.totalScore === null
        ? undefined
        : readNumber(payload.totalScore),
  };
}

function normalizeKpiPage(payload: unknown): KpiPageResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid KPI page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeKpi(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function getEmployeeKpi(employeeId: string, page = 1, size = 10): Promise<KpiPageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${KPI_CORE_BASE_PATH}/by-employee/${encodeURIComponent(employeeId)}`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeKpiPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load employee KPI.");
  }
}
