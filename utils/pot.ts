import type {
  Person,
  PreviousDebtEntry,
  Transaction,
  FundingEvent,
  FundingEventDeduction,
} from "../types/transaction";

export function getPersonBalances(
  people: Person[],
  transactions: Transaction[],
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
    } else if (transaction.type === "repay") {
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
  transactions: Transaction[],
) {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "take" || transaction.type === "write-off") {
      return total - transaction.amount;
    }

    return total + transaction.amount;
  }, startingBalance);
}

export function getPreviousDebtTotal(entries: PreviousDebtEntry[]) {
  return Math.max(
    0,
    entries.reduce((total, entry) => {
      if (entry.type === "debt") {
        return total + entry.amount;
      }

      return total - entry.amount;
    }, 0),
  );
}

export function getPreviousDebtBalances(
  people: Person[],
  entries: PreviousDebtEntry[],
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const person of people) {
    totals[person.id] = 0;
  }

  for (const entry of entries) {
    if (!(entry.personId in totals)) {
      totals[entry.personId] = 0;
    }

    if (entry.type === "debt") {
      totals[entry.personId] += entry.amount;
    } else {
      totals[entry.personId] -= entry.amount;
    }
  }

  for (const personId in totals) {
    totals[personId] = Math.max(0, totals[personId]);
  }

  return totals;
}

export function getFundingEventTotals(
  event: FundingEvent,
  deductions: FundingEventDeduction[]
) {
  const eventDeductions = deductions.filter(
    (d) => d.eventId === event.id
  );

  const totalDeductions = eventDeductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );

  const netAmount = event.grossAmount - totalDeductions;

  return {
    gross: event.grossAmount,
    deductions: totalDeductions,
    net: netAmount,
  };
}

export function getTotalFundingNet(
  events: FundingEvent[],
  deductions: FundingEventDeduction[]
) {
  return events.reduce((total, event) => {
    const { net } = getFundingEventTotals(event, deductions);
    return total + net;
  }, 0);
}