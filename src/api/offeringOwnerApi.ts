import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import type { AppResponse } from "@/types/auth";
import type {
  OfferingOwnerCreateDTO,
  OfferingOwnerUpdateDTO,
  OfferingPageResponse,
  OfferingResponseDTO,
} from "@/types/offeringOwner";

const OFFERING_OWNER_BASE_PATH = "/api/v1/offering-owner";
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

function normalizeOffering(payload: unknown): OfferingResponseDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid offering response.");
  }

  return {
    id: readString(payload.id),
    title: readString(payload.title),
    description: readString(payload.description),
    kpiBall:
      payload.kpiBall === undefined || payload.kpiBall === null
        ? undefined
        : readNumber(payload.kpiBall),
    deadline:
      payload.deadline === undefined || payload.deadline === null
        ? undefined
        : readNumber(payload.deadline),
    categoryId: readString(payload.categoryId),
    departmentId: readString(payload.departmentId),
    buildingId: readString(payload.buildingId),
    visible: typeof payload.visible === "boolean" ? payload.visible : undefined,
    createdDate: readString(payload.createdDate) || undefined,
    updatedDate: readString(payload.updatedDate) || undefined,
  };
}

function normalizeOfferingPage(payload: unknown): OfferingPageResponse {
  if (!isRecord(payload)) {
    throw new Error("Invalid offerings page response.");
  }

  const content = Array.isArray(payload.content)
    ? payload.content.map((entry) => normalizeOffering(entry))
    : [];

  return {
    content,
    totalElements: readNumber(payload.totalElements),
    totalPages: readNumber(payload.totalPages),
    number: readNumber(payload.number),
    size: readNumber(payload.size),
  };
}

export async function createOwnerOffering(payload: OfferingOwnerCreateDTO): Promise<OfferingResponseDTO> {
  try {
    const response = await apiClient.post<unknown>(
      `${OFFERING_OWNER_BASE_PATH}/create`,
      payload,
      withLanguage(),
    );
    return normalizeOffering(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to create offering.");
  }
}

export async function getOwnerOfferings(page = 1, size = 10): Promise<OfferingPageResponse> {
  try {
    const response = await apiClient.get<unknown>(`${OFFERING_OWNER_BASE_PATH}/all`, {
      ...withLanguage(),
      params: { page, size },
    });
    return normalizeOfferingPage(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to load offerings.");
  }
}

export async function updateOwnerOfferingEntity(payload: OfferingOwnerUpdateDTO): Promise<string> {
  try {
    const response = await apiClient.put<AppResponse<string>>(
      `${OFFERING_OWNER_BASE_PATH}/update`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Offering updated.");
  } catch (error) {
    throw parseAxiosError(error, "Failed to update offering.");
  }
}
