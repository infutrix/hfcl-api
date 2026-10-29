import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { UpdateBatchFiberTestingDto } from './dto/update-batch-fiber-testing.dto';
import { FiberTestImageStorage } from './fiber-test-image.storage';

describe('FiberTestImageStorage', () => {
    let dir: string;
    let storage: FiberTestImageStorage;

    beforeEach(async () => {
        dir = await mkdtemp(join(tmpdir(), 'fiber-images-'));
        storage = new FiberTestImageStorage(new ConfigService({ FIBER_TEST_IMAGE_DIR: dir }));
    });

    afterEach(() => rm(dir, { recursive: true, force: true }));

    it('stores a photo under its session and reads it back', async () => {
        const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
        const path = await storage.save({ buffer, mimetype: 'image/jpeg', size: buffer.length }, 42);

        expect(path).toMatch(/^42\/\d+-[0-9a-f-]{36}\.jpg$/);
        expect(await readFile(join(dir, path))).toEqual(buffer);
        const { stream, size } = await storage.open(path);
        stream.destroy();
        expect(size).toBe(4);
    });

    it('rejects unsupported types and paths outside the storage root', async () => {
        await expect(
            storage.save({ buffer: Buffer.from('x'), mimetype: 'application/pdf', size: 1 }, 1),
        ).rejects.toBeInstanceOf(BadRequestException);
        await expect(storage.open('../outside.jpg')).rejects.toBeInstanceOf(BadRequestException);
    });
});

describe('UpdateBatchFiberTestingDto', () => {
    // Same options as the global pipe in main.ts.
    const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    });
    const validate = (body: unknown) =>
        pipe.transform(body, { type: 'body', metatype: UpdateBatchFiberTestingDto }) as Promise<UpdateBatchFiberTestingDto>;

    it('accepts readings as a JSON array (JSON body)', async () => {
        const dto = await validate({ fiber_wavelengths: [{ wavelength_nm: 1310, measured_value: '0.31' }] });
        expect(dto.fiber_wavelengths).toEqual([{ wavelength_nm: '1310', measured_value: '0.31' }]);
    });

    it('accepts readings as a JSON string (multipart body)', async () => {
        const dto = await validate({
            fiber_wavelengths: JSON.stringify([{ wavelength_nm: '1550', measured_value: '0.2' }]),
            ai_response: '{"status":"success"}',
        });
        expect(dto.fiber_wavelengths).toEqual([{ wavelength_nm: '1550', measured_value: '0.2' }]);
        expect(dto.ai_response).toBe('{"status":"success"}');
    });

    it('rejects malformed readings', async () => {
        await expect(validate({ fiber_wavelengths: 'not json' })).rejects.toBeInstanceOf(BadRequestException);
        await expect(validate({ fiber_wavelengths: '[{"wavelength_nm":"1310","extra":1}]' })).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });
});
