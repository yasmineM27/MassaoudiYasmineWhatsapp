// home/List.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function List({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      if (!user) {
        console.log('Utilisateur non connecté');
        return;
      }

      // Récupérer tous les utilisateurs depuis Firestore
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const usersList = [];
      usersSnapshot.forEach((doc) => {
        // Ne pas inclure l'utilisateur actuel dans la liste
        if (doc.id !== user.uid) {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });

      // Trier par nom
      usersList.sort((a, b) => {
        const nameA = a.name || a.pseudo || a.email || '';
        const nameB = b.name || b.pseudo || b.email || '';
        return nameA.localeCompare(nameB);
      });

      setUsers(usersList);
      console.log(`${usersList.length} utilisateurs chargés`);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleChatPress = (user) => {
    navigation.navigate('Chat', {
      userId: user.id,
      userName: user.name || user.pseudo || 'Utilisateur',
      userImage: user.imageUrl,
      userPseudo: user.pseudo
    });
  };

  const handleCallPress = (user) => {
    const phone = user.phone;
    if (phone) {
      Alert.alert(
        'Appeler',
        `Voulez-vous appeler ${user.name || user.pseudo || 'cet utilisateur'} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Appeler',
            onPress: () => {
              Linking.openURL(`tel:${phone}`);
            }
          }
        ]
      );
    } else {
      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
    }
  };

  const renderUser = ({ item }) => {
    const displayName = item.name || item.pseudo || 'Utilisateur';
    const displayInfo = item.pseudo || item.email || '';

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayName}</Text>
          {displayInfo && displayInfo !== displayName && (
            <Text style={styles.userDetails}>{displayInfo}</Text>
          )}
          {item.phone && (
            <Text style={styles.userPhone}>{item.phone}</Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => handleChatPress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}> Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCallPress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>Appel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#51966aff" />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <Text style={styles.headerSubtitle}>
          {users.length} {users.length > 1 ? 'utilisateurs' : 'utilisateur'}
        </Text>
      </View>

      {users.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>pas d'utilisateur</Text>
          <Text style={styles.emptyMessage}>Aucun utilisateur trouvé</Text>
          <Text style={styles.emptySubtext}>
            Les nouveaux utilisateurs apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6d8d79ff']}
              tintColor="#02240fff"
            />
          }
        />
      )}
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
    padding: 20,
  },
  header: {
    backgroundColor: '#25D366',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  userDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#25D366',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
  },
  callButton: {
    backgroundColor: '#128C7E',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});