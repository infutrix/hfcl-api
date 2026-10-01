import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const REPORT_GRANULARITIES = ['hour', 'day', 'week', 'month'] as const;
export type ReportGranularity = (typeof REPORT_GRANULARITIES)[number];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'must be a date in YYYY-MM-DD format';

class ReportScopeQueryDto {
    @ApiPropertyOptional({ description: 'Limit to one plant (ignored for plant-scoped users).' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    plant_id?: number;
}

export class ReportRangeQueryDto extends ReportScopeQueryDto {
    @ApiProperty({ example: '2026-10-01', description: 'First day of the range (inclusive).' })
    @Matches(DATE_PATTERN, { message: `from ${DATE_MESSAGE}` })
    from: string;

    @ApiProperty({ example: '2026-10-07', description: 'Last day of the range (inclusive).' })
    @Matches(DATE_PATTERN, { message: `to ${DATE_MESSAGE}` })
    to: string;

    @ApiPropertyOptional({
        enum: REPORT_GRANULARITIES,
        description: 'Trend bucket size. Picked from the range length when omitted.',
    })
    @IsOptional()
    @IsIn(REPORT_GRANULARITIES)
    granularity?: ReportGranularity;

    @ApiPropertyOptional({ description: 'Limit to tests performed by one employee (user id).' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    operator_id?: number;

    @ApiPropertyOptional({ description: 'Limit to one cable profile.' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    cable_profile_id?: number;
}

export class BatchReportQueryDto extends ReportScopeQueryDto {
    @ApiPropertyOptional({ example: '2026-10-01', description: 'Sessions created or tested on/after this day.' })
    @IsOptional()
    @Matches(DATE_PATTERN, { message: `from ${DATE_MESSAGE}` })
    from?: string;

    @ApiPropertyOptional({ example: '2026-10-31', description: 'Sessions created or tested on/before this day.' })
    @IsOptional()
    @Matches(DATE_PATTERN, { message: `to ${DATE_MESSAGE}` })
    to?: string;

    @ApiPropertyOptional({ description: 'Matches batch name, drum number, cable profile or customer.' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @ApiPropertyOptional({ enum: [0, 1, 2], description: '0 = pending, 1 = in-progress, 2 = completed' })
    @IsOptional()
    @Type(() => Number)
    @IsIn([0, 1, 2])
    status?: number;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 20, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    page_size?: number;
}

export class LiveReportQueryDto extends ReportScopeQueryDto { }
