import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface RequestDTO {
  title: string;

  value: number;

  type: 'income' | 'outcome';

  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    if (!title || !value || !type || !category) {
      throw new AppError(
        'All fields (title, value, type and category) are required!',
      );
    }

    const findCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    let categoryId = findCategory?.id;

    if (!categoryId) {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      const categorySaved = await categoriesRepository.save(newCategory);
      categoryId = categorySaved.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryId,
    });

    await transactionsRepository.save(transaction);

    delete transaction.id;

    return transaction;
  }
}

export default CreateTransactionService;
