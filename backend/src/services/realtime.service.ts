import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import { EventEmitter } from "events"

@Injectable()
export class RealtimeService implements OnModuleDestroy {
  private readonly emitter = new EventEmitter()
  private readonly logger = new Logger(RealtimeService.name)

  publish(channel: string, payload: any) {
    try {
      this.emitter.emit(channel, payload)
    } catch (err) {
      this.logger.error("publish error", err as any)
    }
  }

  subscribe(channel: string, handler: (payload: any) => void) {
    this.emitter.on(channel, handler)
    return () => this.emitter.off(channel, handler)
  }

  onModuleDestroy() {
    this.emitter.removeAllListeners()
  }
}
