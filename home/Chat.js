// home/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { auth, realtimeDb } from '../firebaseConfig';
import {
  ref,
  push,
  onValue,
  set,
  off
} from 'firebase/database';

export default function Chat({ route, navigation }) {
  const { userId, userName, userImage, userPseudo } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const currentUser = auth.currentUser;

  // Créer un ID de conversation unique (toujours dans le même ordre)
  const conversationId = [currentUser.uid, userId].sort().join('_');

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          {userImage ? (
            <Image source={{ uri: userImage }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{userName}</Text>
            {userPseudo && <Text style={styles.headerPseudo}>@{userPseudo}</Text>}
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleVideoCall} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>vd</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVoiceCall} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>appel</Text>
          </TouchableOpacity>
        </View>
      ),
    });

    loadMessages();
  }, []);

  const loadMessages = () => {
    // Référence vers les messages dans Realtime Database
    const messagesRef = ref(realtimeDb, `chats/${conversationId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const loadedMessages = [];
      const data = snapshot.val();

      if (data) {
        // Convertir l'objet en tableau
        Object.keys(data).forEach((key) => {
          loadedMessages.push({
            id: key,
            ...data[key]
          });
        });

        // Trier par time (timestamp)
        loadedMessages.sort((a, b) => a.time - b.time);
      }

      setMessages(loadedMessages);
      setLoading(false);

      // Scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => off(messagesRef);
  };

  const sendMessage = async (type = 'text', content = messageText, mediaUrl = null, location = null) => {
    if (type === 'text' && !content.trim()) return;

    setSending(true);
    try {
      // Référence vers les messages dans Realtime Database
      const messagesRef = ref(realtimeDb, `chats/${conversationId}/messages`);

      // Créer un nouveau message avec push (génère une clé unique)
      const newMessageRef = push(messagesRef);

      const messageData = {
        time: Date.now(), // Timestamp en millisecondes
        sender: currentUser.uid,
        receiver: userId,
        msg: content || '',
        type: type, // 'text' ou 'location'
        location: location || null
      };

      await set(newMessageRef, messageData);

      setMessageText('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    sendMessage('text', messageText);
    // Arrêter l'indicateur de saisie après l'envoi
    setTypingStatus(false);
  };

  // Gérer l'indicateur de saisie (typing)
  const setTypingStatus = (isTyping) => {
    const typingRef = ref(realtimeDb, `chats/${conversationId}/${currentUser.uid}_typing`);
    set(typingRef, isTyping);
  };

  // Écouter l'indicateur de saisie de l'autre utilisateur
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  useEffect(() => {
    const typingRef = ref(realtimeDb, `chats/${conversationId}/${userId}_typing`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      setOtherUserTyping(snapshot.val() || false);
    });

    return () => off(typingRef);
  }, [conversationId, userId]);

  // Gérer le changement de texte avec typing indicator
  const handleTextChange = (text) => {
    setMessageText(text);

    // Activer l'indicateur de saisie si l'utilisateur tape
    if (text.length > 0) {
      setTypingStatus(true);
    } else {
      setTypingStatus(false);
    }
  };

  const handleLocationShare = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Accès à la localisation requis');
        return;
      }

      setSending(true);
      const location = await Location.getCurrentPositionAsync({});

      await sendMessage('location', 'Position partagée', null, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir la localisation');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceCall = () => {
    Alert.alert(
      'Appel vocal',
      `Appeler ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => console.log('Appel vocal initié') }
      ]
    );
  };

  const handleVideoCall = () => {
    Alert.alert(
      'Appel vidéo',
      `Appel vidéo avec ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => console.log('Appel vidéo initié') }
      ]
    );
  };

  const openLocation = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === currentUser.uid;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        {item.type === 'location' ? (
          <TouchableOpacity
            style={[styles.locationBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}
            onPress={() => openLocation(item.location.latitude, item.location.longitude)}
          >
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              Position partagée
            </Text>
            <Text style={styles.messageTime}>{formatTime(item.time)}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myBubble : styles.theirBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.msg}
            </Text>
            <Text style={styles.messageTime}>{formatTime(item.time)}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Indicateur de saisie */}
      {otherUserTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{userName} est en train d'écrire...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handleLocationShare} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>📍</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={handleTextChange}
          placeholder="Message..."
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECE5DD',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },
  headerAvatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  headerPseudo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 10,
  },
  headerButton: {
    marginLeft: 15,
  },
  headerButtonText: {
    fontSize: 24,
  },
  messagesList: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  myBubble: {
    backgroundColor: '#DCF8C6',
  },
  theirBubble: {
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  myMessageText: {
    color: '#000',
  },
  theirMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    alignSelf: 'flex-end',
  },
  locationBubble: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#128C7E',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#25D366',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  typingIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  typingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});


