export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET ?? 'crm-dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  database: {
    type: 'better-sqlite3' as const,
    database: process.env.DATABASE_PATH ?? './data/crm.sqlite',
    synchronize: false,
    autoLoadEntities: true,
  },
});
