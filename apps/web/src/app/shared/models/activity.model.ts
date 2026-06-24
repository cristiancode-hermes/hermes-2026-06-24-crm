export interface Activity {
  id: number;
  type: 'note' | 'call' | 'email' | 'meeting';
  description: string;
  date: Date;
  contactId?: number;
  dealId?: number;
  organizationId: number;
  createdAt: Date;
}
