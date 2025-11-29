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

  const onVoiceCallPress = () => {
    Alert.alert(
      'Appel vocal',
      `Appeler ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => console.log('Appel vocal vers', userName) }
      ]
    );
  };

  const onVideoCallPress = () => {
    Alert.alert(
      'Appel vidéo',
      `Appeler ${userName} en vidéo ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => console.log('Appel vidéo vers', userName) }
      ]
    );
  };
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
        <TouchableOpacity onPress={onVideoCallPress} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>📹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onVoiceCallPress} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>📞</Text>
        </TouchableOpacity>
      </View>
    ),
    headerStyle: {
      backgroundColor: '#075E54',
    },
    headerTintColor: 'white',
  });

  const unsubscribe = loadMessages();
  return unsubscribe;
}, [userName, userImage, userPseudo]);

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

    if (item.type === 'location') {
      return (
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          <TouchableOpacity
            style={[styles.locationBubble, isMyMessage ? styles.myBubble : styles.theirBubble]}
            onPress={() => openLocation(item.location.latitude, item.location.longitude)}
            activeOpacity={0.7}
          >
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
              Voir la position
            </Text>
            <Text style={styles.messageTime}>{formatTime(item.time)}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
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
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 3,
    maxWidth: '75%',
    flexDirection: 'row',
  },
  myMessage: {
    alignSelf: 'flex-end',
    marginLeft: '25%',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    marginRight: '25%',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  myBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#000',
  },
  theirMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 10,
    color: '#667781',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  locationBubble: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  locationIcon: {
    fontSize: 40,
    marginBottom: 5,
  },
  locationText: {
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  iconButton: {
    padding: 10,
    marginRight: 5,
  },
  iconButtonText: {
    fontSize: 24,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#25D366',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#a0a0a0',
    elevation: 0,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  typingIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  typingText: {
    fontSize: 12,
    color: '#25D366',
    fontStyle: 'italic',
  },
});


