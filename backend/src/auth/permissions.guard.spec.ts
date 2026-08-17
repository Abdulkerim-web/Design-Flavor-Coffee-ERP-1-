import { PermissionsGuard } from "./permissions.guard"
import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"

describe("PermissionsGuard (RBAC Rule)", () => {
  let guard: PermissionsGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new PermissionsGuard(reflector)
  })

  it("should deny a non-admin role from accessing an endpoint requiring roles.manage", () => {
    // Mock reflector to return 'roles.manage' requirement
    jest.spyOn(reflector, "get").mockReturnValue(["roles.manage"])

    // Mock non-admin user
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: "USR-004",
            roleId: "inventory-manager",
            permissions: ["inventory.adjustment.approve"],
          },
        }),
      }),
    } as unknown as ExecutionContext

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException)
    expect(() => guard.canActivate(mockContext)).toThrow(
      "You do not have permission to perform this action.",
    )
  })

  it("should allow an admin role with roles.manage permission", () => {
    jest.spyOn(reflector, "get").mockReturnValue(["roles.manage"])

    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: "USR-001",
            roleId: "general-manager",
            permissions: ["roles.manage", "users.create"],
          },
        }),
      }),
    } as unknown as ExecutionContext

    expect(guard.canActivate(mockContext)).toBe(true)
  })
})
