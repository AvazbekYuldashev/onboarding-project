export type ApplicationStatus =
  | "SENT"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DENIED"
  | "COMPLETED";

export interface ApplicationResponseDTO {
  id: string;
  title: string;
  description: string;
  comments?: string;
  status?: ApplicationStatus;
  kpiBall?: number;
  kpiBallLimit?: number;
  deadline?: number;
  visible?: boolean;
  sendProfileId: string;
  sendProfileFullName: string;
  acceptorProfileId: string;
  acceptorProfileFullName: string;
  departmentId: string;
  departmentTitle: string;
  buildingId: string;
  buildingTitle: string;
  categoryId: string;
  categoryTitle: string;
  offeringId: string;
  offeringTitle: string;
  createdDate?: string;
  adminCheckedDate?: string;
  employeeApprovedDate?: string;
  employeeEndDate?: string;
  limitDate?: string;
  updatedDate?: string;
}

export interface ApplicationStatusDTO {
  id: string;
  status: ApplicationStatus;
}

export interface ApplicationCreateDTO {
  title: string;
  description: string;
  comments: string;
  departmentId: string;
  buildingId: string;
  categoryId: string;
  offeringId: string;
}

export interface ApplicationFilterDTO {
  id?: string;
  title?: string;
  description?: string;
  status?: ApplicationStatus;
  kpiBall?: number;
  kpiBallLimit?: number;
  deadline?: number;
  visible?: boolean;
  sendProfileId?: string;
  acceptorProfileId?: string;
  departmentId?: string;
  buildingId?: string;
  categoryId?: string;
  offeringId?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  adminCheckedDateFrom?: string;
  adminCheckedDateTo?: string;
  employeeApprovedDateFrom?: string;
  employeeApprovedDateTo?: string;
  employeeEndDateFrom?: string;
  employeeEndDateTo?: string;
  limitDateFrom?: string;
  limitDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
}

export interface ApplicationPageResponse {
  content: ApplicationResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
