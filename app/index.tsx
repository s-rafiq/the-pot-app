import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants/theme";

import { ActionButton } from "../components/ActionButton";
import { SummaryCard } from "../components/SummaryCard";
import { WidgetGrid } from "../components/widget/WidgetGrid";
import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";
import { getFundingEventTotals, getPersonBalances, getPreviousDebtBalances } from "../utils/pot";
import { formatMoney } from "../utils/money";

export default function HomeScreen() {
  const {
    balance,
    owed,
    previousOwed,
    transactions,
    previousDebtEntries,
    isLoading,
    people,
    fundingEvents,
    fundingEventDeductions,
    potName,
    myPersonId,
    updatePotSettings,
  } = usePot();

  const [isEditSettingsModalVisible, setIsEditSettingsModalVisible] = useState(false);
  const [newPotName, setNewPotName] = useState("");

  const personBalances = useMemo(() => {
    return getPersonBalances(people, transactions);
  }, [people, transactions]);

  const previousBalances = useMemo(() => {
    return getPreviousDebtBalances(people, previousDebtEntries);
  }, [people, previousDebtEntries]);

  const recentTransactions = transactions.filter((t) => t.type !== "write-off").slice(0, 4);

  const grandTotalOwed = owed + previousOwed;

  const myPersonBalance = myPersonId ? (personBalances[myPersonId] ?? 0) : null;

  const handleSaveSettings = async () => {
    if (!newPotName.trim()) {
      return;
    }
    try {
      await updatePotSettings({
        potName: newPotName.trim()
      });
      setIsEditSettingsModalVisible(false);
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.appTitle}>{potName}</Text>
          <TouchableOpacity onPress={() => {
            setNewPotName(potName);
            setIsEditSettingsModalVisible(true);
          }}>
            <Feather name="settings" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <WidgetGrid 
          balance={balance} 
          owed={owed} 
          grandTotalOwed={grandTotalOwed}
          myPersonBalance={myPersonBalance}
        />

        <View style={styles.buttonRow}>
          <ActionButton
            label="Deposit / Withdraw"
            onPress={() => router.push("/add")}
          />
        </View>

        <View style={[styles.buttonRow, { marginTop: -10 }]}>
          <ActionButton
            label="Write-off"
            variant="secondary"
            onPress={() => router.push("/write-off")}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>People</Text>
            </View>

            <TouchableOpacity onPress={() => router.push("/people")}>
              <Feather name="more-horizontal" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

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
                    £{formatMoney(personBalance)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Funding Events</Text>

            <TouchableOpacity onPress={() => router.push("/funding")}>
              <Feather name="more-horizontal" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {fundingEvents.length === 0 ? (
            <Text style={styles.emptyText}>No funding events yet.</Text>
          ) : (
            fundingEvents.map((event) => {
              const { deductions, net } = getFundingEventTotals(
                event,
                fundingEventDeductions,
              );

              return (
                <View key={event.id} style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionTitle}>{event.title}</Text>
                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(event.createdAt)}
                    </Text>
                    {event.note ? (
                      <Text style={styles.transactionNote}>{event.note}</Text>
                    ) : null}
                    <Text style={styles.transactionNote}>
                      Deductions: £{formatMoney(deductions)}
                    </Text>
                  </View>

                  <Text style={[styles.transactionAmount, styles.repayAmount]}>
                    +£{formatMoney(net)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>

            <TouchableOpacity onPress={() => router.push("/activity")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <Text style={styles.emptyText}>Loading transactions...</Text>
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            recentTransactions.map((transaction) => (
              <TouchableOpacity key={transaction.id} style={styles.transactionRow} onPress={() => router.push("/activity")}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionTitle}>
                    {people.find(p => p.id === transaction.personId)?.name || transaction.personName}{" "}
                    {transaction.type === "take"
                      ? "withdrew from pot"
                      : "deposited to pot"}
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
                  {formatMoney(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={isEditSettingsModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pot Settings</Text>
            
            <Text style={styles.label}>Pot Name</Text>
            <TextInput
              value={newPotName}
              onChangeText={setNewPotName}
              placeholder="e.g. Rafiq Household"
              style={styles.input}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setIsEditSettingsModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveSettings}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  topSummaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.sm,
    padding: 4,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  toggleTextActive: {
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  personName: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  personBalance: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    gap: 12,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  transactionNote: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: "800",
  },
  takeAmount: {
    color: theme.colors.danger,
  },
  repayAmount: {
    color: theme.colors.success,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: theme.colors.text,
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
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    color: theme.colors.text,
  },
});