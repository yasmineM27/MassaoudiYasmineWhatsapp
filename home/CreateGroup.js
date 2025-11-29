// home/CreateGroup.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { auth, realtimeDb, db } from '../firebaseConfig';
import { ref, push, set } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';

export default function CreateGroup({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];

      usersSnapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });

      setUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de groupe');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un membre');
      return;
    }

    setCreating(true);

    try {
      const groupsRef = ref(realtimeDb, 'groups');
      const newGroupRef = push(groupsRef);

      const groupData = {
        name: groupName.trim(),
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        members: {[currentUser.uid]: true, ...Object.fromEntries(selectedUsers.map(uid => [uid, true]))},
        lastMessage: '',
        lastMessageTime: Date.now()
      };

      await set(newGroupRef, groupData);

      Alert.alert('Succès', 'Groupe créé avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Erreur création groupe:', error);
      Alert.alert('Erreur', 'Impossible de créer le groupe');
    } finally {
      setCreating(false);
    }
  };

  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.checkbox}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>

        <View style={styles.avatarContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'Utilisateur'}</Text>
          {item.pseudo && <Text style={styles.userPseudo}>@{item.pseudo}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un groupe</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom du groupe (ex: Ingénieurs, Dev...)"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
        <Text style={styles.selectedCount}>
          {selectedUsers.length} membre(s) sélectionné(s)
        </Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={[styles.createButton, creating && styles.createButtonDisabled]}
        onPress={createGroup}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.createButtonText}>Créer le groupe</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#128C7E',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 30,
    color: 'white',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedCount: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#25D366',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#25D366',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userPseudo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  createButton: {
    backgroundColor: '#25D366',
    padding: 18,
    margin: 15,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

