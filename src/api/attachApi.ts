import axios from "axios";
import { apiClient } from "@/api/client";
import type { AttachDTO } from "@/types/auth";

type UnknownRecord = Record<string, unknown>;
const ATTACH_BASE_PATH = "/api/v1/attach";

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function parseAxiosError(error: unknown, fallbackMessage: string): Error {
  if (!axios.isAxiosError(error)) {
    return new Error(fallbackMessage);
  }

  const payload = error.response?.data;
  if (typeof payload === "string") {
    return new Error(payload);
  }
  if (isRecord(payload)) {
    const message = readString(payload.message ?? payload.error ?? payload.detail);
    if (message) {
      return new Error(message);
    }
  }

  if (error.response?.status === 401) {
    return new Error("Unauthorized request. Please login again.");
  }

  return new Error(fallbackMessage);
}

function normalizeAttach(payload: unknown): AttachDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid attach response.");
  }

  return {
    id: readString(payload.id) || undefined,
    originName: readString(payload.originName) || undefined,
    size:
      typeof payload.size === "number" && Number.isFinite(payload.size)
        ? payload.size
        : undefined,
    extension: readString(payload.extension) || undefined,
    createdData: readString(payload.createdData ?? payload.createdDate) || undefined,
    url: readString(payload.url) || undefined,
  };
}

export async function uploadAttachFile(file: File): Promise<AttachDTO> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<unknown>(`${ATTACH_BASE_PATH}/upload`, formData);
    return normalizeAttach(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Failed to upload file.");
  }
}
