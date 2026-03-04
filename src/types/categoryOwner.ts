export interface CategoryResponseDTO {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  buildingId: string;
  visible?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CategoryOwnerCreateDTO {
  title: string;
  description: string;
  departmentId: string;
  buildingId: string;
}

export interface CategoryOwnerUpdateDTO {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  buildingId: string;
}

export interface CategoryPageResponse {
  content: CategoryResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
