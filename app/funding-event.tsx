import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { usePot } from "../context/PotContext";

type DeductionDraft = {
  id: string;
  label: string;
  amount: string;
};

export default function FundingEventScreen() {
  const { addFundingEvent } = usePot();

  const [title, setTitle] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [note, setNote] = useState("");
  const [deductions, setDeductions] = useState<DeductionDraft[]>([
    { id: Date.now().toString(), label: "", amount: "" },
  ]);

  const updateDeduction = (
    id: string,
    field: "label" | "amount",
    value: string
  ) => {
    setDeductions((prev) =>
      prev.map((deduction) =>
        deduction.id === id ? { ...deduction, [field]: value } : deduction
      )
    );
  };

  const addDeductionRow = () => {
    setDeductions((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length}`, label: "", amount: "" },
    ]);
  };

  const removeDeductionRow = (id: string) => {
    setDeductions((prev) => prev.filter((deduction) => deduction.id !== id));
  };

  const totalDeductions = deductions.reduce((sum, deduction) => {
    const parsed = Number(deduction.amount);
    return sum + (Number.isNaN(parsed) ? 0 : parsed);
  }, 0);

  const parsedGross = Number(grossAmount);
  const netAmount =
    Number.isNaN(parsedGross) || !grossAmount ? 0 : parsedGross - totalDeductions;

  const handleSave = async () => {
    const parsedGrossAmount = Number(grossAmount);

    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a funding event title.");
      return;
    }

    if (
      !grossAmount ||
      Number.isNaN(parsedGrossAmount) ||
      parsedGrossAmount <= 0
    ) {
      Alert.alert(
        "Invalid gross amount",
        "Please enter a valid gross amount greater than 0."
      );
      return;
    }

    const cleanedDeductions = deductions
      .filter((deduction) => deduction.label.trim() || deduction.amount.trim())
      .map((deduction) => ({
        label: deduction.label.trim(),
        amount: Number(deduction.amount),
      }));

    const hasInvalidDeduction = cleanedDeductions.some(
      (deduction) =>
        !deduction.label || Number.isNaN(deduction.amount) || deduction.amount < 0
    );

    if (hasInvalidDeduction) {
      Alert.alert(
        "Invalid deduction",
        "Each deduction needs a label and a valid amount."
      );
      return;
    }

    try {
      await addFundingEvent({
        title: title.trim(),
        grossAmount: parsedGrossAmount,
        note,
        deductions: cleanedDeductions,
      });

      router.back();
    } catch (error) {
      console.error("Failed to save funding event:", error);
      Alert.alert("Error", "Could not save funding event.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Funding Event</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. SEP Student Finance"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Gross Amount</Text>
          <TextInput
            value={grossAmount}
            onChangeText={setGrossAmount}
            placeholder="e.g. 1200"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Deductions</Text>

          {deductions.map((deduction, index) => (
            <View key={deduction.id} style={styles.deductionBlock}>
              <TextInput
                value={deduction.label}
                onChangeText={(value) =>
                  updateDeduction(deduction.id, "label", value)
                }
                placeholder={`Deduction ${index + 1} label`}
                style={styles.input}
              />
              <TextInput
                value={deduction.amount}
                onChangeText={(value) =>
                  updateDeduction(deduction.id, "amount", value)
                }
                placeholder="Amount"
                keyboardType="numeric"
                style={styles.input}
              />

              {deductions.length > 1 ? (
                <TouchableOpacity
                  onPress={() => removeDeductionRow(deduction.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <TouchableOpacity onPress={addDeductionRow} style={styles.addRowButton}>
            <Text style={styles.addRowButtonText}>+ Add deduction</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.summaryLine}>
            Total deductions: £{totalDeductions.toFixed(2)}
          </Text>
          <Text style={styles.summaryLine}>
            Net received: £{netAmount.toFixed(2)}
          </Text>
        </View>

        <ActionButton label="Save Funding Event" onPress={handleSave} />
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
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8dce6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  deductionBlock: {
    marginBottom: 8,
  },
  addRowButton: {
    paddingVertical: 10,
  },
  addRowButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  removeButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  removeButtonText: {
    color: "#b42318",
    fontWeight: "600",
  },
  summaryLine: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
});