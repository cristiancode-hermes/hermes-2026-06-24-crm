import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { DealsModule } from './deals/deals.module';
import { ActivitiesModule } from './activities/activities.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SeedModule } from './seed/seed.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DATABASE_TYPE') || 'sqlite';
        const url = config.get<string>('DATABASE_URL') || '';

        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            url,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            autoLoadEntities: false,
            ssl: { rejectUnauthorized: false },
          };
        }

        return {
          type: 'better-sqlite3',
          database: url.includes('://')
            ? config.get<string>('DATABASE_PATH', './data/crm.sqlite')
            : config.get<string>('DATABASE_PATH', './data/crm.sqlite'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          autoLoadEntities: false,
        };
      },
    }),
    AuthModule,
    ContactsModule,
    DealsModule,
    ActivitiesModule,
    DashboardModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
    },
  ],
})
export class AppModule {}
