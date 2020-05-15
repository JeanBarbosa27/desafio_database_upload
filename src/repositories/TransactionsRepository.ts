import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface ReducerReturn {
  value: number;
}

interface AllTransactionsDTO {
  transactions: Transaction[];

  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private transactions: null | Transaction[];

  private transactionsRepository = getRepository(Transaction);

  private async getTransactions(): Promise<Transaction[]> {
    const transactions = await this.transactionsRepository.find();
    return transactions;
  }

  public async all(): Promise<AllTransactionsDTO | {}> {
    this.transactions = await this.getTransactions();

    if (!this.transactions.length) {
      this.transactions = null;
      return { message: 'There are no transactions yet!' };
    }

    const balance = await this.getBalance();

    return {
      transactions: this.transactions,
      balance,
    };
  }

  public async getBalance(): Promise<Balance> {
    const transactions = this.transactions
      ? this.transactions
      : await this.getTransactions();

    const reducer = (type: 'income' | 'outcome'): ReducerReturn => {
      const transactionsFiltered = transactions.filter(
        transaction => transaction.type === type,
      );

      const transactionsReduced = transactionsFiltered.length
        ? transactionsFiltered.reduce(
            (accumulator, current) => {
              return {
                value: +current.value + +accumulator.value,
              };
            },
            { value: 0 },
          )
        : { value: 0 };

      return transactionsReduced;
    };

    const income = reducer('income').value;
    const outcome = reducer('outcome').value;
    const total = income - outcome;
    const balance = {
      income,
      outcome,
      total,
    };

    return balance;
  }
}

export default TransactionsRepository;
