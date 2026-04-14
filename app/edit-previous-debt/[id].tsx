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
import type { PreviousDebtEntryType } from "../../types/transaction";

export default function EditPreviousDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { previousDebtEntries, people, updatePreviousDebtEntry } = usePot();

  const entry = useMemo(() => {
    return previousDebtEntries.find((e) => e.id === id);
  }, [previousDebtEntries, id]);

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<PreviousDebtEntryType | "">("");

  useEffect(() => {
    if (entry) {
      setSelectedPersonId(entry.personId);
      setAmount(entry.amount.toString());
      setNote(entry.note ?? "");
      setType(entry.type);
    }
  }, [entry]);

  const handleSave = async () => {
    const parsedAmount = Number(amount);

    if (!entry) {
      Alert.alert("Error", "Entry not found.");
      return;
    }

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid amount.");
      return;
    }

    if (!type) {
      Alert.alert("Select type", "Choose debt or repayment.");
      return;
    }

    const selectedPerson = people.find((p) => p.id === selectedPersonId);

    if (!selectedPerson) {
      Alert.alert("Select person", "Choose a person.");
      return;
    }

    try {
      await updatePreviousDebtEntry(entry.id, {
        personId: selectedPerson.id,
        personName: selectedPerson.name,
        type,
        amount: parsedAmount,
        note,
      });

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not update.");
    }
  };

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Entry not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Previous Debt</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Person</Text>
          <View style={styles.peopleRow}>
            {people.map((p) => {
              const isSelected = selectedPersonId === p.id;

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.personChip,
                    isSelected && styles.personChipSelected,
                  ]}
                  onPress={() => setSelectedPersonId(p.id)}
                >
                  <Text
                    style={[
                      styles.personChipText,
                      isSelected && styles.personChipTextSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeChip,
                type === "debt" && styles.typeChipSelected,
              ]}
              onPress={() => setType("debt")}
            >
              <Text style={styles.typeChipText}>Debt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeChip,
                type === "repay" && styles.typeChipSelected,
              ]}
              onPress={() => setType("repay")}
            >
              <Text style={styles.typeChipText}>Repay</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            style={styles.input}
          />
        </View>

        <ActionButton label="Save Changes" onPress={handleSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7fb" },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontWeight: "600", marginBottom: 10 },
  peopleRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  personChip: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: "#eee",
  },
  personChipSelected: { backgroundColor: "#111" },
  personChipText: { color: "#111" },
  personChipTextSelected: { color: "#fff" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  typeChipSelected: { backgroundColor: "#111" },
  typeChipText: { color: "#111" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
});