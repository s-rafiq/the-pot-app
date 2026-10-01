import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { theme } from "../constants/theme";
import { usePot } from "../context/PotContext";
import type { Transaction } from "../types/transaction";
import { formatTransactionDate } from "../utils/date";
import { formatMoney } from "../utils/money";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditWriteOffModal({
  transaction,
  onClose,
  onSave,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSave: (id: string, amount: number, note: string, date: Date) => Promise<void>;
}) {
  const [editAmount, setEditAmount] = useState(String(transaction.amount));
  const [editNote, setEditNote] = useState(transaction.note ?? "");
  const [editDate, setEditDate] = useState(new Date(transaction.createdAt));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsed = Number(editAmount);
    if (!editAmount || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount greater than 0.");
      return;
    }
    if (!editNote.trim()) {
      Alert.alert("Note required", "Please provide a reason for this write-off.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(transaction.id, parsed, editNote, editDate);
      onClose();
    } catch {
      Alert.alert("Error", "Could not update write-off.");
      setIsSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={modal.overlay}>
            <View style={modal.sheet}>
              <Text style={modal.title}>Edit Write-off</Text>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
                <View style={[modal.card, { flex: 1 }]}>
                  <Text style={modal.label}>Amount</Text>
                  <View style={modal.prefixRow}>
                    <Text style={modal.prefix}>£</Text>
                    <TextInput
                      value={editAmount}
                      onChangeText={setEditAmount}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      style={modal.prefixInput}
                    />
                  </View>
                </View>

                <View style={[modal.card, { flex: 1 }]}>
                  <Text style={modal.label}>Date</Text>
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display="default"
                    themeVariant="dark"
                    onChange={(_, d) => { if (d) setEditDate(d); }}
                    style={{ alignSelf: "flex-start", marginTop: 4 }}
                  />
                </View>
              </View>

              <View style={[modal.card, { marginBottom: 20 }]}>
                <Text style={modal.label}>Note (required)</Text>
                <TextInput
                  value={editNote}
                  onChangeText={setEditNote}
                  placeholder="Reason for write-off"
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
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Swipeable Row ────────────────────────────────────────────────────────────

function WriteOffRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
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
          <Text style={styles.rowTitle}>{formatTransactionDate(transaction.createdAt)}</Text>
          {transaction.note ? (
            <Text style={styles.noteText}>{transaction.note}</Text>
          ) : null}
        </View>
        <View style={styles.rightActions}>
          <Text style={[styles.amount, styles.takeAmount]}>
            -£{formatMoney(transaction.amount)}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WriteOffScreen() {
  const { addTransaction, updateTransaction, deleteTransaction, transactions } = usePot();

  const writeOffs = transactions
    .filter((t) => t.type === "write-off")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const handleSave = async () => {
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount greater than 0.");
      return;
    }
    if (!note.trim()) {
      Alert.alert("Note required", "Please provide a reason for this write-off.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addTransaction({
        person: { id: "pot", name: "Pot" },
        type: "write-off",
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

  const handleEditSave = async (id: string, amt: number, n: string, _d: Date) => {
    await updateTransaction(id, {
      personId: "pot",
      personName: "Pot",
      type: "write-off",
      amount: amt,
      note: n,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Write-off",
      "Are you sure you want to delete this write-off? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          {/* Top static content */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              <Text style={styles.title}>Write-off</Text>

              <View style={{ flexDirection: "row", gap: 16 }}>
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
                    onChange={(_, selectedDate) => {
                      if (selectedDate) setDate(selectedDate);
                    }}
                    style={{ alignSelf: "flex-start", marginTop: 4 }}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.label}>Note (required)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Lost money, extra expense"
                  style={styles.input}
                />
              </View>

              <View style={{ flexDirection: "row", marginBottom: 20 }}>
                <ActionButton label="Confirm Write-off" onPress={handleSave} isLoading={isSubmitting} />
              </View>
            </View>
          </TouchableWithoutFeedback>

          {/* Scrollable write-offs list */}
          <View style={[styles.listContainer, { flex: 1 }]}>
            <Text style={styles.label}>Previous Write-offs</Text>
            {writeOffs.length === 0 ? (
              <Text style={styles.emptyText}>No write-offs yet.</Text>
            ) : (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator bounces>
                {writeOffs.map((t) => (
                  <WriteOffRow
                    key={t.id}
                    transaction={t}
                    onEdit={setEditTarget}
                    onDelete={handleDelete}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {editTarget && (
        <EditWriteOffModal
          transaction={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSave}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    flexDirection: "row",
    alignItems: "center",
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
  listContainer: {
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontStyle: "italic",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.background,
  },
  left: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  rightActions: { alignItems: "flex-end" },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  takeAmount: {
    color: theme.colors.danger,
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  swipeBtn: {
    width: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: theme.colors.primary ?? "#6366f1",
  },
  deleteBtn: {
    backgroundColor: theme.colors.danger ?? "#ef4444",
  },
  swipeIcon: {
    fontSize: 18,
    color: "#fff",
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
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  prefixRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background,
  },
  prefix: {
    fontSize: 16,
    color: theme.colors.text,
    marginRight: 4,
  },
  prefixInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
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

