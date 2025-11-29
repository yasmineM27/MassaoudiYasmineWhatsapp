// home/GroupChat.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { auth, realtimeDb, db } from '../firebaseConfig';
import { ref, push, onValue, set, off, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';

export default function GroupChat({ route, navigation }) {
  const { groupId, groupName } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [memberCount, setMemberCount] = useState(0);
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>{memberCount} membres</Text>
        </View>
      ),
      headerStyle: { backgroundColor: '#128C7E' },
      headerTintColor: 'white',
      headerShown: true
    });
  }, [groupName, memberCount]);

  useEffect(() => {
    loadGroupData();
    loadMessages();

    return () => {
      const messagesRef = ref(realtimeDb, `groups/${groupId}/messages`);
      off(messagesRef);
    };
  }, []);

  const loadGroupData = async () => {
    try {
      const groupRef = ref(realtimeDb, `groups/${groupId}`);
      onValue(groupRef, async (snapshot) => {
        const groupData = snapshot.val();
        if (groupData && groupData.members) {
          setMemberCount(groupData.members.length);

          // Charger les données de tous les membres
          const usersDataTemp = {};
          for (const memberId of groupData.members) {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            if (userDoc.exists()) {
              usersDataTemp[memberId] = userDoc.data();
            }
          }
          setUsersData(usersDataTemp);
        }
      });
    } catch (error) {
      console.error('Erreur chargement groupe:', error);
    }
  };

  const loadMessages = () => {
    try {
      const messagesRef = ref(realtimeDb, `groups/${groupId}/messages`);

      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));

          messagesList.sort((a, b) => a.time - b.time);
          setMessages(messagesList);

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } else {
          setMessages([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      setLoading(false);
    }
  };

  const sendMessage = async (type = 'text', content = null, location = null) => {
    if (type === 'text' && !messageText.trim()) return;

    setSending(true);

    try {
      const messagesRef = ref(realtimeDb, `groups/${groupId}/messages`);
      const newMessageRef = push(messagesRef);

      const messageData = {
        time: Date.now(),
        sender: currentUser.uid,
        senderName: usersData[currentUser.uid]?.name || 'Utilisateur',
        msg: content || messageText.trim(),
        type: type,
        location: location || null
      };

      await set(newMessageRef, messageData);

      // Mettre à jour le dernier message du groupe
      const groupRef = ref(realtimeDb, `groups/${groupId}`);
      await update(groupRef, {
        lastMessage: type === 'location' ? '📍 Position' : messageData.msg,
        lastMessageTime: Date.now()
      });

      setMessageText('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d\'accéder à votre position');
        return;
      }

      setSending(true);
      const location = await Location.getCurrentPositionAsync({});

      await sendMessage('location', `Lat: ${location.coords.latitude}, Long: ${location.coords.longitude}`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Erreur partage position:', error);
      Alert.alert('Erreur', 'Impossible de partager votre position');
      setSending(false);
    }
  };

  const openLocation = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === currentUser.uid;
    const senderInfo = usersData[item.sender];

    return (
      <View style={styles.messageWrapper}>
        {!isMyMessage && (
          <Text style={styles.senderName}>
            {senderInfo?.name || item.senderName || 'Utilisateur'}
          </Text>
        )}

        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}>
          {item.type === 'location' ? (
            <TouchableOpacity
              onPress={() => openLocation(item.location.latitude, item.location.longitude)}
            >
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={[styles.messageText, styles.locationText]}>
                Voir la position
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.messageText}>{item.msg}</Text>
          )}

          <Text style={styles.messageTime}>{formatTime(item.time)}</Text>
        </View>
      </View>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={shareLocation}
          disabled={sending}
        >
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={() => sendMessage('text')}
          disabled={sending || !messageText.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  messagesContainer: {
    padding: 10,
  },
  messageWrapper: {
    marginBottom: 15,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  locationIcon: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 5,
  },
  locationText: {
    color: '#128C7E',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  locationButton: {
    padding: 10,
    marginRight: 5,
  },
  locationButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#25D366',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

