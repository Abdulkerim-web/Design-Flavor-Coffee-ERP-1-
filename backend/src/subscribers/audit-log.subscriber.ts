import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  RemoveEvent,
} from "typeorm"
import { AuditLog } from "../entities/audit_log.entity"

@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface<AuditLog> {
  listenTo() {
    return AuditLog
  }

  beforeUpdate(event: UpdateEvent<AuditLog>) {
    throw new Error("Audit logs are immutable and cannot be updated.")
  }

  beforeRemove(event: RemoveEvent<AuditLog>) {
    throw new Error("Audit logs are immutable and cannot be deleted.")
  }
}
