import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { AppResponse } from "@/types/auth";
import type {
  ApplicationCreateDTO,
  ApplicationPageResponse,
  ApplicationResponseDTO,
  ApplicationStatus,
  ApplicationStatusDTO,
} from "@/types/applicationOwner";

const APPLICATION_CORE_BASE_PATH = "/api/v1/application-core";
const APPLICATION_STATUSES: ApplicationStatus[] = [
  "SENT",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "REVIEW",
  "DENIED",
  "COMPLETED",
];
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
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

function normalizeStatus(value: unknown): ApplicationStatus | undefined {
  if (typeof value !== "string") return undefined;
  return APPLICATION_STATUSES.includes(value as ApplicationStatus) ? (value as ApplicationStatus) : undefined;
}

function normalizeMessageResponse(payload: unknown, fallbackMessage: string): string {
  if (typeof payload === "string") return payload;
  if (!isRecord(payload)) return fallbackMessage;
  return readString(payload.message ?? payload.data ?? payload.result ?? payload.content, fallbackMessage);
}

function normalizeApplication(payload: unknown): ApplicationResponseDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid application response.");
  }

  return {
    id: readString(payload.id),
    title: readString(payload.title),
    description: readString(payload.description),
    status: normalizeStatus(payload.status),
    kpiBall: readNumber(payload.kpiBall),
    kpiBallLimit: readNumber(payload.kpiBallLimit),
    deadline: readNumber(payload.deadline),
    visible: typeof payload.visible === "boolean" ? payload.visible : undefined,
    sendProfileId: readString(payload.sendProfileId),
    sendProfileFullName: readString(payload.sendProfileFullName),
    acceptorProfileId: readString(payload.acceptorProfileId),
    acceptorProfileFullName: readString(payload.acceptorProfileFullName),
    departmentId: readString(payload.departmentId),
    departmentTitle: readString(payload.departmentTitle),
    buildingId: readString(payload.buildingId),
    buildingTitle: readString(payload.buildingTitle),
    categoryId: readString(payload.categoryId),
    categoryTitle: readString(payload.categoryTitle),
    offeringId: readString(payload.offeringId),
    offeringTitle: readString(payload.offeringTitle),
    createdDate: readString(payload.createdDate) || undefined,
    adminCheckedDate: readString(payload.adminCheckedDate) || undefined,
    employeeApprovedDate: readString(payload.employeeApprovedDate) || undefined,
    employeeEndDate: readString(payload.employeeEndDate) || undefined,
    limitDate: readString(payload.limitDate) || undefined,
    updatedDate: readString(payload.updatedDate) || undefined,
  };
}

function normalizeApplicationPage(payload: unknown): ApplicationPageResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid applications page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeApplication(entry))
    : [];

  return {
    content,
    totalElements: Number(readString(payload.totalElements, "0")) || 0,
    totalPages: Number(readString(payload.totalPages, "0")) || 0,
    number: Number(readString(payload.number, "0")) || 0,
    size: Number(readString(payload.size, "0")) || 0,
  };
}

export async function getMyApplications(page = 1, size = 10): Promise<ApplicationPageResponse> {
  try {
    const response = await apiClient.get<unknown>(
      `${APPLICATION_CORE_BASE_PATH}/by-my`,
      {
        ...withLanguage(),
        params: { page, size },
      },
    );
    return normalizeApplicationPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load my applications.");
  }
}

export async function createApplication(payload: ApplicationCreateDTO): Promise<ApplicationResponseDTO> {
  try {
    const response = await apiClient.post<unknown>(
      APPLICATION_CORE_BASE_PATH,
      payload,
      withLanguage(),
    );
    return normalizeApplication(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to create application.");
  }
}

export async function updateMyApplicationStatus(payload: ApplicationStatusDTO): Promise<string> {
  try {
    const response = await apiClient.patch<AppResponse<string>>(
      `${APPLICATION_CORE_BASE_PATH}/status`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Application status updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update application status.");
  }
}
