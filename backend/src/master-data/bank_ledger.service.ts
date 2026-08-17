import { Injectable, BadRequestException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { CompanyBankAccount } from "../entities/company_bank_account.entity"
import { BankTransaction } from "../entities/bank_transaction.entity"

@Injectable()
export class BankLedgerService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Calculates the exact bank balance directly from the immutable transaction ledger.
   * Balance = Opening Balance + Sum(Deposits) - Sum(Withdrawals)
   */
  async getCalculatedBalance(bankAccountId: string): Promise<number> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()

    try {
      const account = await queryRunner.manager.findOne(CompanyBankAccount, {
        where: { id: bankAccountId },
      })

      if (!account) throw new BadRequestException("Bank Account not found")

      // The raw SQL approach is faster, but we'll use TypeORM standard querying for cross-db compatibility
      const result = await queryRunner.manager
        .createQueryBuilder(BankTransaction, "tx")
        .select("SUM(tx.amount)", "total")
        .where("tx.bankAccountId = :bankAccountId", { bankAccountId })
        .getRawOne()

      const transactionSum = Number(result?.total) || 0
      const openingBalance = Number(account.openingBalance) || 0

      return openingBalance + transactionSum
    } finally {
      await queryRunner.release()
    }
  }
}
