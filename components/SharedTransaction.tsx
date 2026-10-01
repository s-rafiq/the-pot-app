import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import type { Transaction, TransactionType } from "../types/transaction";
import { formatTransactionDate } from "../utils/date";
import { formatMoney } from "../utils/money";
import { theme } from "../constants/theme";

export function EditTransactionModal({
  transaction,
  people,
  onClose,
  onSave,
}: {
  transaction: Transaction;
  people: { id: string; name: string }[];
  onClose: () => void;
  onSave: (
    id: string,
    updates: {
      personId: string;
      personName: string;
      type: TransactionType;
      amount: number;
      note: string;
    }
  ) => Promise<void>;
}) {
  const [selectedPersonId, setSelectedPersonId] = useState(
    transaction.personId,
  );
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [note, setNote] = useState(transaction.note || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    const person = people.find((p) => p.id === selectedPersonId);
    if (!person) {
      Alert.alert("Error", "Please select a person.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(transaction.id, {
        personId: person.id,
        personName: person.name,
        type,
        amount: parsed,
        note,
      });
      onClose();
    } catch {
      Alert.alert("Error", "Could not update transaction.");
      setIsSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]} 
            onPress={Keyboard.dismiss} 
          />
          <View style={modal.sheet}>
            <Text style={modal.title}>Edit Transaction</Text>

              {/* Person picker */}
              <View style={[modal.card, { marginBottom: 14 }]}>
                <Text style={modal.label}>Person</Text>
                <View style={modal.chipRow}>
                  {people.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[modal.chip, selectedPersonId === p.id && modal.chipSelected]}
                      onPress={() => setSelectedPersonId(p.id)}
                    >
                      <Text style={[modal.chipText, selectedPersonId === p.id && modal.chipTextSelected]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type picker */}
              <View style={[modal.card, { marginBottom: 14 }]}>
                <Text style={modal.label}>Type</Text>
                <View style={modal.typeRow}>
                  <TouchableOpacity
                    style={[modal.typeChip, type === "take" && modal.typeChipSelected]}
                    onPress={() => setType("take")}
                  >
                    <Text style={[modal.typeText, type === "take" && modal.typeTextSelected]}>Withdraw</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[modal.typeChip, type === "repay" && modal.typeChipSelected]}
                    onPress={() => setType("repay")}
                  >
                    <Text style={[modal.typeText, type === "repay" && modal.typeTextSelected]}>Deposit</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount */}
              <View style={[modal.card, { marginBottom: 14 }]}>
                <Text style={modal.label}>Amount</Text>
                <View style={modal.prefixRow}>
                  <Text style={modal.prefix}>£</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    style={modal.prefixInput}
                  />
                </View>
              </View>

              {/* Note */}
              <View style={[modal.card, { marginBottom: 20 }]}>
                <Text style={modal.label}>Note (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Petrol, groceries, lunch"
                  style={modal.input}
                  multiline
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
                  <Text style={modal.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modal.saveBtn, isSaving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={modal.saveText}>{isSaving ? "Saving…" : "Save"}</Text>
                </TouchableOpacity>
              </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function TransactionRow({
  transaction,
  people,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  people: { id: string; name: string }[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.editBtn]}
        onPress={() => { swipeRef.current?.close(); onEdit(transaction); }}
      >
        <Text style={styles.swipeIcon}>•••</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.deleteBtn]}
        onPress={() => { swipeRef.current?.close(); onDelete(transaction.id); }}
      >
        <Text style={styles.swipeIcon}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  const personName = people.find((p) => p.id === transaction.personId)?.name ?? transaction.personName;
  const isDebit = transaction.type === "take" || transaction.type === "write-off";

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.rowTitle}>
            {`${personName} ${transaction.type === "take" ? "withdrew from pot" : "deposited to pot"}`}
          </Text>
          <Text style={styles.date}>{formatTransactionDate(transaction.createdAt)}</Text>
          {transaction.note ? <Text style={styles.note}>{transaction.note}</Text> : null}
        </View>
        <View style={styles.rightActions}>
          <Text style={[styles.amount, isDebit ? styles.takeAmount : styles.repayAmount]}>
            {isDebit ? "-" : "+"}£{formatMoney(transaction.amount)}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  left: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: theme.colors.text,
  },
  rightActions: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  takeAmount: {
    color: theme.colors.danger,
  },
  repayAmount: {
    color: theme.colors.success,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: "100%",
  },
  editBtn: {
    backgroundColor: theme.colors.primary,
  },
  deleteBtn: {
    backgroundColor: theme.colors.danger,
  },
  swipeIcon: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBorder,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: "#fff",
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.cardBorder,
    alignItems: "center",
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  typeTextSelected: {
    color: "#fff",
  },
  prefixRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background,
  },
  prefix: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginRight: 8,
  },
  prefixInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    minHeight: 60,
    textAlignVertical: "top",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.cardBorder,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.primary ?? "#6366f1",
    alignItems: "center",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
