import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsIP,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { OtdrDeviceStatus } from '../entities/otdr-device.entity';

export class CreateOtdrDeviceDto {
    @ApiProperty({ example: 'OTDR-P1-01', description: 'Name of the OTDR device' })
    @IsString()
    @IsNotEmpty()
    device_name: string;

    @ApiProperty({ example: 'DEV-001', description: 'Unique identifier of the device in the system' })
    @IsString()
    @IsNotEmpty()
    device_id: string;

    @ApiProperty({ example: '192.168.1.100', description: 'IP address for TCP/IP connection' })
    @IsIP()
    @IsNotEmpty()
    ip_address: string;

    @ApiProperty({ example: 8080, description: 'TCP port for device communication (1–65535)' })
    @IsInt()
    @Min(1)
    @Max(65535)
    port: number;

    @ApiProperty({ example: 'EXFO', description: 'Manufacturer (e.g., EXFO, VIAVI, Yokogawa)' })
    @IsString()
    @IsNotEmpty()
    manufacturer: string;

    @ApiProperty({ example: 'FTB-1', description: 'Model of the device' })
    @IsString()
    @IsNotEmpty()
    model: string;

    @ApiProperty({ example: 'SN-123456', description: 'Physical device serial number' })
    @IsString()
    @IsNotEmpty()
    serial_number: string;

    @ApiProperty({ example: 1, description: 'ID of the assigned plant (plants.id)' })
    @IsInt()
    plant_id: number;

    @ApiPropertyOptional({ enum: OtdrDeviceStatus, default: OtdrDeviceStatus.ACTIVE, description: 'Status of the device' })
    @IsOptional()
    @IsEnum(OtdrDeviceStatus)
    status?: OtdrDeviceStatus;
}
