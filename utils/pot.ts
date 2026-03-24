import type { Person, Transaction } from "../types/transaction";

export function getPersonBalances(
  people: Person[],
  transactions: Transaction[]
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const person of people) {
    totals[person.id] = 0;
  }

  for (const transaction of transactions) {
    if (!(transaction.personId in totals)) {
      totals[transaction.personId] = 0;
    }

    if (transaction.type === "take") {
      totals[transaction.personId] += transaction.amount;
    } else {
      totals[transaction.personId] -= transaction.amount;
    }
  }

  return totals;
}

export function getTotalOwed(transactions: Transaction[]) {
  const totalTaken = transactions
    .filter((transaction) => transaction.type === "take")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalRepaid = transactions
    .filter((transaction) => transaction.type === "repay")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return Math.max(0, totalTaken - totalRepaid);
}

export function getCurrentBalance(
  startingBalance: number,
  transactions: Transaction[]
) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "take") {
      return total - transaction.amount;
    }

    return total + transaction.amount;
  }, startingBalance);
}