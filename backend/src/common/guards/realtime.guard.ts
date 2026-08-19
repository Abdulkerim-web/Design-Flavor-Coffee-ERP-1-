import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Request } from "express"

@Injectable()
export class RealtimeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest()
    const configured = process.env.REALTIME_TOKEN
    if (!configured || configured === "") return true
    const provided = (req.query?.token as string) || (req.headers["x-realtime-token"] as string) || undefined
    return provided === configured
  }
}
