import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Order } from '../entities/order.entity';
import { StockBalance } from '../entities/stock_balance.entity';
import { RoastingBatch } from '../entities/roasting_batch.entity';
import { BankTransaction } from '../entities/bank_transaction.entity';
import { AuditLog } from '../entities/audit_log.entity';

import { Customer } from '../entities/customer.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(StockBalance) private readonly stockRepo: Repository<StockBalance>,
    @InjectRepository(RoastingBatch) private readonly roastRepo: Repository<RoastingBatch>,
    @InjectRepository(BankTransaction) private readonly bankRepo: Repository<BankTransaction>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  async getManagerDashboard() {
    const [
      orders,
      roastingBatches,
      lowStock,
      recentLogs,
      recentBankTx,
      customers,
    ] = await Promise.all([
      this.orderRepo.find({ relations: ['customer'] }),
      this.roastRepo.find({ where: { status: 'ROASTING' } }),
      this.stockRepo.find({ where: { available: LessThan(50) } }),
      this.auditRepo.find({ order: { createdAt: 'DESC' }, take: 10 }),
      this.bankRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.customerRepo.find({ order: { createdAt: 'DESC' } }),
    ]);

    const activeOrders = orders.filter((o) => !['CANCELLED', 'DELIVERED', 'COMPLETED'].includes(o.status));

    // 1. KPI Cards
    const kpiCards = [
      {
        label: 'Orders in Progress',
        value: activeOrders.length.toString(),
        sub: `${orders.filter(o => o.status === 'PENDING_MANAGER_CONFIRMATION').length} awaiting confirmation`,
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        label: 'Total Active Customers',
        value: `${customers.length} clients`,
        sub: `${customers.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).length} registered today`,
        icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
      },
      {
        label: 'Active Roasting',
        value: `${roastingBatches.length} batches`,
        sub: 'In progress',
        icon: 'M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0',
      },
      {
        label: 'Low Stock Alerts',
        value: `${lowStock.length} items`,
        sub: 'Require attention',
        icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
      }
    ];

    // 2. Order Statuses
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const orderStatuses = Object.entries(statusCounts).map(([status, count]) => ({
      label: status.replace(/_/g, ' '),
      count,
      color: status.includes('PENDING') ? '#F59E0B' : status.includes('CANCEL') ? '#EF4444' : '#10B981',
    }));

    // 3. Attention Cards
    const attentionCards = [];
    const recentCustomers = customers.slice(0, 3);
    for (const c of recentCustomers) {
      attentionCards.push({
        id: `cus-${c.id}`,
        severity: 'info',
        category: 'New Customer',
        title: `Customer ${c.name} registered`,
        description: `Ref: ${c.businessNumber} | Type: ${c.type}`,
        primaryAction: 'View Customer',
        module: 'customers',
        age: 'Recent',
      });
    }
    const urgentOrders = orders.filter(o => o.isUrgent && o.status === 'PENDING_MANAGER_CONFIRMATION');
    for (const o of urgentOrders) {
      attentionCards.push({
        id: `ord-${o.id}`,
        severity: 'urgent',
        category: 'Urgent Order',
        title: `Order ${o.orderNumber} requires approval`,
        description: `Customer: ${o.customer?.name || 'Unknown'}`,
        primaryAction: 'Review Order',
        module: 'orders',
        age: 'Recent',
      });
    }

    // 4. Finance Rows
    const financeRows = recentBankTx.map(tx => ({
      label: tx.referenceNote || 'Bank Transaction',
      value: `ETB ${tx.amount}`,
      sub: new Date(tx.createdAt).toLocaleDateString(),
      emphasis: tx.amount > 0,
    }));

    // 5. Activity Feed
    const activityFeed = recentLogs.map(log => ({
      id: log.id,
      time: new Date(log.createdAt).toLocaleTimeString(),
      event: log.action,
      record: `${log.entityType} ${log.entityId}`,
      actor: log.userId,
      module: log.entityType.toLowerCase(),
      iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
      iconColor: '#3B82F6',
    }));

    return {
      kpiCards,
      attentionCards,
      orderStatuses,
      financeRows,
      activityFeed,
    };
  }
}
