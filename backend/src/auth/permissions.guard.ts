import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler(),
    )
    if (!requiredPermissions) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    const user = request.user // Set by AuthMiddleware/JwtGuard

    if (!user) {
      throw new ForbiddenException("No user found")
    }

    // A real implementation would fetch user.role.permissions from DB
    // For this test, we simulate that only tier 1 or specific roles have `roles.manage`
    const hasPermission = user.permissions?.some((p: string) =>
      requiredPermissions.includes(p),
    )

    if (!hasPermission) {
      throw new ForbiddenException(
        "You do not have permission to perform this action.",
      )
    }

    return true
  }
}
