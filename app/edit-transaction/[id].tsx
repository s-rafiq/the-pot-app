import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../../components/ActionButton";
import { usePot } from "../../context/PotContext";
import type { TransactionType } from "../../types/transaction";
import { theme } from "../../constants/theme";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, people, updateTransaction } = usePot();

  const transaction = useMemo(() => {
    return transactions.find((t) => t.id === id);
  }, [transactions, id]);

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setSelectedPersonId(transaction.personId);
      setAmount(transaction.amount.toString());
      setNote(transaction.note ?? "");
      setType(transaction.type);
    }
  }, [transaction]);

  const handleSave = async () => {
    const parsedAmount = Number(amount);

    if (!transaction) {
      Alert.alert("Error", "Transaction not found.");
      return;
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount greater than 0."
      );
      return;
    }

    if (!type) {
      Alert.alert("No transaction type", "Please choose Take or Repay.");
      return;
    }

    const selectedPerson = people.find((person) => person.id === selectedPersonId);

    if (!selectedPerson) {
      Alert.alert("No person selected", "Please choose a person.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateTransaction(transaction.id, {
        personId: selectedPerson.id,
        personName: selectedPerson.name,
        type,
        amount: parsedAmount,
        note,
      });

      router.back();
    } catch (error) {
      console.error("Failed to update transaction:", error);
      Alert.alert("Error", "Could not update transaction.");
      setIsSubmitting(false);
    }
  };

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Transaction</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Choose Person</Text>
          <View style={styles.peopleRow}>
            {people.map((person) => {
              const isSelected = selectedPersonId === person.id;

              return (
                <TouchableOpacity
                  key={person.id}
                  style={[
                    styles.personChip,
                    isSelected && styles.personChipSelected,
                  ]}
                  onPress={() => setSelectedPersonId(person.id)}
                >
                  <Text
                    style={[
                      styles.personChipText,
                      isSelected && styles.personChipTextSelected,
                    ]}
                  >
                    {person.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Transaction Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeChip,
                type === "take" && styles.typeChipSelected,
              ]}
              onPress={() => setType("take")}
            >
              <Text
                style={[
                  styles.typeChipText,
                  type === "take" && styles.typeChipTextSelected,
                ]}
              >
                Take
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeChip,
                type === "repay" && styles.typeChipSelected,
              ]}
              onPress={() => setType("repay")}
            >
              <Text
                style={[
                  styles.typeChipText,
                  type === "repay" && styles.typeChipTextSelected,
                ]}
              >
                Repay
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 20"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Petrol, groceries, lunch"
            style={styles.input}
          />
        </View>

        <ActionButton label="Save Changes" onPress={handleSave} isLoading={isSubmitting} />
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
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 20,
      color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
      color: theme.colors.text,
  },
  peopleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  personChip: {
    backgroundColor: theme.colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  personChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  personChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  personChipTextSelected: {
    color: theme.colors.text,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    flex: 1,
    backgroundColor: theme.colors.cardBorder,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  typeChipTextSelected: {
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.colors.card,
      color: theme.colors.text,
  },
});