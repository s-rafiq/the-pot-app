import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatTransactionDate } from "../../utils/date";

import { usePot } from "../../context/PotContext";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, transactions } = usePot();

  const person = people.find((p) => p.id === id);

  const personTransactions = useMemo(() => {
    return transactions.filter((t) => t.personId === id);
  }, [transactions, id]);

  const totalOwed = useMemo(() => {
    return Math.max(
      0,
      personTransactions.reduce((total, t) => {
        if (t.type === "take") return total + t.amount;
        return total - t.amount;
      }, 0),
    );
  }, [personTransactions]);

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
          <Text style={styles.summaryLabel}>Amount Owed</Text>
          <Text style={styles.summaryValue}>£{totalOwed.toFixed(2)}</Text>
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
                </View>

                <Text
                  style={{
                    fontWeight: "700",
                    color: transaction.type === "take" ? "#b42318" : "#067647",
                  }}
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  date: {
    fontSize: 12,
    color: "#666",
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
});
