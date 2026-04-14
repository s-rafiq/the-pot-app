import { router } from "expo-router";
import {
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

export default function FundingScreen() {
  const { fundingEvents, fundingEventDeductions } = usePot();

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
                      Gross: £{gross.toFixed(2)}
                    </Text>
                    <Text style={styles.detailText}>
                      Deductions: £{deductions.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.netAmount}>+£{net.toFixed(2)}</Text>
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
    backgroundColor: "#f6f7fb",
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
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  plusButtonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "#eef1f5",
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
  },
  date: {
    fontSize: 13,
    color: "#666",
  },
  note: {
    fontSize: 14,
    color: "#444",
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },
  netAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#067647",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
  },
});