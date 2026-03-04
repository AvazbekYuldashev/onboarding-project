export interface DepartmentResponseDTO {
  id: string;
  title: string;
  description: string;
  chiefId: string;
  visible?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface DepartmentOwnerCreateDTO {
  title: string;
  description: string;
  chiefId: string;
}

export interface DepartmentOwnerUpdateDTO {
  id: string;
  title: string;
  description: string;
  chiefId: string;
}

export interface DepartmentManagerUpdateDTO {
  id: string;
  title: string;
  description: string;
}

export interface DepartmentPageResponse {
  content: DepartmentResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
