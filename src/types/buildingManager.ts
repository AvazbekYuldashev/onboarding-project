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

export interface BuildingManagerCreateDTO {
  title: string;
  description: string;
  chiefId: string;
}

export interface BuildingManagerUpdateDTO {
  id: string;
  title: string;
  description: string;
  chiefId: string;
}

export interface BuildingAdminUpdateDTO {
  id: string;
  title: string;
  description: string;
}

export interface BuildingPageResponse {
  content: BuildingResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
