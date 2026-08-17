import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

export interface Response<T> {
  success: boolean
  data: T
  error: null
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If a service already returns { success: true }, unwrap it or adapt it
        // so we don't end up with { success: true, data: { success: true, ... } }
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          Object.keys(data).length <= 2
        ) {
          // Probably an old format { success: true, message: '...' }
          return {
            success: data.success,
            data: data,
            error: null,
          }
        }

        return {
          success: true,
          data,
          error: null,
        }
      }),
    )
  }
}
