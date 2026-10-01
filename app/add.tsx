import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ActionButton } from "../components/ActionButton";
import { usePot } from "../context/PotContext";
import type { TransactionType } from "../types/transaction";
import { theme } from "../constants/theme";

export default function AddTransactionScreen() {
  const { addTransaction, people } = usePot();

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [date, setDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("myPersonId").then((myId) => {
      if (myId && people.some(p => p.id === myId)) {
        setSelectedPersonId(myId);
      } else if (people.length > 0 && !selectedPersonId) {
        setSelectedPersonId(people[0].id);
      }
    });
  }, [people]);

  const handleSave = async () => {
    const parsedAmount = Number(amount);

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount greater than 0.",
      );
      return;
    }

    if (!type) {
      Alert.alert("No transaction type", "Please choose Withdraw or Deposit.");
      return;
    }

    const selectedPerson = people.find(
      (person) => person.id === selectedPersonId,
    );

    if (!selectedPerson) {
      Alert.alert("No person selected", "Please choose a person.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addTransaction({
        person: selectedPerson,
        type,
        amount: parsedAmount,
        note,
        date: date.toISOString(),
      });

      router.back();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      Alert.alert("Error", "Could not save transaction.");
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Add Transaction</Text>

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
              Deposit
            </Text>
          </TouchableOpacity>

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
              Withdraw
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.inputPrefixContainer}>
            <Text style={styles.inputPrefix}>£</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              style={styles.inputWithPrefix}
            />
          </View>
        </View>

        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.label}>Date</Text>
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            themeVariant="dark"
            onChange={(event, selectedDate) => {
              if (selectedDate) setDate(selectedDate);
            }}
            style={{ alignSelf: 'flex-start', marginTop: 4 }}
          />
        </View>
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

            <View style={{ flexDirection: 'row', marginTop: 'auto', paddingTop: 20 }}>
              <ActionButton label="Confirm Transaction" onPress={handleSave} isLoading={isSubmitting} />
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
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
  inputPrefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
    paddingHorizontal: 14,
  },
  inputPrefix: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 4,
  },
  inputWithPrefix: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
});
