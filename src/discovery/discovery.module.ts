import { Module } from '@nestjs/common';
import { MainServerBroadcastService } from './main-server-broadcast.service';

@Module({
  providers: [MainServerBroadcastService],
})
export class DiscoveryModule {}
