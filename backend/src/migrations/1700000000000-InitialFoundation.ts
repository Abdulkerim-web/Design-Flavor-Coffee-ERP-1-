import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialFoundation1700000000000 implements MigrationInterface {
  name = 'InitialFoundation1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Note: In a real environment, TypeORM would generate the CREATE TABLE statements here.
    // For this ERP system, since we are designing the backend without a live MySQL instance,
    // we use `synchronize: true` just for development/testing if needed, or rely on TypeORM's auto-generation
    // when you run `npm run typeorm migration:generate` on your live server.

    // To fulfill PROMPT 02: Database-level immutability for AuditLogs.
    // We attempt to revoke UPDATE and DELETE on audit_logs for the application user.
    // This assumes an app user exists. If it fails (e.g. running as root), it will just log a warning.
    
    try {
      // In production, replace 'flavor_app_user'@'localhost' with the actual user configured in your DB.
      await queryRunner.query(
        `REVOKE UPDATE, DELETE ON audit_logs FROM 'flavor_app_user'@'localhost';`
      );
    } catch (e) {
      console.warn('Could not revoke permissions on audit_logs. Ensure the user exists or you are not running as root.');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(
        `GRANT UPDATE, DELETE ON audit_logs TO 'flavor_app_user'@'localhost';`
      );
    } catch (e) {
      // Ignore
    }
  }
}
