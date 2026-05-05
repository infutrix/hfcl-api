import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { PlantsModule } from './plants/plants.module';
import { OtdrDevicesModule } from './otdr-devices/otdr-devices.module';
import { CableProfilesModule } from './cable-profiles/cable-profiles.module';
import { CustomersModule } from './customers/customers.module';
import { BatchesModule } from './batches/batches.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'hfcl_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
    AuditModule,
    PlantsModule,
    OtdrDevicesModule,
    CableProfilesModule,
    CustomersModule,
    BatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
