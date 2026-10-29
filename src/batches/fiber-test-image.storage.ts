import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream, ReadStream } from 'fs';
import { mkdir, stat, unlink, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, isAbsolute, join, relative, resolve } from 'path';

/** The subset of a multer file the storage needs (memory storage, so `buffer` is set). */
export interface UploadedImage {
    buffer: Buffer;
    mimetype: string;
    size: number;
}

export const MAX_FIBER_TEST_IMAGE_BYTES = 25 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/bmp': '.bmp',
    'image/tiff': '.tiff',
};

export function isSupportedImageMime(mime: string | undefined): boolean {
    return !!mime && mime in EXTENSION_BY_MIME;
}

/**
 * Fiber test photos on local disk. The default root is outside the repo checkout on purpose:
 * the deploy job's checkout wipes untracked files, which would delete every stored photo.
 */
@Injectable()
export class FiberTestImageStorage {
    private readonly logger = new Logger(FiberTestImageStorage.name);
    private readonly root: string;

    constructor(config: ConfigService) {
        this.root = resolve(
            config.get<string>('FIBER_TEST_IMAGE_DIR') || join(homedir(), 'hfcl-data', 'fiber-test-images'),
        );
        this.logger.log(`Fiber test images are stored in ${this.root}`);
    }

    /** Writes the image and returns its path relative to the storage root. */
    async save(image: UploadedImage, batchCableProfileId: number): Promise<string> {
        const extension = EXTENSION_BY_MIME[image.mimetype];
        if (!extension) {
            throw new BadRequestException(`Unsupported image type "${image.mimetype}"`);
        }
        if (!image.buffer?.length) {
            throw new BadRequestException('Uploaded image is empty');
        }
        const relativePath = `${batchCableProfileId}/${Date.now()}-${randomUUID()}${extension}`;
        const absolutePath = this.absolute(relativePath);
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, image.buffer);
        return relativePath;
    }

    /** Best effort: used to roll back a write whose database transaction failed. */
    async remove(relativePath: string): Promise<void> {
        try {
            await unlink(this.absolute(relativePath));
        } catch (error) {
            this.logger.warn(`Could not delete orphaned image ${relativePath}: ${(error as Error).message}`);
        }
    }

    async open(relativePath: string): Promise<{ stream: ReadStream; size: number }> {
        const absolutePath = this.absolute(relativePath);
        try {
            const info = await stat(absolutePath);
            return { stream: createReadStream(absolutePath), size: info.size };
        } catch {
            throw new NotFoundException('Image file is missing from storage');
        }
    }

    private absolute(relativePath: string): string {
        const absolutePath = resolve(this.root, relativePath);
        const fromRoot = relative(this.root, absolutePath);
        if (!fromRoot || fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
            throw new BadRequestException('Invalid image path');
        }
        return absolutePath;
    }
}
