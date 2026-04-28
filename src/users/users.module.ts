import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserRolesController } from './user-roles/user-roles.controller';
import { UserRolesService } from './user-roles/user-roles.service';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [TypeOrmModule.forFeature([User, UserRole]), AuditModule],
    controllers: [UsersController, UserRolesController],
    providers: [UsersService, UserRolesService],
    exports: [UsersService, UserRolesService],
})
export class UsersModule { }
