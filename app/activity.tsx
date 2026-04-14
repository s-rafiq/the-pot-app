import { router } from "expo-router";
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
import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";

export default function ActivityScreen() {
  const { transactions, isLoading, deleteTransaction } = usePot();

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [transactions]);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recent Activity</Text>

        <View style={styles.card}>
          {isLoading ? (
            <Text style={styles.emptyText}>Loading transactions...</Text>
          ) : sortedTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            sortedTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.row}>
                <View style={styles.left}>
                  <Text style={styles.rowTitle}>
                    {transaction.personName}{" "}
                    {transaction.type === "take"
                      ? "took from pot"
                      : "repaid pot"}
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
                      styles.amount,
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
                    style={styles.actionButton}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteTransaction(transaction.id)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eef1f5",
    gap: 12,
  },
  left: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: "#666",
  },
  note: {
    fontSize: 14,
    color: "#444",
    marginTop: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  takeAmount: {
    color: "#b42318",
  },
  repayAmount: {
    color: "#067647",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
  },
  rightActions: {
    alignItems: "flex-end",
    gap: 8,
  },

  actionButton: {
    paddingVertical: 4,
  },

  editText: {
    color: "#111",
    fontSize: 13,
    fontWeight: "600",
  },

  deleteText: {
    color: "#b42318",
    fontSize: 13,
    fontWeight: "600",
  },
});