export type TransactionType = 'take' | 'repay';

export type Person = {
  id: string;
  name: string;
};

export type Transaction = {
  id: string;
  personId: string;
  personName: string;
  type: TransactionType;
  amount: number;
  note?: string;
  createdAt: string;
};