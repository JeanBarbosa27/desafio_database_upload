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

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getRepository(Transaction);
    const transactions = await transactionsRepository.find();

    const reducer = (type: 'income' | 'outcome'): ReducerReturn => {
      const transactionsFiltered = transactions.filter(
        transaction => transaction.type === type
      );

      const transactionsReduced = transactionsFiltered.length
        ? transactionsFiltered.reduce(
          (current, accumulator) => {
            return {
              value: current.value + accumulator.value,
            }
          },
          { value: 0 }
        )
        : { value: 0 }

      return transactionsReduced;
    }

    const income = reducer('income').value;
    const outcome = reducer('outcome').value;
    const total = income - outcome;
    const balance = {
      income,
      outcome,
      total,
    }

    return balance;
  }
}

export default TransactionsRepository;
