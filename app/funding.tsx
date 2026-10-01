import { router } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePot } from "../context/PotContext";
import { formatTransactionDate } from "../utils/date";
import { getFundingEventTotals } from "../utils/pot";
import { theme } from "../constants/theme";
import { formatMoney } from "../utils/money";

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
                <View key={event.id} style={styles.eventRow}>
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

                    <TouchableOpacity
                      onPress={() => router.push(`/edit-funding/${event.id}`)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteFundingEvent(event.id, event.title)
                      }
                      style={styles.actionButton}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    gap: 8,
  },

  actionButton: {
    paddingVertical: 4,
  },

  editText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },

  deleteText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
});