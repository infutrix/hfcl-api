import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PhysicalInspectionResult } from '../enums/physical-inspection-result.enum';
import { BatchPhysicalParamsStatus } from '../enums/batch-physical-params-status.enum';

export class SaveBatchPhysicalParamsDto {
    @ApiProperty({ example: 1, description: 'Batch cable profile session ID' })
    @IsInt()
    batch_cable_profile_id: number;

    @ApiPropertyOptional({ example: 1, description: 'Vernier No lookup ID' })
    @IsOptional()
    @IsInt()
    vernier_id?: number;

    @ApiPropertyOptional({ example: 'IEM-001' })
    @IsOptional()
    @IsString()
    iem?: string;

    @ApiPropertyOptional({ example: '12.5', description: 'OEM/Length of SFG (m)' })
    @IsOptional()
    @IsString()
    oem_length_of_sfg_m?: string;

    @ApiPropertyOptional({ example: '1.2', description: 'Inner Sheath (mm)' })
    @IsOptional()
    @IsString()
    inner_sheath_mm?: string;

    @ApiPropertyOptional({ example: '2.4', description: 'Outer Sheath (mm)' })
    @IsOptional()
    @IsString()
    outer_sheath_mm?: string;

    @ApiPropertyOptional({ example: '10.5', description: 'Cable Dia (mm)' })
    @IsOptional()
    @IsString()
    cable_dia_mm?: string;

    @ApiPropertyOptional({ example: '0.9', description: 'Tube ID/OD (nm)' })
    @IsOptional()
    @IsString()
    tube_id_od_nm?: string;

    @ApiPropertyOptional({ example: '1.1', description: 'FRP Dia (nm)' })
    @IsOptional()
    @IsString()
    frp_dia_nm?: string;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Stripability/Rib Separation' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    stripability_rib_separation?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Visual Inspection' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    visual_inspection?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'WPT' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    wpt?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'WPT Drip' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    wpt_drip?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Sheath Removal (R/LC)' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    sheath_removal_r_lc?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Fiber Seg of Ribbon' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    fiber_seg_of_ribbon?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Ribbon Print Qty' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    ribbon_print_qty?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Color of Fiber' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    color_of_fiber?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Ribbon Rub Test' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    ribbon_rub_test?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Ribbon Stiffness' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    ribbon_stiffness?: PhysicalInspectionResult;

    @ApiPropertyOptional({ enum: PhysicalInspectionResult, description: 'Ribbon Separation' })
    @IsOptional()
    @IsEnum(PhysicalInspectionResult)
    ribbon_separation?: PhysicalInspectionResult;

    @ApiPropertyOptional({ example: 'Sample within tolerance', description: 'Remark' })
    @IsOptional()
    @IsString()
    remark?: string;

    @ApiPropertyOptional({
        enum: BatchPhysicalParamsStatus,
        example: BatchPhysicalParamsStatus.PENDING,
        default: BatchPhysicalParamsStatus.PENDING,
    })
    @IsOptional()
    @IsEnum(BatchPhysicalParamsStatus)
    status?: BatchPhysicalParamsStatus;
}
