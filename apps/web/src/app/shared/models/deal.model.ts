import { Activity } from './activity.model';

export interface Deal {
  id: number;
  name: string;
  value: number;
  stage: string;
  position: number;
  expectedCloseDate?: Date;
  notes?: string;
  contactId: number;
  contactName?: string;
  organizationId: number;
  dealsCount?: number;
  activities?: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DealStatusUpdate {
  stage: string;
  position: number;
}
