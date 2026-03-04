export interface OfferingResponseDTO {
  id: string;
  title: string;
  description: string;
  kpiBall?: number;
  deadline?: number;
  categoryId: string;
  departmentId: string;
  buildingId: string;
  visible?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface OfferingOwnerCreateDTO {
  title: string;
  description: string;
  kpiBall: number;
  deadline: number;
  categoryId: string;
  buildingId: string;
  departmentId: string;
}

export interface OfferingOwnerUpdateDTO {
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
