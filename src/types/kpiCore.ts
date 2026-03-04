export interface KpiResponseDTO {
  employeeId: string;
  employeeName: string;
  employeeSurname: string;
  totalCount?: number;
  acceptedTaskCount?: number;
  rejectedTaskCount?: number;
  completedTaskCount?: number;
  totalScore?: number;
}

export interface KpiPageResponse {
  content: KpiResponseDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
