// home/Group.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { auth, realtimeDb, db } from '../firebaseConfig';
import { ref, onValue, remove } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

export default function Group({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [combinedList, setCombinedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedChats, setLoadedChats] = useState(false);
  const [loadedGroups, setLoadedGroups] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribeChats = loadConversations();
    const unsubscribeGroups = loadGroups();

    return () => {
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, []);

  useEffect(() => {
    if (loadedChats && loadedGroups) {
      setLoading(false);
    }
  }, [loadedChats, loadedGroups]);

  useEffect(() => {
    const combined = [...conversations, ...groups];
    combined.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    setCombinedList(combined);
  }, [conversations, groups]);

  const loadConversations = () => {
    try {
      const chatsRef = ref(realtimeDb, 'chats');
      console.log(' Chargement conversations...');

      const unsubscribe = onValue(chatsRef, async (snapshot) => {
        try {
          const convList = [];
          const data = snapshot.val();

          if (data) {
            for (const chatId of Object.keys(data)) {
              if (chatId.includes(currentUser.uid)) {
                const chatData = data[chatId];
                const userIds = chatId.split('_');
                const otherUserId = userIds.find(id => id !== currentUser.uid);

                if (!otherUserId) continue;

                const userDoc = await getDoc(doc(db, 'users', otherUserId));
                const userData = userDoc.exists() ? userDoc.data() : {};

                let lastMessage = '';
                let lastMessageTime = 0;

                if (chatData.messages) {
                  const messages = Object.values(chatData.messages);
                  if (messages.length > 0) {
                    messages.sort((a, b) => b.time - a.time);
                    const lastMsg = messages[0];
                    lastMessage = lastMsg.type === 'location' ? '📍 Position' : lastMsg.msg;
                    lastMessageTime = lastMsg.time;
                  }
                }

                convList.push({
                  id: chatId,
                  type: 'chat',
                  otherUserId,
                  otherUserName: userData.name || userData.pseudo || 'Utilisateur',
                  otherUserImage: userData.imageUrl,
                  otherUserPseudo: userData.pseudo,
                  lastMessage,
                  lastMessageTime
                });
              }
            }
          }

          console.log(` ${convList.length} conversations chargées`);
          setConversations(convList);
          setLoadedChats(true);
        } catch (error) {
          console.error(' Erreur conversations:', error);
          setConversations([]);
          setLoadedChats(true);
        }
      }, (error) => {
        console.error(' Erreur listener conversations:', error);
        setConversations([]);
        setLoadedChats(true);
      });

      return unsubscribe;
    } catch (error) {
      console.error(' Erreur chargement conversations:', error);
      setConversations([]);
      setLoadedChats(true);
      return null;
    }
  };

  const loadGroups = () => {
    try {
      const groupsRef = ref(realtimeDb, 'groups');
      console.log(' Chargement groupes...');

      const unsubscribe = onValue(groupsRef, async (snapshot) => {
        try {
          const groupsList = [];
          const data = snapshot.val();

          if (data) {
            for (const groupId of Object.keys(data)) {
              const groupData = data[groupId];

              if (groupData.members && groupData.members.includes(currentUser.uid)) {
                groupsList.push({
                  id: groupId,
                  type: 'group',
                  groupName: groupData.name,
                  memberCount: groupData.members.length,
                  lastMessage: groupData.lastMessage || '',
                  lastMessageTime: groupData.lastMessageTime || 0
                });
              }
            }
          }

          console.log(` ${groupsList.length} groupes chargés`);
          setGroups(groupsList);
          setLoadedGroups(true);
        } catch (error) {
          console.error(' Erreur groupes:', error);
          setGroups([]);
          setLoadedGroups(true);
        }
      }, (error) => {
        console.error(' Erreur listener groupes:', error);
        setGroups([]);
        setLoadedGroups(true);
      });

      return unsubscribe;
    } catch (error) {
      console.error(' Erreur chargement groupes:', error);
      setGroups([]);
      setLoadedGroups(true);
      return null;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleConversationPress = (item) => {
    if (item.type === 'group') {
      navigation.navigate('GroupChat', {
        groupId: item.id,
        groupName: item.groupName
      });
    } else {
      navigation.navigate('Chat', {
        userId: item.otherUserId,
        userName: item.otherUserName,
        userImage: item.otherUserImage,
        userPseudo: item.otherUserPseudo
      });
    }
  };

  const handleDeleteConversation = (item) => {
    const title = item.type === 'group' ? 'Supprimer le groupe' : 'Supprimer la conversation';
    const message = item.type === 'group'
      ? `Voulez-vous supprimer le groupe "${item.groupName}" ?`
      : `Voulez-vous supprimer la conversation avec ${item.otherUserName} ?`;

    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.type === 'group') {
              const groupRef = ref(realtimeDb, `groups/${item.id}`);
              await remove(groupRef);
            } else {
              const chatRef = ref(realtimeDb, `chats/${item.id}`);
              await remove(chatRef);
            }
            Alert.alert('Succès', 'Supprimé avec succès');
          } catch (error) {
            console.error('Erreur suppression:', error);
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        }
      }
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
    loadGroups();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderConversation = ({ item }) => {
    const isGroup = item.type === 'group';

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        onLongPress={() => handleDeleteConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {isGroup ? (
            <View style={styles.groupAvatarPlaceholder}>
              <Text style={styles.groupAvatarText}>👥</Text>
            </View>
          ) : item.otherUserImage ? (
            <Image source={{ uri: item.otherUserImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.otherUserName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>
                {isGroup ? item.groupName : item.otherUserName}
              </Text>
              {isGroup ? (
                <Text style={styles.userPseudo}>{item.memberCount} membres</Text>
              ) : item.otherUserPseudo ? (
                <Text style={styles.userPseudo}>@{item.otherUserPseudo}</Text>
              ) : null}
            </View>
            <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'Aucun message'}
          </Text>
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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Conversations</Text>
          <Text style={styles.headerCount}>{combinedList.length}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Appuyez longuement pour supprimer
        </Text>
      </View>

      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Text style={styles.createGroupIcon}>➕</Text>
        <Text style={styles.createGroupText}>Créer un groupe</Text>
      </TouchableOpacity>

      {combinedList.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Aucune conversation</Text>
          <Text style={styles.emptySubtext}>
            Commencez une conversation depuis l'onglet List ou créez un groupe
          </Text>
        </View>
      ) : (
        <FlatList
          data={combinedList}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#25D366']}
              tintColor="#25D366"
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
    backgroundColor: '#128C7E',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  headerSubtitle: {
    fontSize: 12,
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
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  groupAvatarPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    fontSize: 28,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  userNameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
  },
  userPseudo: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
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
  createGroupButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createGroupIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  createGroupText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
