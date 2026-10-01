import { router } from "expo-router";
import { useRef } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";

import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";
import { getFundingEventTotals } from "../utils/pot";
import { theme } from "../constants/theme";
import { formatMoney } from "../utils/money";

function FundingRow({
  event,
  gross,
  deductions,
  net,
  onEdit,
  onDelete,
}: {
  event: any;
  gross: number;
  deductions: number;
  net: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.editBtn]}
        onPress={() => { swipeRef.current?.close(); onEdit(); }}
      >
        <Text style={styles.swipeIcon}>•••</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.swipeBtn, styles.deleteBtn]}
        onPress={() => { swipeRef.current?.close(); onDelete(); }}
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
      <View style={styles.eventRow}>
        <View style={styles.eventLeft}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.date}>
            {formatTransactionDate(event.createdAt)}
          </Text>

          {event.note ? (
            <Text style={styles.note}>{event.note}</Text>
          ) : null}

          <Text style={styles.detailText}>
            Gross: £{formatMoney(gross)}
          </Text>
          <Text style={styles.detailText}>
            Deductions: £{formatMoney(deductions)}
          </Text>
        </View>

        <View style={styles.rightActions}>
          <Text style={styles.netAmount}>+£{formatMoney(net)}</Text>
        </View>
      </View>
    </Swipeable>
  );
}

export default function FundingScreen() {
  const { fundingEvents, fundingEventDeductions, deleteFundingEvent } =
    usePot();

  const handleDeleteFundingEvent = (eventId: string, title: string) => {
    Alert.alert(
      "Delete funding event",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFundingEvent(eventId);
            } catch (error) {
              console.error("Failed to delete funding event:", error);
              Alert.alert("Error", "Could not delete funding event.");
            }
          },
        },
      ],
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Funding Events</Text>

          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => router.push("/funding-event")}
          >
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {fundingEvents.length === 0 ? (
            <Text style={styles.emptyText}>No funding events yet.</Text>
          ) : (
            fundingEvents.map((event) => {
              const { gross, deductions, net } = getFundingEventTotals(
                event,
                fundingEventDeductions,
              );

              return (
                <FundingRow
                  key={event.id}
                  event={event}
                  gross={gross}
                  deductions={deductions}
                  net={net}
                  onEdit={() => router.push(`/edit-funding/${event.id}`)}
                  onDelete={() => handleDeleteFundingEvent(event.id, event.title)}
                />
              );
            })
          )}
        </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
      color: theme.colors.text,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButtonText: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 18,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: theme.colors.card,
  },
  eventLeft: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
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
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  netAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.success,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  rightActions: {
    alignItems: "flex-end",
  },
  swipeActions: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  swipeBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
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