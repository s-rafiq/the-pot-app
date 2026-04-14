import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";

export default function ActivityScreen() {
  const { transactions, isLoading } = usePot();

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [transactions]);

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
});