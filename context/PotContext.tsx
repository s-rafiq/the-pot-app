import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { db } from "../lib/firebase";
import type {
  FundingEvent,
  FundingEventDeduction,
  Person,
  PreviousDebtEntry,
  PreviousDebtEntryType,
  Transaction,
  TransactionType,
} from "../types/transaction";
import {
  getCurrentBalance,
  getPreviousDebtTotal,
  getTotalFundingNet,
  getTotalOwed,
} from "../utils/pot";

type PotContextValue = {
  balance: number;
  owed: number;
  previousOwed: number;
  people: Person[];
  transactions: Transaction[];
  previousDebtEntries: PreviousDebtEntry[];
  fundingEvents: FundingEvent[];
  fundingEventDeductions: FundingEventDeduction[];
  isLoading: boolean;
  addTransaction: (input: {
    person: Person;
    type: TransactionType;
    amount: number;
    note?: string;
  }) => Promise<void>;
  addPerson: (name: string) => Promise<void>;
  updatePerson: (personId: string, name: string) => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addPreviousDebtEntry: (input: {
    person: Person;
    type: PreviousDebtEntryType;
    amount: number;
    note?: string;
  }) => Promise<void>;
  addFundingEvent: (input: {
    title: string;
    grossAmount: number;
    note?: string;
    deductions: { label: string; amount: number }[];
  }) => Promise<void>;
};

const STARTING_BALANCE = 240;

const PotContext = createContext<PotContextValue | undefined>(undefined);

