export interface BuildingResponseDTO {
  id: string;
  title: string;
  description: string;
  chiefId: string;
  departmentId: string;
  createdDate?: string;
  updatedDate?: string;
  visible?: boolean;
}

export interface BuildingOwnerCreateDTO {
  title: string;
  description: string;
  chiefId: string;
  departmentId: string;
}

export interface BuildingOwnerUpdateDTO {
  id: string;
  title: string;
  description: string;
  chiefId: string;
  departmentId: string;
}

export interface BuildingPageResponse {
  content: BuildingResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
