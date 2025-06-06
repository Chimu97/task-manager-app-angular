export interface CreateTaskRequest {
  title: string;
  description?: string;
  estimatedTime: string;
  assignedUserId: number;
}