export function PotProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [previousDebtEntries, setPreviousDebtEntries] = useState<
    PreviousDebtEntry[]
  >([]);
  const [fundingEvents, setFundingEvents] = useState<FundingEvent[]>([]);
  const [fundingEventDeductions, setFundingEventDeductions] = useState<
    FundingEventDeduction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const addTransaction = async ({
    person,
    type,
    amount,
    note,
  }: {
    person: Person;
    type: TransactionType;
    amount: number;
    note?: string;
  }) => {
    const createdAt = new Date().toISOString();

    await addDoc(collection(db, "transactions"), {
      personId: person.id,
      personName: person.name,
      type,
      amount,
      note: note?.trim() ? note.trim() : null,
      createdAt,
    });
  };

  const addPerson = async (name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    await addDoc(collection(db, "people"), {
      name: trimmedName,
    });
  };

  const updatePerson = async (personId: string, name: string) => {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    await updateDoc(doc(db, "people", personId), {
      name: trimmedName,
    });
  };

  const deletePerson = async (personId: string) => {
    await deleteDoc(doc(db, "people", personId));
  };

  const deleteTransaction = async (transactionId: string) => {
    await deleteDoc(doc(db, "transactions", transactionId));
  };

  const addPreviousDebtEntry = async ({
    person,
    type,
    amount,
    note,
  }: {
    person: Person;
    type: PreviousDebtEntryType;
    amount: number;
    note?: string;
  }) => {
    const createdAt = new Date().toISOString();

    await addDoc(collection(db, "previousDebts"), {
      personId: person.id,
      personName: person.name,
      type,
      amount,
      note: note?.trim() ? note.trim() : null,
      createdAt,
    });
  };

  const addFundingEvent = async ({
    title,
    grossAmount,
    note,
    deductions,
  }: {
    title: string;
    grossAmount: number;
    note?: string;
    deductions: { label: string; amount: number }[];
  }) => {
    const createdAt = new Date().toISOString();

    const eventRef = await addDoc(collection(db, "fundingEvents"), {
      title,
      grossAmount,
      note: note?.trim() ? note.trim() : null,
      createdAt,
    });

    for (const deduction of deductions) {
      await addDoc(collection(db, "fundingEventDeductions"), {
        eventId: eventRef.id,
        label: deduction.label,
        amount: deduction.amount,
        createdAt,
      });
    }
  };

  const totalFunding = useMemo(() => {
    return getTotalFundingNet(fundingEvents, fundingEventDeductions);
  }, [fundingEvents, fundingEventDeductions]);

  const balance = useMemo(() => {
    return getCurrentBalance(STARTING_BALANCE + totalFunding, transactions);
  }, [transactions, totalFunding]);

  const owed = useMemo(() => {
    return getTotalOwed(transactions);
  }, [transactions]);

  const previousOwed = useMemo(() => {
    return getPreviousDebtTotal(previousDebtEntries);
  }, [previousDebtEntries]);

  const value = useMemo(
    () => ({
      balance,
      owed,
      previousOwed,
      people,
      transactions,
      previousDebtEntries,
      fundingEvents,
      fundingEventDeductions,
      isLoading,
      addTransaction,
      addPerson,
      deleteTransaction,
      addPreviousDebtEntry,
      updatePerson,
      deletePerson,
      addFundingEvent,
    }),
    [
      balance,
      owed,
      previousOwed,
      people,
      transactions,
      previousDebtEntries,
      fundingEvents,
      fundingEventDeductions,
      isLoading,
    ],
  );

  useEffect(() => {
    let peopleLoaded = false;
    let transactionsLoaded = false;
    let previousDebtLoaded = false;
    let fundingLoaded = false;
    let deductionsLoaded = false;

    const updateLoadingState = () => {
      if (
        peopleLoaded &&
        transactionsLoaded &&
        previousDebtLoaded &&
        fundingLoaded &&
        deductionsLoaded
      ) {
        setIsLoading(false);
      }
    };

    const unsubscribePeople = onSnapshot(
      collection(db, "people"),
      (snapshot) => {
        const loadedPeople: Person[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
          };
        });

        setPeople(loadedPeople);
        peopleLoaded = true;
        updateLoadingState();
      },
      (error) => {
        console.error("Failed to listen to people:", error);
        peopleLoaded = true;
        updateLoadingState();
      },
    );

    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const loadedTransactions: Transaction[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            personId: data.personId,
            personName: data.personName,
            type: data.type,
            amount: data.amount,
            note: data.note ?? undefined,
            createdAt: data.createdAt,
          } as Transaction;
        });

        loadedTransactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setTransactions(loadedTransactions);
        transactionsLoaded = true;
        updateLoadingState();
      },
      (error) => {
        console.error("Failed to listen to transactions:", error);
        transactionsLoaded = true;
        updateLoadingState();
      },
    );

    const unsubscribePreviousDebt = onSnapshot(
      collection(db, "previousDebts"),
      (snapshot) => {
        const loadedPreviousDebtEntries: PreviousDebtEntry[] =
          snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              personId: data.personId,
              personName: data.personName,
              type: data.type,
              amount: data.amount,
              note: data.note ?? undefined,
              createdAt: data.createdAt,
            } as PreviousDebtEntry;
          });

        loadedPreviousDebtEntries.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setPreviousDebtEntries(loadedPreviousDebtEntries);
        previousDebtLoaded = true;
        updateLoadingState();
      },
      (error) => {
        console.error("Failed to listen to previous debts:", error);
        previousDebtLoaded = true;
        updateLoadingState();
      },
    );

    const unsubscribeFunding = onSnapshot(
      collection(db, "fundingEvents"),
      (snapshot) => {
        const loadedFundingEvents: FundingEvent[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            grossAmount: data.grossAmount,
            note: data.note ?? undefined,
            createdAt: data.createdAt,
          };
        });

        loadedFundingEvents.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setFundingEvents(loadedFundingEvents);
        fundingLoaded = true;
        updateLoadingState();
      },
      (error) => {
        console.error("Failed to listen to funding events:", error);
        fundingLoaded = true;
        updateLoadingState();
      },
    );

    const unsubscribeDeductions = onSnapshot(
      collection(db, "fundingEventDeductions"),
      (snapshot) => {
        const loadedDeductions: FundingEventDeduction[] = snapshot.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              eventId: data.eventId,
              label: data.label,
              amount: data.amount,
              createdAt: data.createdAt,
            };
          },
        );

        setFundingEventDeductions(loadedDeductions);
        deductionsLoaded = true;
        updateLoadingState();
      },
      (error) => {
        console.error("Failed to listen to funding deductions:", error);
        deductionsLoaded = true;
        updateLoadingState();
      },
    );

    return () => {
      unsubscribePeople();
      unsubscribeTransactions();
      unsubscribePreviousDebt();
      unsubscribeFunding();
      unsubscribeDeductions();
    };
  }, []);

  return <PotContext.Provider value={value}>{children}</PotContext.Provider>;
}

export function usePot() {
  const context = useContext(PotContext);

  if (!context) {
    throw new Error("usePot must be used inside a PotProvider");
  }

  return context;
}
