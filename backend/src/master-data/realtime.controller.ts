import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common"
import { Request, Response } from "express"
import { RealtimeService } from "../services/realtime.service"
import { RealtimeGuard } from "../common/guards/realtime.guard"

@Controller("realtime")
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Get("/stream")
  @UseGuards(RealtimeGuard)
  async stream(@Query('channel') channel: string, @Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const send = (payload: any) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`)
      } catch (e) {
        // ignore write errors
      }
    }

    const unsubscribe = this.realtime.subscribe(channel, send)

    // Close when client disconnects
    req.on('close', () => {
      unsubscribe()
    })

    // Keep connection open
  }
}
