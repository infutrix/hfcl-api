import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createSocket, Socket } from 'node:dgram';
import {
  DISCOVERY_BROADCAST_INTERVAL_MS,
  DISCOVERY_FALLBACK_BROADCAST_ADDRESS,
  DISCOVERY_MESSAGE_TYPE,
  DISCOVERY_PROTOCOL_VERSION,
  DISCOVERY_UDP_PORT,
} from './discovery.constants';
import { signDiscoveryPayload } from './discovery.crypto';
import { getActiveLanInterface } from './network-address.util';

/**
 * Periodically broadcasts this machine's LAN address over UDP so hfcl-app
 * instances on the same network can find the main server without any
 * hardcoded IP, even after a DHCP lease change.
 */
@Injectable()
export class MainServerBroadcastService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MainServerBroadcastService.name);
  private readonly secret = process.env.HFCL_DISCOVERY_SECRET;
  private readonly apiPort = Number(process.env.APP_PORT ?? 3000);

  private socket: Socket | null = null;
  private timer: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    if (!this.secret) {
      this.logger.warn(
        'HFCL_DISCOVERY_SECRET is not set — main server discovery broadcasts are disabled.',
      );
      return;
    }
    this.start();
  }

  onModuleDestroy(): void {
    this.stop();
  }

  private start(): void {
    if (this.socket || this.timer) {
      return; // already running, never create duplicate timers/sockets
    }

    const socket = createSocket({ type: 'udp4', reuseAddr: true });

    socket.on('error', (err) => {
      this.logger.error(`Discovery broadcast socket error: ${err.message}`, err.stack);
    });

    socket.bind(() => {
      socket.setBroadcast(true);
    });

    this.socket = socket;
    this.timer = setInterval(() => this.broadcastOnce(), DISCOVERY_BROADCAST_INTERVAL_MS);
    this.broadcastOnce();

    this.logger.log(
      `Discovery broadcast started on UDP ${DISCOVERY_UDP_PORT} every ${DISCOVERY_BROADCAST_INTERVAL_MS}ms`,
    );
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.logger.log('Discovery broadcast stopped.');
  }

  private broadcastOnce(): void {
    if (!this.socket || !this.secret) {
      return;
    }

    const lan = getActiveLanInterface();
    if (!lan) {
      this.logger.warn('No active LAN IPv4 address found; skipping this discovery broadcast.');
      return;
    }

    const fields = {
      type: DISCOVERY_MESSAGE_TYPE,
      version: DISCOVERY_PROTOCOL_VERSION,
      host: lan.address,
      port: this.apiPort,
      timestamp: Date.now(),
    };
    const signature = signDiscoveryPayload(fields, this.secret);
    const message = Buffer.from(JSON.stringify({ ...fields, signature }));
    const destination = lan.broadcast || DISCOVERY_FALLBACK_BROADCAST_ADDRESS;

    this.socket.send(message, 0, message.length, DISCOVERY_UDP_PORT, destination, (err) => {
      if (err) {
        this.logger.debug(`Discovery broadcast send to ${destination} failed: ${err.message}`);
      }
    });
  }
}
