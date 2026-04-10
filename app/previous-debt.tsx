import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { usePot } from "../context/PotContext";
import type { PreviousDebtEntryType } from "../types/transaction";

export default function PreviousDebtScreen() {
  const { people, addPreviousDebtEntry } = usePot();

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<PreviousDebtEntryType>("debt");

  useEffect(() => {
    if (people.length > 0 && !selectedPersonId) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

  const handleSave = async () => {
    const parsedAmount = Number(amount);

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Invalid amount",
        "Please enter a valid amount greater than 0.",
      );
      return;
    }

    const selectedPerson = people.find(
      (person) => person.id === selectedPersonId,
    );

    if (!selectedPerson) {
      Alert.alert("No person selected", "Please choose a person.");
      return;
    }

    try {
      await addPreviousDebtEntry({
        person: selectedPerson,
        type,
        amount: parsedAmount,
        note,
      });

      router.back();
    } catch (error) {
      console.error("Failed to save previous debt entry:", error);
      Alert.alert("Error", "Could not save previous debt entry.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Previously Owed</Text>

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
        <Text style={styles.label}>Entry Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeChip,
              type === "debt" && styles.typeChipSelected,
            ]}
            onPress={() => setType("debt")}
          >
            <Text
              style={[
                styles.typeChipText,
                type === "debt" && styles.typeChipTextSelected,
              ]}
            >
              Add Debt
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
              Repay Debt
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 100"
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. old large borrowing"
          style={styles.input}
        />
      </View>

      <ActionButton label="Save Previous Debt Entry" onPress={handleSave} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    padding: 20,
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
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  peopleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  personChip: {
    backgroundColor: "#eef1f5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  personChipSelected: {
    backgroundColor: "#111",
  },
  personChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  personChipTextSelected: {
    color: "#fff",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    flex: 1,
    backgroundColor: "#eef1f5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  typeChipSelected: {
    backgroundColor: "#111",
  },
  typeChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  typeChipTextSelected: {
    color: "#fff",
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