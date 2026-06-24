export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organizationId: number;
  orgName?: string;
}
