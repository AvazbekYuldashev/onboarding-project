import type { AttachDTO } from "@/types/auth";

export interface EmployeeResponseDTO {
  id: string;
  name: string;
  surname: string;
  username: string;
  photo?: AttachDTO;
  createdDate?: string;
  inProgress?: boolean;
}

export interface EmployeePageResponse {
  content: EmployeeResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
