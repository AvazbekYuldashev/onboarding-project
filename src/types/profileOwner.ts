import type { AttachDTO, ProfileRole } from "@/types/auth";
import type { GeneralStatus } from "@/types/status";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProfileResponseOwnerDTO {
  id: string;
  name: string;
  surname: string;
  username: string;
  photoId?: string;
  photo?: AttachDTO;
  status?: GeneralStatus;
  buildingId?: string;
  departmentId?: string;
  role: ProfileRole;
  createdDate?: string;
  isEmployee?: boolean;
}

export interface ProfileOwnerCreateDTO {
  name: string;
  surname: string;
  username: string;
  photoId?: string;
  status?: GeneralStatus;
  password: string;
  role: ProfileRole;
  departmentId?: string;
  buildingId?: string;
}

export interface ProfileOwnerChangeDepartmentDTO {
  id: string;
  departmentId: string;
}

export interface ProfileOwnerChangeBuildingDTO {
  id: string;
  buildingId: string;
}

export interface ProfileOwnerPhotoUpdateDTO {
  id: string;
  photoId: string;
}

export interface ProfileOwnerChangeStatusDTO {
  id: string;
  status: GeneralStatus;
}

export interface ProfileOwnerChangeRoleDTO {
  id: string;
  role: ProfileRole;
}

export interface ProfileOwnerUpdatePasswordDTO {
  id: string;
  password: string;
}

export interface ProfileOwnerFilterDTO {
  name?: string;
  surname?: string;
  username?: string;
}
