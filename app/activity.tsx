import { useMemo, useRef, useState } from "react";
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
import { theme } from "../constants/theme";
import { usePot } from "../context/PotContext";
import type { Transaction, TransactionType } from "../types/transaction";
import { formatTransactionDate } from "../utils/date";
import { formatMoney } from "../utils/money";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditTransactionModal({
  transaction,
  onClose,
  onSave,
}: {
  transaction: Transaction;
  onClose: () => void;
  onSave: (
    id: string,
    personId: string,
    personName: string,
    type: TransactionType,
    amount: number,
    note: string,
  ) => Promise<void>;
}) {
  const { people } = usePot();
  const [selectedPersonId, setSelectedPersonId] = useState(transaction.personId);
  const [type, setType] = useState<TransactionType>(transaction.type as TransactionType);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [note, setNote] = useState(transaction.note ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const parsed = Number(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount greater than 0.");
      return;
    }
    const person = people.find((p) => p.id === selectedPersonId);
    if (!person) {
      Alert.alert("No person selected", "Please choose a person.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(transaction.id, person.id, person.name, type, parsed, note);
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={modal.overlay}>
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
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Swipeable Row ────────────────────────────────────────────────────────────

function TransactionRow({
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ActivityScreen() {
  const { transactions, isLoading, deleteTransaction, updateTransaction, people } = usePot();

  const sortedTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => t.type !== "write-off")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [transactions]);

  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const handleDelete = (id: string) => {
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
              await deleteTransaction(id);
            } catch (error) {
              console.error("Failed to delete transaction:", error);
              Alert.alert("Error", "Could not delete transaction.");
            }
          },
        },
      ],
    );
  };

  const handleEditSave = async (
    id: string,
    personId: string,
    personName: string,
    type: TransactionType,
    amount: number,
    note: string,
  ) => {
    await updateTransaction(id, { personId, personName, type, amount, note });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recent Activity</Text>

        <View style={styles.card}>
          {isLoading ? (
            <Text style={styles.emptyText}>Loading transactions...</Text>
          ) : sortedTransactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            sortedTransactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                people={people}
                onEdit={setEditTarget}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>
      </ScrollView>

      {editTarget && (
        <EditTransactionModal
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
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    gap: 12,
    backgroundColor: theme.colors.card,
  },
  left: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
    color: theme.colors.text,
  },
  date: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  note: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  takeAmount: { color: theme.colors.danger },
  repayAmount: { color: theme.colors.success },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    padding: 16,
  },
  rightActions: { alignItems: "flex-end" },
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: theme.colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: "#fff",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: theme.colors.cardBorder,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeText: {
    fontSize: 14,
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
