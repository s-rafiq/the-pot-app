import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
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

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    people,
    transactions,
    previousDebtEntries,
    deleteTransaction,
    deletePreviousDebtEntry,
  } = usePot();

  const person = people.find((p) => p.id === id);

  const personTransactions = useMemo(() => {
    return transactions.filter((t) => t.personId === id);
  }, [transactions, id]);

  const personPreviousDebtEntries = useMemo(() => {
    return previousDebtEntries.filter((entry) => entry.personId === id);
  }, [previousDebtEntries, id]);

  const currentOwed = useMemo(() => {
    return Math.max(
      0,
      personTransactions.reduce((total, t) => {
        if (t.type === "take") return total + t.amount;
        return total - t.amount;
      }, 0),
    );
  }, [personTransactions]);

  const previousOwed = useMemo(() => {
    return Math.max(
      0,
      personPreviousDebtEntries.reduce((total, entry) => {
        if (entry.type === "debt") return total + entry.amount;
        return total - entry.amount;
      }, 0),
    );
  }, [personPreviousDebtEntries]);

  const totalOwedOverall = currentOwed + previousOwed;

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

  const handleDeletePreviousDebtEntry = (entryId: string) => {
    Alert.alert(
      "Delete previous debt entry",
      "Are you sure you want to delete this previous debt entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePreviousDebtEntry(entryId);
            } catch (error) {
              console.error("Failed to delete previous debt entry:", error);
              Alert.alert("Error", "Could not delete previous debt entry.");
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
        <Text style={styles.name}>{person.name}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Current Owed</Text>
          <Text style={styles.summaryValue}>£{currentOwed.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Previously Owed</Text>
          <Text style={styles.summaryValue}>£{previousOwed.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Owed Overall</Text>
          <Text style={styles.summaryValue}>
            £{totalOwedOverall.toFixed(2)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transactions</Text>

          {personTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions</Text>
          ) : (
            personTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text>
                    {transaction.type === "take"
                      ? "Took from pot"
                      : "Repaid pot"}
                  </Text>

                  <Text style={styles.date}>
                    {formatTransactionDate(transaction.createdAt)}
                  </Text>

                  {transaction.note ? (
                    <Text style={styles.note}>{transaction.note}</Text>
                  ) : null}
                </View>

                <View style={styles.rightActions}>
                  <Text
                    style={[
                      styles.amountText,
                      transaction.type === "take"
                        ? styles.takeAmount
                        : styles.repayAmount,
                    ]}
                  >
                    {transaction.type === "take" ? "-" : "+"}£
                    {transaction.amount.toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/edit-transaction/${transaction.id}`)
                    }
                    style={styles.deleteButton}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteTransaction(transaction.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Previously Owed</Text>

          {personPreviousDebtEntries.length === 0 ? (
            <Text style={styles.emptyText}>No previous debt entries</Text>
          ) : (
            personPreviousDebtEntries.map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text>
                    {entry.type === "debt"
                      ? "Added previous debt"
                      : "Repaid previous debt"}
                  </Text>

                  <Text style={styles.date}>
                    {formatTransactionDate(entry.createdAt)}
                  </Text>

                  {entry.note ? (
                    <Text style={styles.note}>{entry.note}</Text>
                  ) : null}
                </View>

                <View style={styles.rightActions}>
                  <Text
                    style={[
                      styles.amountText,
                      entry.type === "debt"
                        ? styles.takeAmount
                        : styles.repayAmount,
                    ]}
                  >
                    {entry.type === "debt" ? "+" : "-"}£
                    {entry.amount.toFixed(2)}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/edit-previous-debt/${entry.id}`)
                    }
                    style={styles.deleteButton}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeletePreviousDebtEntry(entry.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  date: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  note: {
    fontSize: 14,
    color: "#444",
    marginTop: 6,
  },
  emptyText: {
    color: "#666",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  amountText: {
    fontWeight: "700",
  },
  takeAmount: {
    color: "#b42318",
  },
  repayAmount: {
    color: "#067647",
  },
  rightActions: {
    alignItems: "flex-end",
    gap: 8,
  },

  deleteButton: {
    paddingVertical: 4,
  },

  deleteButtonText: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "600",
  },
  editButtonText: {
    color: "#111",
    fontSize: 13,
    fontWeight: "600",
  },
});
