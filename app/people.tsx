import { router } from "expo-router";
import { useMemo, useState } from "react";
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

import { usePot } from "../context/PotContext";
import { getPersonBalances } from "../utils/pot";

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

    try {
      await addPerson(trimmed);
      setNewPersonName("");
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Failed to add person:", error);
      Alert.alert("Error", "Could not add person.");
    }
  };

  const handleEditPerson = async () => {
    const trimmed = editingPersonName.trim();

    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a name.");
      return;
    }

    try {
      await updatePerson(editingPersonId, trimmed);
      setEditingPersonId("");
      setEditingPersonName("");
      setIsEditModalVisible(false);
    } catch (error) {
      console.error("Failed to update person:", error);
      Alert.alert("Error", "Could not update person.");
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
                <View key={person.id} style={styles.personRow}>
                  <TouchableOpacity
                    style={styles.personMain}
                    onPress={() => router.push(`/person/${person.id}`)}
                  >
                    <Text style={styles.personName}>{person.name}</Text>
                    <Text style={styles.personBalance}>
                      £{personBalance.toFixed(2)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() =>
                        handleOpenEditModal(person.id, person.name)
                      }
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeletePerson(person.id, person.name)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.deleteActionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
              placeholderTextColor="#777"
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
                style={styles.modalSave}
                onPress={handleAddPerson}
              >
                <Text style={styles.modalSaveText}>Save</Text>
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
              placeholderTextColor="#777"
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
                style={styles.modalSave}
                onPress={handleEditPerson}
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
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eef1f5",
    paddingVertical: 12,
    gap: 12,
  },
  personMain: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personName: {
    fontSize: 16,
    fontWeight: "500",
  },
  personBalance: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    color: "#111",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
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
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveText: {
    color: "#fff",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  deleteActionText: {
    color: "#b42318",
    fontWeight: "600",
  },
});
