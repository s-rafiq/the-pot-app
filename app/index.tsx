import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { SummaryCard } from "../components/SummaryCard";
import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";
import { getPersonBalances } from "../utils/pot";

export default function HomeScreen() {
  const {
    balance,
    owed,
    previousOwed,
    transactions,
    isLoading,
    people,
    addPerson,
    deleteTransaction,
  } = usePot();

  const handleAddPerson = async () => {
    const trimmed = newPersonName.trim();

    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a name.");
      return;
    }

    try {
      await addPerson(trimmed);
      setNewPersonName("");
      setIsModalVisible(false);
    } catch (error) {
      console.error("Failed to add person:", error);
    }
  };

  const personBalances = useMemo(() => {
    return getPersonBalances(people, transactions);
  }, [people, transactions]);

  const grandTotalOwed = owed + previousOwed;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

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
          label="Net total balance"
          value={`£${(balance + grandTotalOwed).toFixed(2)}`}
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
          <Text style={styles.sectionTitle}>People</Text>
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
          <ActionButton
            label="+ Add Person"
            onPress={() => setIsModalVisible(true)}
            variant="secondary"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {isLoading ? (
            <Text style={styles.emptyText}>Loading transactions...</Text>
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            transactions.map((transaction) => (
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
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Person</Text>

            <TextInput
              value={newPersonName}
              onChangeText={setNewPersonName}
              placeholder="Enter name"
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setIsModalVisible(false);
                  setNewPersonName("");
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleAddPerson}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalSave: {
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8dce6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
});