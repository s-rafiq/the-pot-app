import { addDoc, collection, getDocs } from "firebase/firestore";
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
  Person,
  Transaction,
  TransactionType,
} from "../types/transaction";
import { getCurrentBalance, getTotalOwed } from "../utils/pot";

type PotContextValue = {
  balance: number;
  owed: number;
  people: Person[];
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (input: {
    person: Person;
    type: TransactionType;
    amount: number;
    note?: string;
  }) => Promise<void>;
  addPerson: (name: string) => Promise<void>;
};

const STARTING_BALANCE = 240;

const PotContext = createContext<PotContextValue | undefined>(undefined);

export function PotProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      personId: person.id,
      personName: person.name,
      type,
      amount,
      note: note?.trim() ? note.trim() : undefined,
      createdAt,
    };

    setTransactions((prev) => [newTransaction, ...prev]);

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

    const docRef = await addDoc(collection(db, "people"), {
      name: trimmedName,
    });

    const newPerson: Person = {
      id: docRef.id,
      name: trimmedName,
    };

    setPeople((prev) => [...prev, newPerson]);
  };

  const balance = useMemo(() => {
    return getCurrentBalance(STARTING_BALANCE, transactions);
  }, [transactions]);

  const owed = useMemo(() => {
    return getTotalOwed(transactions);
  }, [transactions]);

  const value = useMemo(
    () => ({
      balance,
      owed,
      people,
      transactions,
      isLoading,
      addTransaction,
      addPerson,
    }),
    [balance, owed, people, transactions, isLoading],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const peopleSnapshot = await getDocs(collection(db, "people"));
        const loadedPeople: Person[] = peopleSnapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            name: data.name,
          };
        });

        const transactionSnapshot = await getDocs(
          collection(db, "transactions"),
        );
        const loadedTransactions: Transaction[] = transactionSnapshot.docs.map(
          (doc) => {
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
          },
        );

        loadedTransactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setPeople(loadedPeople);
        setTransactions(loadedTransactions);
      } catch (error) {
        console.error("Failed to load pot data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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