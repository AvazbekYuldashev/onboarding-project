import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@/api/client";
import { getAppLanguage } from "@/features/auth/language";
import { resolveProfileRole } from "@/features/auth/roles";
import { resolveGeneralStatus } from "@/features/auth/statuses";
import type {
  EmailResendRequest,
  LoginRequest,
  ProfileDTO,
  RegistrationRequest,
  RegistrationResponse,
  ResetPasswordConfirmRequest,
  ResetPasswordRequest,
} from "@/types/auth";

const AUTH_BASE_PATH = "/api/v1/auth";

type UnknownRecord = Record<string, unknown>;

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

function extractErrorMessage(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (!isRecord(value)) {
    return "";
  }

  const directMessage = readString(value.message ?? value.error ?? value.detail);
  if (directMessage) {
    return directMessage;
  }

  const validationErrors = value.errors;
  if (Array.isArray(validationErrors)) {
    const firstError = validationErrors.find((entry) => typeof entry === "string");
    if (typeof firstError === "string") {
      return firstError;
    }
  }

  if (isRecord(validationErrors)) {
    const firstFieldError = Object.values(validationErrors).find((entry) => typeof entry === "string");
    if (typeof firstFieldError === "string") {
      return firstFieldError;
    }
  }

  return "";
}

function parseAxiosError(error: unknown, fallbackMessage: string): Error {
  if (!axios.isAxiosError(error)) {
    return new Error(fallbackMessage);
  }

  const responseMessage = extractErrorMessage(error.response?.data);
  if (responseMessage) {
    return new Error(responseMessage);
  }

  if (error.response?.status === 401) {
    return new Error("Unauthorized request.");
  }

  if (error.response?.status === 403) {
    return new Error("Forbidden request.");
  }

  return new Error(fallbackMessage);
}

function withLanguage(): AxiosRequestConfig {
  return {
    headers: {
      "Accept-Language": getAppLanguage(),
    },
  };
}

function normalizeMessageResponse(payload: unknown, fallbackMessage: string): RegistrationResponse {
  if (typeof payload === "string") {
    return { message: payload };
  }

  if (isRecord(payload)) {
    const message = readString(payload.message ?? payload.result ?? payload.data, fallbackMessage);
    return { message: message || fallbackMessage };
  }

  return { message: fallbackMessage };
}

function normalizeProfile(payload: unknown): ProfileDTO {
  if (!isRecord(payload)) {
    throw new Error("Invalid login response payload.");
  }

  return {
    id: readString(payload.id),
    name: readString(payload.name),
    surname: readString(payload.surname),
    username: readString(payload.username),
    role: resolveProfileRole(readString(payload.role)),
    status: resolveGeneralStatus(readString(payload.status)),
    departmentId: readString(payload.departmentId) || undefined,
    buildingId: readString(payload.buildingId) || undefined,
    jwt: readString(payload.jwt) || undefined,
    createdDate: readString(payload.createdDate) || undefined,
    isEmployee: typeof payload.isEmployee === "boolean" ? payload.isEmployee : undefined,
  };
}

export async function registerUser(
  payload: RegistrationRequest,
): Promise<RegistrationResponse> {
  try {
    const response = await apiClient.post(
      `${AUTH_BASE_PATH}/registration`,
      payload,
      withLanguage(),
    );

    return normalizeMessageResponse(response.data, "Registration successful.");
  } catch (error) {
    throw parseAxiosError(error, "Registration failed. Please check your data.");
  }
}

export async function verifyRegistrationEmail(
  token: string,
): Promise<RegistrationResponse> {
  try {
    const language = getAppLanguage();
    const response = await apiClient.get(
      `${AUTH_BASE_PATH}/registration/email-verification/${encodeURIComponent(token)}/${language}`,
    );
    return normalizeMessageResponse(response.data, "Email verification successful.");
  } catch (error) {
    throw parseAxiosError(error, "Email verification failed.");
  }
}

export async function loginUser(payload: LoginRequest): Promise<ProfileDTO> {
  try {
    const response = await apiClient.post(`${AUTH_BASE_PATH}/login`, payload, withLanguage());
    return normalizeProfile(response.data);
  } catch (error) {
    throw parseAxiosError(error, "Login failed. Please check username and password.");
  }
}

export async function resendRegistrationVerification(
  payload: EmailResendRequest,
): Promise<RegistrationResponse> {
  try {
    const response = await apiClient.post(
      `${AUTH_BASE_PATH}/registration/email-verification-resend`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Verification email resent.");
  } catch (error) {
    throw parseAxiosError(error, "Resend verification failed.");
  }
}

export async function requestPasswordReset(
  payload: ResetPasswordRequest,
): Promise<RegistrationResponse> {
  try {
    const response = await apiClient.post(`${AUTH_BASE_PATH}/reset-password`, payload, withLanguage());
    return normalizeMessageResponse(response.data, "Reset password request accepted.");
  } catch (error) {
    throw parseAxiosError(error, "Reset password request failed.");
  }
}

export async function confirmPasswordReset(
  payload: ResetPasswordConfirmRequest,
): Promise<RegistrationResponse> {
  try {
    const response = await apiClient.post(
      `${AUTH_BASE_PATH}/reset-password-confirm`,
      payload,
      withLanguage(),
    );
    return normalizeMessageResponse(response.data, "Password reset confirmed.");
  } catch (error) {
    throw parseAxiosError(error, "Reset password confirmation failed.");
  }
}
