import { Router } from 'express';
import { getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
// import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = new TransactionsRepository();
  const repository = getRepository(Transaction);
  const transactions = await repository.find();
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance, });
});

transactionsRouter.post('/', async (request, response) => {
  // TODO
});

transactionsRouter.delete('/:id', async (request, response) => {
  // TODO
});

transactionsRouter.post('/import', async (request, response) => {
  // TODO
});

export default transactionsRouter;
