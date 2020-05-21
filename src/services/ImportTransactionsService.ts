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
  async execute(registries: RequestDTO[]): Promise<Transaction[]> {
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);
    console.log(registries);

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

    const fileName = 'import_transactions.csv'; // virá a partir dos parâmetros
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', fileName);

    const fileLines = await loadCSV(csvFilePath);
    const transactionKeys = fileLines[0];
    const fileRegistries = [] as RequestDTO[];

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

    const transactions = [] as Transaction[];
    const categories = await categoriesRepository.find();

    fileRegistries.map(async registry => {
      const { title, value, type, category: categoryTitle } = registry;
      const [category] = categories.filter(categoryEntity => {
        return categoryEntity.title === categoryTitle;
      });
      let categoryId = category?.id;

      if (!categoryId) {
        const newCategory = categoriesRepository.create({
          title: categoryTitle,
        });
        const categoryCreated = await categoriesRepository.save(newCategory);
        categories.push(categoryCreated);
        categoryId = categoryCreated.id;
      }

      const registryEdited = {
        title,
        value,
        type,
        category_id: categoryId,
      } as RegistriesDTO;

      const createTransaction = transactionsRepository.create(registryEdited);
      return transactions.push(createTransaction);
    });

    // await transactionsRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;
