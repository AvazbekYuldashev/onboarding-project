import type { CategoryResponseDTO } from "@/types/categoryOwner";

export interface CategoryManagerCreateDTO {
  title: string;
  description: string;
  departmentId?: string;
  buildingId?: string;
}

export interface CategoryManagerUpdateDTO {
  id: string;
  title: string;
  description: string;
  departmentId?: string;
  buildingId?: string;
}

export interface CategoryPageResponse {
  content: CategoryResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

