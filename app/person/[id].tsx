import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePot } from "../../context/PotContext";
import { formatTransactionDate } from "../../utils/date";
import { theme } from "../../constants/theme";
import { formatMoney } from "../../utils/money";
import { TransactionRow, EditTransactionModal } from "../../components/SharedTransaction";
import type { Transaction } from "../../types/transaction";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    people,
    transactions,
    deleteTransaction,
    updateTransaction,
    myPersonId,
    setMyPersonId,
  } = usePot();

  const person = people.find((p) => p.id === id);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const isMe = myPersonId === id;

  const handleSetMe = async () => {
    if (isMe) {
      await setMyPersonId(null);
      Alert.alert("Unlinked", "You are no longer linked to this profile.");
    } else {
      if (typeof id === 'string') {
        await setMyPersonId(id);
        Alert.alert("Linked", "You are now linked to this profile.");
      }
    }
  };

  const personTransactions = useMemo(() => {
    return transactions.filter((t) => t.personId === id);
  }, [transactions, id]);

  const currentOwed = useMemo(() => {
    return Math.max(
      0,
      personTransactions.reduce((total, t) => {
        if (t.type === "take") return total + t.amount;
        return total - t.amount;
      }, 0),
    );
  }, [personTransactions]);

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      "Delete transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
            } catch (error) {
              console.error("Failed to delete transaction:", error);
              Alert.alert("Error", "Could not delete transaction.");
            }
          },
        },
      ],
    );
  };



  if (!person) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Person not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{person.name}</Text>
          <TouchableOpacity onPress={handleSetMe} style={styles.thisIsMeButton}>
            <Text style={styles.thisIsMeText}>{isMe ? "★ This is me" : "Set as me"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Current Owed</Text>
          <Text style={styles.summaryValue}>£{formatMoney(currentOwed)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transactions</Text>

          {personTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions</Text>
          ) : (
            personTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                people={people}
                onEdit={setEditTarget}
                onDelete={handleDeleteTransaction}
              />
            ))
          )}
        </View>
      </ScrollView>

      {editTarget && (
        <EditTransactionModal
          transaction={editTarget}
          people={people}
          onClose={() => setEditTarget(null)}
          onSave={updateTransaction}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
      color: theme.colors.text,
  },
  thisIsMeButton: {
    backgroundColor: theme.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  thisIsMeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
      color: theme.colors.text,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    gap: 12,
  },
  date: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  note: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
      color: theme.colors.text,
  },
  amountText: {
    fontWeight: "700",
      color: theme.colors.text,
  },
  takeAmount: {
    color: theme.colors.danger,
  },
  repayAmount: {
    color: theme.colors.success,
  },
  rightActions: {
    alignItems: "flex-end",
    gap: 8,
  },

  deleteButton: {
    paddingVertical: 4,
  },

  deleteButtonText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  editButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
