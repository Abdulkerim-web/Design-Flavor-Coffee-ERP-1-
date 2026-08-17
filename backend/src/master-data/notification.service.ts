import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppNotification } from '../entities/app_notification.entity';

@Injectable()
export class NotificationService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Triggers a notification. Prevents duplicate spam by upserting/incrementing if an UNREAD
   * notification of the same type and reference exists for the user.
   */
  async triggerNotification(
    userId: string,
    type: string,
    referenceEntityId: string,
    message: string
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const existing = await queryRunner.manager.findOne(AppNotification, {
        where: {
          userId,
          type,
          referenceEntityId,
          status: 'UNREAD',
        },
      });

      if (existing) {
        // Prevent spam: just increment count and update timestamp implicitly via save
        existing.triggerCount += 1;
        existing.message = message; // Optionally update message if it changed
        await queryRunner.manager.save(existing);
        return existing;
      } else {
        // Create new
        const notification = queryRunner.manager.create(AppNotification, {
          userId,
          type,
          referenceEntityId,
          message,
        });
        await queryRunner.manager.save(notification);
        return notification;
      }
    } finally {
      await queryRunner.release();
    }
  }
}
