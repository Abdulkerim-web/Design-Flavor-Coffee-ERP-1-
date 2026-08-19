import { Controller, Get, Query, Req, Res } from "@nestjs/common"
import { Request, Response } from "express"
import { RealtimeService } from "../services/realtime.service"

@Controller("realtime")
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Get("/stream")
  async stream(@Query('channel') channel: string, @Req() req: Request, @Res() res: Response) {
    // Optional auth: if REALTIME_TOKEN is set, require matching token via query or header
    const configured = process.env.REALTIME_TOKEN
    const provided = (req.query.token as string) || (req.headers['x-realtime-token'] as string) || undefined
    if (configured && configured !== '' && provided !== configured) {
      res.status(401).end('Unauthorized')
      return
    }

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
