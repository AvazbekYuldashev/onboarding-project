import type { OfferingResponseDTO } from "@/types/offeringOwner";

export interface OfferingManagerCreateDTO {
  title: string;
  description: string;
  kpiBall: number;
  deadline: number;
  categoryId: string;
  buildingId: string;
  departmentId: string;
}

export interface OfferingManagerUpdateDTO {
  id: string;
  title: string;
  description: string;
  kpiBall: number;
  deadline: number;
  categoryId: string;
  buildingId: string;
  departmentId: string;
}

export interface OfferingPageResponse {
  content: OfferingResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

