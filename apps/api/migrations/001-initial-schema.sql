-- Multi-Tenant CRM - Initial Schema
-- PostgreSQL-compatible SQL

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Users (belongs to organization)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    organizationId INTEGER NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organizationId);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    role TEXT,
    notes TEXT,
    organizationId INTEGER NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    updatedAt DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organizationId);
CREATE INDEX IF NOT EXISTS idx_contacts_org_name ON contacts(organizationId, name);
CREATE INDEX IF NOT EXISTS idx_contacts_org_email ON contacts(organizationId, email);

-- Deals
CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'Nuevo',
    position INTEGER NOT NULL DEFAULT 0,
    expectedCloseDate DATE,
    notes TEXT,
    contactId INTEGER NOT NULL,
    organizationId INTEGER NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    updatedAt DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contactId) REFERENCES contacts(id),
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_deals_org_stage ON deals(organizationId, stage);
CREATE INDEX IF NOT EXISTS idx_deals_org_stage_pos ON deals(organizationId, stage, position);
CREATE INDEX IF NOT EXISTS idx_deals_org_contact ON deals(organizationId, contactId);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(expectedCloseDate);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('note', 'call', 'email', 'meeting')),
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT (date('now')),
    contactId INTEGER,
    dealId INTEGER,
    organizationId INTEGER NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contactId) REFERENCES contacts(id),
    FOREIGN KEY (dealId) REFERENCES deals(id),
    FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
CREATE INDEX IF NOT EXISTS idx_activities_org_contact ON activities(organizationId, contactId);
CREATE INDEX IF NOT EXISTS idx_activities_org_deal ON activities(organizationId, dealId);
CREATE INDEX IF NOT EXISTS idx_activities_org_date ON activities(organizationId, date);
CREATE INDEX IF NOT EXISTS idx_activities_org_contact_date ON activities(organizationId, contactId, date);
