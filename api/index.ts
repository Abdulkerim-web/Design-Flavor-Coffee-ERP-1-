import { NestFactory } from "@nestjs/core"
import { AppModule } from "../backend/src/app.module"
import { ExpressAdapter } from "@nestjs/platform-express"
import express from "express"
import * as dotenv from "dotenv"

dotenv.config({ path: "backend/.env" })

const server = express()
let cachedApp: any = null

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server))
    app.setGlobalPrefix("api/v1")
    app.enableCors()
    await app.init()
    cachedApp = app
  }
}

export default async function (req: any, res: any) {
  await bootstrap()
  server(req, res)
}
