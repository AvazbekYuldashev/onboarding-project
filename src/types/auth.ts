import type { GeneralStatus } from "@/types/status";

export type AppLanguage = "UZ" | "RU" | "EN";
export type ProfileRole =
  | "ROLE_OWNER"
  | "ROLE_ADMIN"
  | "ROLE_MANAGER"
  | "ROLE_EMPLOYEE"
  | "ROLE_USER";

export interface AppResponse<T> {
  message?: string;
  data?: T;
  result?: T;
  content?: T;
}

export interface AttachDTO {
  id?: string;
  originName?: string;
  size?: number;
  extension?: string;
  createdData?: string;
  url?: string;
}

export interface RegistrationRequest {
  name: string;
  surname: string;
  username: string;
  password: string;
}

export interface RegistrationResponse {
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface EmailResendRequest {
  username: string;
}

export interface ResetPasswordRequest {
  username: string;
}

export interface ResetPasswordConfirmRequest {
  username: string;
  confirmCode: string;
  password: string;
}

export interface ProfileDTO {
  id: string;
  name: string;
  surname: string;
  username: string;
  photo?: AttachDTO;
  role: ProfileRole;
  status?: GeneralStatus;
  departmentId?: string;
  buildingId?: string;
  jwt?: string;
  createdDate?: string;
  isEmployee?: boolean;
}

export interface ProfileDetailUpdateDTO {
  name: string;
  surname: string;
}

export interface ProfilePasswordUpdateDTO {
  oldPassword?: string;
  newPassword: string;
}

export interface ProfileUsernameUpdateDTO {
  username: string;
}

export interface CodeConfirmDTO {
  code: string;
}

export interface AuthSession {
  id: string;
  username: string;
  departmentId?: string;
  buildingId?: string;
  role: ProfileRole;
  jwt?: string;
  isEmployee?: boolean;
}
