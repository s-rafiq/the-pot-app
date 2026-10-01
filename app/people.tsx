import { router } from "expo-router";
import { useMemo, useState, useRef } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";

import { usePot } from "../context/PotContext";
import { getPersonBalances } from "../utils/pot";
import { theme } from "../constants/theme";
import { formatMoney } from "../utils/money";

function PersonRow({
  person,
  personBalance,
  onEdit,
  onDelete,
}: {
  person: { id: string; name: string };
  personBalance: number;
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
      <View style={styles.personRow}>
        <TouchableOpacity
          style={styles.personMain}
          onPress={() => router.push(`/person/${person.id}`)}
        >
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.personBalance}>
            £{formatMoney(personBalance)}
          </Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

export default function PeopleScreen() {
  const {
    people,
    transactions,
    previousDebtEntries,
    addPerson,
    updatePerson,
    deletePerson,
  } = usePot();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState("");
  const [editingPersonName, setEditingPersonName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personBalances = useMemo(() => {
    return getPersonBalances(people, transactions);
  }, [people, transactions]);

  const handleOpenEditModal = (personId: string, currentName: string) => {
    setEditingPersonId(personId);
    setEditingPersonName(currentName);
    setIsEditModalVisible(true);
  };

  const handleAddPerson = async () => {
    const trimmed = newPersonName.trim();

    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a name.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addPerson(trimmed);
      setNewPersonName("");
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Failed to add person:", error);
      Alert.alert("Error", "Could not add person.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPerson = async () => {
    const trimmed = editingPersonName.trim();

    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a name.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePerson(editingPersonId, trimmed);
      setEditingPersonId("");
      setEditingPersonName("");
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Failed to update person:", error);
      Alert.alert("Error", "Could not update person.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePerson = (personId: string, personName: string) => {
    const hasTransactions = transactions.some(
      (transaction) => transaction.personId === personId,
    );

    const hasPreviousDebt = previousDebtEntries.some(
      (entry) => entry.personId === personId,
    );

    if (hasTransactions || hasPreviousDebt) {
      Alert.alert(
        "Cannot delete person",
        `${personName} still has transaction or previous debt history.`,
      );
      return;
    }

    Alert.alert(
      "Delete person",
      `Are you sure you want to delete ${personName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePerson(personId);
            } catch (error) {
              console.error("Failed to delete person:", error);
              Alert.alert("Error", "Could not delete person.");
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
          <Text style={styles.title}>People</Text>

          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {people.length === 0 ? (
            <Text style={styles.emptyText}>No people yet.</Text>
          ) : (
            people.map((person) => {
              const personBalance = personBalances[person.id] ?? 0;

              return (
                <PersonRow
                  key={person.id}
                  person={person}
                  personBalance={personBalance}
                  onEdit={() => handleOpenEditModal(person.id, person.name)}
                  onDelete={() => handleDeletePerson(person.id, person.name)}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={isAddModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Person</Text>

            <TextInput
              value={newPersonName}
              onChangeText={setNewPersonName}
              placeholder="Enter name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setIsAddModalVisible(false);
                  setNewPersonName("");
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSave, isSubmitting && { opacity: 0.7 }]}
                onPress={handleAddPerson}
                disabled={isSubmitting}
              >
                <Text style={styles.modalSaveText}>{isSubmitting ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Person</Text>

            <TextInput
              value={editingPersonName}
              onChangeText={setEditingPersonName}
              placeholder="Enter name"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={styles.input}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditingPersonId("");
                  setEditingPersonName("");
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSave, isSubmitting && { opacity: 0.7 }]}
                onPress={handleEditPerson}
                disabled={isSubmitting}
              >
                <Text style={styles.modalSaveText}>{isSubmitting ? "Saving..." : "Save"}</Text>
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButtonText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 18,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
  },
  personMain: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  personName: {
    fontSize: 16,
    fontWeight: "500",
      color: theme.colors.text,
  },
  personBalance: {
    fontSize: 16,
    fontWeight: "700",
      color: theme.colors.text,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
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
