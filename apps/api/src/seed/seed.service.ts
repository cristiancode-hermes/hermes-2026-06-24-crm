import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Deal } from '../deals/entities/deal.entity';
import { Activity } from '../activities/entities/activity.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async onModuleInit() {
    const orgCount = await this.orgRepository.count();
    if (orgCount > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }
    this.logger.log('Seeding database...');
    await this.seed();
    this.logger.log('Database seeded successfully!');
  }

  async seed() {
    // 1. Create organization
    const org = this.orgRepository.create({
      name: 'Acme Corporation',
      slug: 'acme-corp',
    });
    const savedOrg = await this.orgRepository.save(org);

    // 2. Create admin user
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('dev-secret', salt);

    const admin = this.userRepository.create({
      name: 'Admin',
      email: 'admin@acme.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      organizationId: savedOrg.id,
    });
    const savedAdmin = await this.userRepository.save(admin);

    // 3. Create demo user
    const demoSalt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('demo123', demoSalt);

    const demo = this.userRepository.create({
      name: 'Demo User',
      email: 'demo@crm.test',
      passwordHash: demoPasswordHash,
      role: 'admin',
      organizationId: savedOrg.id,
    });
    await this.userRepository.save(demo);

    // 4. Create 10 contacts
    const contactData = [
      {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        company: 'TechCorp',
        role: 'CEO',
        phone: '+52 555-1001',
      },
      {
        name: 'María García',
        email: 'maria@example.com',
        company: 'Innovate Inc',
        role: 'CTO',
        phone: '+52 555-1002',
      },
      {
        name: 'Carlos López',
        email: 'carlos@example.com',
        company: 'DataFlow',
        role: 'VP Sales',
        phone: '+52 555-1003',
      },
      {
        name: 'Ana Martínez',
        email: 'ana@example.com',
        company: 'CloudBase',
        role: 'Product Manager',
        phone: '+52 555-1004',
      },
      {
        name: 'Pedro Sánchez',
        email: 'pedro@example.com',
        company: 'SmartSys',
        role: 'Director',
        phone: '+52 555-1005',
      },
      {
        name: 'Laura Rodríguez',
        email: 'laura@example.com',
        company: 'NovaTech',
        role: 'Marketing Head',
        phone: '+52 555-1006',
      },
      {
        name: 'Roberto Fernández',
        email: 'roberto@example.com',
        company: 'GreenLeaf',
        role: 'Founder',
        phone: '+52 555-1007',
      },
      {
        name: 'Sofía Ramírez',
        email: 'sofia@example.com',
        company: 'BlueOcean',
        role: 'COO',
        phone: '+52 555-1008',
      },
      {
        name: 'Diego Morales',
        email: 'diego@example.com',
        company: 'PeakPerformance',
        role: 'Sales Lead',
        phone: '+52 555-1009',
      },
      {
        name: 'Valentina Ortiz',
        email: 'valentina@example.com',
        company: 'QuantumLeap',
        role: 'CEO',
        phone: '+52 555-1010',
      },
    ];

    const contacts = await this.contactRepository.save(
      contactData.map((c) =>
        this.contactRepository.create({
          ...c,
          notes: `Contact from ${c.company}`,
          organizationId: savedOrg.id,
        }),
      ),
    );

    // 4. Create 18 deals across all stages
    const stages = [
      'Nuevo',
      'Calificado',
      'Propuesta',
      'Negociación',
      'Cerrado Ganado',
      'Cerrado Perdido',
    ];
    const now = new Date();
    const dealData = [
      {
        name: 'Cloud Migration',
        value: 45000,
        stage: 'Nuevo',
        contactId: contacts[0].id,
        position: 0,
        expectedCloseDate: new Date(now.getTime() + 30 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Data Analytics Platform',
        value: 32000,
        stage: 'Nuevo',
        contactId: contacts[1].id,
        position: 1,
        expectedCloseDate: new Date(now.getTime() + 45 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'CRM Implementation',
        value: 28000,
        stage: 'Nuevo',
        contactId: contacts[2].id,
        position: 2,
        expectedCloseDate: null,
      },
      {
        name: 'Security Audit',
        value: 15000,
        stage: 'Calificado',
        contactId: contacts[3].id,
        position: 0,
        expectedCloseDate: new Date(now.getTime() + 20 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Mobile App Development',
        value: 50000,
        stage: 'Calificado',
        contactId: contacts[4].id,
        position: 1,
        expectedCloseDate: new Date(now.getTime() + 60 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Infrastructure Upgrade',
        value: 22000,
        stage: 'Calificado',
        contactId: contacts[5].id,
        position: 2,
        expectedCloseDate: null,
      },
      {
        name: 'AI Chatbot Integration',
        value: 35000,
        stage: 'Propuesta',
        contactId: contacts[0].id,
        position: 0,
        expectedCloseDate: new Date(now.getTime() + 14 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Cloud Training Program',
        value: 12000,
        stage: 'Propuesta',
        contactId: contacts[6].id,
        position: 1,
        expectedCloseDate: new Date(now.getTime() + 21 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'ERP Migration',
        value: 42000,
        stage: 'Propuesta',
        contactId: contacts[7].id,
        position: 2,
        expectedCloseDate: new Date(now.getTime() + 35 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'DevOps Consulting',
        value: 18000,
        stage: 'Negociación',
        contactId: contacts[1].id,
        position: 0,
        expectedCloseDate: new Date(now.getTime() + 7 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Digital Transformation',
        value: 48000,
        stage: 'Negociación',
        contactId: contacts[8].id,
        position: 1,
        expectedCloseDate: new Date(now.getTime() + 10 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'E-commerce Platform',
        value: 38000,
        stage: 'Negociación',
        contactId: contacts[9].id,
        position: 2,
        expectedCloseDate: new Date(now.getTime() + 5 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Web Redesign',
        value: 25000,
        stage: 'Cerrado Ganado',
        contactId: contacts[2].id,
        position: 0,
        expectedCloseDate: new Date(now.getTime() - 5 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Social Media Platform',
        value: 16000,
        stage: 'Cerrado Ganado',
        contactId: contacts[4].id,
        position: 1,
        expectedCloseDate: new Date(now.getTime() - 10 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'IT Support Contract',
        value: 9000,
        stage: 'Cerrado Ganado',
        contactId: contacts[6].id,
        position: 2,
        expectedCloseDate: new Date(now.getTime() - 2 * 86400000)
          .toISOString()
          .split('T')[0],
      },
      {
        name: 'Hardware Refresh',
        value: 30000,
        stage: 'Cerrado Perdido',
        contactId: contacts[3].id,
        position: 0,
        expectedCloseDate: null,
      },
      {
        name: 'Legacy System Migration',
        value: 40000,
        stage: 'Cerrado Perdido',
        contactId: contacts[5].id,
        position: 1,
        expectedCloseDate: null,
      },
      {
        name: 'Custom Software Dev',
        value: 55000,
        stage: 'Cerrado Perdido',
        contactId: contacts[7].id,
        position: 2,
        expectedCloseDate: null,
      },
    ];

    const deals = await this.dealRepository.save(
      dealData.map((d) =>
        this.dealRepository.create({
          ...d,
          notes: `Deal: ${d.name}`,
          organizationId: savedOrg.id,
        }),
      ),
    );

    // 5. Create 12 activities
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000)
      .toISOString()
      .split('T')[0];
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400000)
      .toISOString()
      .split('T')[0];
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000)
      .toISOString()
      .split('T')[0];

    const activityData = [
      {
        type: 'call',
        description: 'Initial discovery call with client',
        date: yesterday,
        contactId: contacts[0].id,
        dealId: deals[0].id,
      },
      {
        type: 'email',
        description: 'Sent proposal document for review',
        date: yesterday,
        contactId: contacts[1].id,
        dealId: deals[1].id,
      },
      {
        type: 'meeting',
        description: 'Demo presentation of the platform',
        date: twoDaysAgo,
        contactId: contacts[2].id,
        dealId: deals[2].id,
      },
      {
        type: 'note',
        description: 'Client requested additional features',
        date: twoDaysAgo,
        contactId: contacts[3].id,
        dealId: deals[3].id,
      },
      {
        type: 'call',
        description: 'Follow-up call to discuss pricing',
        date: threeDaysAgo,
        contactId: contacts[4].id,
        dealId: deals[4].id,
      },
      {
        type: 'email',
        description: 'Sent contract for signature',
        date: threeDaysAgo,
        contactId: contacts[5].id,
        dealId: deals[5].id,
      },
      {
        type: 'meeting',
        description: 'Project kickoff meeting',
        date: threeDaysAgo,
        contactId: contacts[0].id,
        dealId: deals[6].id,
      },
      {
        type: 'note',
        description: 'Noted competitor pricing concerns',
        date: yesterday,
        contactId: contacts[6].id,
        dealId: deals[7].id,
      },
      {
        type: 'call',
        description: 'Negotiation call for final terms',
        date: yesterday,
        contactId: contacts[1].id,
        dealId: deals[9].id,
      },
      {
        type: 'email',
        description: 'Sent revised proposal',
        date: today,
        contactId: contacts[8].id,
        dealId: deals[10].id,
      },
      {
        type: 'note',
        description: 'Contract signed - deal won!',
        date: yesterday,
        contactId: contacts[2].id,
        dealId: deals[12].id,
      },
      {
        type: 'email',
        description: 'Follow-up on lost deal - feedback received',
        date: twoDaysAgo,
        contactId: contacts[3].id,
        dealId: deals[15].id,
      },
    ];

    await this.activityRepository.save(
      activityData.map((a) =>
        this.activityRepository.create({
          ...a,
          organizationId: savedOrg.id,
        }),
      ),
    );
  }
}
