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

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    people,
    transactions,
    previousDebtEntries,
    deleteTransaction,
    deletePreviousDebtEntry,
    myPersonId,
    setMyPersonId,
  } = usePot();

  const person = people.find((p) => p.id === id);

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

        {previousOwed > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Previously Owed</Text>
            <Text style={styles.summaryValue}>£{formatMoney(previousOwed)}</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Owed Overall</Text>
          <Text style={styles.summaryValue}>
            £{formatMoney(totalOwedOverall)}
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
                      ? "Withdrew from pot"
                      : "Deposited to pot"}
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
                    {formatMoney(transaction.amount)}
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
                    {formatMoney(entry.amount)}
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
