import { getRepository } from 'typeorm';
import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface RegistriesDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_id: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);
    const transactions = [] as Transaction[];
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', fileName);
    const fileRegistries = [] as RequestDTO[];

    async function loadCSV(filePath: string): Promise<string[]> {
      const readCsvStream = fs.createReadStream(filePath);

      const parseStream = csvParse({
        from_line: 1,
        ltrim: true,
        rtrim: true,
      });

      const parseCSV = readCsvStream.pipe(parseStream);
      const lines = [] as string[];

      parseCSV.on('data', line => {
        lines.push(line);
      });

      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      return lines;
    }

    async function findCategoryId(title: string): Promise<string> {
      const category = await categoriesRepository.findOne({ where: { title } });

      if (!category) {
        const newCategory = categoriesRepository.create({ title });
        const categoryCreated = await categoriesRepository.save(newCategory);
        return categoryCreated.id;
      }

      return category?.id;
    }

    const fileLines = await loadCSV(csvFilePath);
    const transactionKeys = fileLines[0];

    fileLines.forEach((line, index) => {
      const transactionObject = {} as RequestDTO;

      if (index > 0) {
        line.forEach((item, itemIndex) => {
          const column = transactionKeys[itemIndex];

          if (column === 'value') {
            transactionObject[column] = +item;
          } else {
            transactionObject[column] = item;
          }
        });

        fileRegistries.push(transactionObject);
      }
    });

    let fileRegistriesIndex = 0;
    while (fileRegistriesIndex < fileRegistries.length) {
      const { title, value, type, category: categoryTitle } = fileRegistries[
        fileRegistriesIndex
      ];
      const categoryId = await findCategoryId(categoryTitle);

      const registryEdited = {
        title,
        value,
        type,
        category_id: categoryId,
      } as RegistriesDTO;

      const createTransaction = transactionsRepository.create(registryEdited);
      transactions.push(createTransaction);
      fileRegistriesIndex += 1;
    }

    await transactionsRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
