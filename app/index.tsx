import { Feather } from "@expo/vector-icons";
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

import { ActionButton } from "../components/ActionButton";
import { SummaryCard } from "../components/SummaryCard";
import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";
import { getFundingEventTotals, getPersonBalances } from "../utils/pot";

export default function HomeScreen() {
  const {
    balance,
    owed,
    previousOwed,
    transactions,
    isLoading,
    people,
    deleteTransaction,
    fundingEvents,
    fundingEventDeductions,
  } = usePot();

  const personBalances = useMemo(() => {
    return getPersonBalances(people, transactions);
  }, [people, transactions]);

  const recentTransactions = transactions.slice(0, 4);

  const grandTotalOwed = owed + previousOwed;

  const totalFundingNet = fundingEvents.reduce((sum, event) => {
    const { net } = getFundingEventTotals(event, fundingEventDeductions);
    return sum + net;
  }, 0);

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
        <Text style={styles.appTitle}>The Pot</Text>

        <SummaryCard
          label="Current Pot Balance"
          value={`£${balance.toFixed(2)}`}
        />

        <SummaryCard label="Current Pot Owed" value={`£${owed.toFixed(2)}`} />

        <SummaryCard
          label="Previously Owed"
          value={`£${previousOwed.toFixed(2)}`}
        />

        <SummaryCard
          label="Grand Total Owed"
          value={`£${grandTotalOwed.toFixed(2)}`}
        />

        <SummaryCard
          label="Total Net Funding"
          value={`£${totalFundingNet.toFixed(2)}`}
        />

        <View style={styles.buttonRow}>
          <ActionButton
            label="Take"
            onPress={() =>
              router.push({ pathname: "/add", params: { type: "take" } })
            }
          />
          <ActionButton
            label="Repay"
            onPress={() =>
              router.push({ pathname: "/add", params: { type: "repay" } })
            }
            variant="secondary"
          />
        </View>

        <ActionButton
          label="Previously Owed"
          onPress={() => router.push("/previous-debt")}
          variant="secondary"
        />

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>People</Text>

            <TouchableOpacity onPress={() => router.push("/people")}>
              <Feather name="more-horizontal" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          {people.length === 0 ? (
            <Text style={styles.emptyText}>No people yet.</Text>
          ) : (
            people.map((person) => {
              const personBalance = personBalances[person.id] ?? 0;

              return (
                <TouchableOpacity
                  key={person.id}
                  style={styles.personBalanceRow}
                  onPress={() => router.push(`/person/${person.id}`)}
                >
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personBalance}>
                    £{personBalance.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Funding Events</Text>

            <TouchableOpacity onPress={() => router.push("/funding")}>
              <Feather name="more-horizontal" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          {fundingEvents.length === 0 ? (
            <Text style={styles.emptyText}>No funding events yet.</Text>
          ) : (
            fundingEvents.map((event) => {
              const { deductions, net } = getFundingEventTotals(
                event,
                fundingEventDeductions,
              );

              return (
                <View key={event.id} style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionTitle}>{event.title}</Text>
                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(event.createdAt)}
                    </Text>
                    {event.note ? (
                      <Text style={styles.transactionNote}>{event.note}</Text>
                    ) : null}
                    <Text style={styles.transactionNote}>
                      Deductions: £{deductions.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={[styles.transactionAmount, styles.repayAmount]}>
                    +£{net.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            <TouchableOpacity onPress={() => router.push("/activity")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Text style={styles.emptyText}>Loading transactions...</Text>
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            recentTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionRow}
                onPress={() => handleDeleteTransaction(transaction.id)}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionTitle}>
                    {transaction.personName}{" "}
                    {transaction.type === "take"
                      ? "took from pot"
                      : "repaid pot"}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(transaction.createdAt)}
                  </Text>
                  {transaction.note ? (
                    <Text style={styles.transactionNote}>
                      {transaction.note}
                    </Text>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === "take"
                      ? styles.takeAmount
                      : styles.repayAmount,
                  ]}
                >
                  {transaction.type === "take" ? "-" : "+"}£
                  {transaction.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
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
  appTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  personBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef1f5",
  },
  personName: {
    fontSize: 16,
    fontWeight: "500",
  },
  personBalance: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eef1f5",
    gap: 12,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: "#666",
  },
  transactionNote: {
    fontSize: 14,
    color: "#444",
    marginTop: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  takeAmount: {
    color: "#b42318",
  },
  repayAmount: {
    color: "#067647",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
});