import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerBranch } from '../entities/customer_branch.entity';
import { CustomerSalesRepHistory } from '../entities/customer_sales_rep_history.entity';
import { Notification } from '../entities/notification.entity';
import { AuditLog } from '../entities/audit_log.entity';

@Injectable()
export class CustomersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  /**
   * Creates a new customer, auto-creates a default branch if no branches provided,
   * assigns the initial sales rep, and logs history.
   * If `isUrgent` is true, triggers a manager notification.
   */
  async createCustomer(
    data: {
      businessNumber: string;
      name: string;
      salesRepId: string;
      branchDetails?: { name: string; address: string; contactInfo: string };
      isUrgent?: boolean;
    },
    createdByUserId: string,
  ): Promise<Customer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check for duplicate business number
      const existing = await queryRunner.manager.findOne(Customer, {
        where: { businessNumber: data.businessNumber },
      });
      if (existing) {
        throw new ConflictException('Customer with this business number already exists.');
      }

      // Create Customer
      const customer = queryRunner.manager.create(Customer, {
        businessNumber: data.businessNumber,
        name: data.name,
        active: true,
        salesRepId: data.salesRepId,
      });
      await queryRunner.manager.save(customer);

      // Auto-create default branch if provided, otherwise create a placeholder
      const branchName = data.branchDetails?.name || 'Main Branch';
      const branchAddress = data.branchDetails?.address || 'TBD';
      const branchContact = data.branchDetails?.contactInfo || 'TBD';

      const branch = queryRunner.manager.create(CustomerBranch, {
        customerId: customer.id,
        name: branchName,
        address: branchAddress,
        contactInfo: branchContact,
        isDefault: true,
      });
      await queryRunner.manager.save(branch);

      // Record Sales Rep Assignment History
      const history = queryRunner.manager.create(CustomerSalesRepHistory, {
        customerId: customer.id,
        salesRepId: data.salesRepId,
        assignedAt: new Date(),
      });
      await queryRunner.manager.save(history);

      // Urgent Workflow Notification
      if (data.isUrgent) {
        // Find general-manager users to notify (In a real app, query by role)
        // For now, we simulate finding the GM by notifying a generic role
        const notification = queryRunner.manager.create(Notification, {
          type: 'URGENT_CUSTOMER_REVIEW',
          severity: 'urgent',
          // Assuming USR-001 is General Manager from our seed
          recipientUserId: 'USR-001', 
          relatedEntityType: 'Customer',
          relatedEntityId: customer.id,
          message: `Urgent setup request for customer: ${customer.name}`,
        });
        await queryRunner.manager.save(notification);
      }

      // Audit Log
      const audit = queryRunner.manager.create(AuditLog, {
        userId: createdByUserId,
        action: 'CREATE',
        entityType: 'Customer',
        entityId: customer.id,
        changes: { new: { ...customer, branch } },
      });
      await queryRunner.manager.save(audit);

      await queryRunner.commitTransaction();
      return customer;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reassigns a customer to a new Sales Rep, closing the old history record
   * and starting a new one. This ensures orders placed tomorrow reference the new rep.
   */
  async reassignSalesRep(customerId: string, newSalesRepId: string, updatedByUserId: string): Promise<Customer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await queryRunner.manager.findOne(Customer, { where: { id: customerId } });
      if (!customer) throw new ConflictException('Customer not found');

      if (customer.salesRepId === newSalesRepId) {
        throw new ConflictException('Customer is already assigned to this Sales Rep.');
      }

      const oldSalesRepId = customer.salesRepId;

      // Close previous history
      const activeHistory = await queryRunner.manager.findOne(CustomerSalesRepHistory, {
        where: { customerId, unassignedAt: null },
      });
      if (activeHistory) {
        activeHistory.unassignedAt = new Date();
        await queryRunner.manager.save(activeHistory);
      }

      // Start new history
      const newHistory = queryRunner.manager.create(CustomerSalesRepHistory, {
        customerId,
        salesRepId: newSalesRepId,
        assignedAt: new Date(),
      });
      await queryRunner.manager.save(newHistory);

      // Update customer record
      customer.salesRepId = newSalesRepId;
      await queryRunner.manager.save(customer);

      // Audit Log
      const audit = queryRunner.manager.create(AuditLog, {
        userId: updatedByUserId,
        action: 'UPDATE',
        entityType: 'Customer',
        entityId: customer.id,
        changes: { previous: { salesRepId: oldSalesRepId }, new: { salesRepId: newSalesRepId } },
      });
      await queryRunner.manager.save(audit);

      await queryRunner.commitTransaction();
      return customer;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
