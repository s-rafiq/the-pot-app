import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatTransactionDate } from "../../utils/date";

import { usePot } from "../../context/PotContext";

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, transactions, previousDebtEntries } = usePot();

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
      }, 0)
    );
  }, [personTransactions]);

  const previousOwed = useMemo(() => {
    return Math.max(
      0,
      personPreviousDebtEntries.reduce((total, entry) => {
        if (entry.type === "debt") return total + entry.amount;
        return total - entry.amount;
      }, 0)
    );
  }, [personPreviousDebtEntries]);

  const totalOwedOverall = currentOwed + previousOwed;

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
          <Text style={styles.summaryValue}>£{totalOwedOverall.toFixed(2)}</Text>
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
                    <Text style={styles.date}>{entry.note}</Text>
                  ) : null}
                </View>

                <Text
                  style={{
                    fontWeight: "700",
                    color: entry.type === "debt" ? "#b42318" : "#067647",
                  }}
                >
                  {entry.type === "debt" ? "+" : "-"}£
                  {entry.amount.toFixed(2)}
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