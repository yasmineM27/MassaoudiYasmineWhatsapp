// auth.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, StatusBar, Image, ImageBackground, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';

export default function Auth({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Connexion avec Firebase Authentication
      await signInWithEmailAndPassword(auth, email, password);

      Alert.alert('Succès', 'Connexion réussie!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      let errorMessage = 'Une erreur est survenue';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Ce compte a été désactivé';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        default:
          errorMessage = error.message;
      }

      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('./assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />

        {/* Zone semi-transparente pour les champs */}
        <View style={[styles.blurContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
          <Text style={styles.title}>Welcome !!</Text>
          <TextInput
            placeholder="email@site.com"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            placeholder="** password **"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <View style={styles.box}>
            {loading ? (
              <ActivityIndicator size="large" color="green" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.buttonRow}>
                <View style={styles.buttonContainer}>
                  <Button title="Submit" color="green" onPress={handleLogin} />
                </View>
                <View style={styles.buttonContainer}>
                  <Button title="Exit" color="green" onPress={() => Alert.alert('Exit', 'Au revoir!')} />
                </View>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.footer} onPress={() => navigation.navigate('Register')}>
          create new user
        </Text>

        <StatusBar style="dark" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 120, height: 120, marginBottom: 20 },
  blurContainer: {
    width: '90%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'green',
    textAlign: 'center',
    width: '100%',
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  box: { alignItems: 'center', gap: 10 },
  title: { fontSize: 24, color: 'white', marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  buttonContainer: { width: 120 },
  footer: { color: 'white', marginTop: 20 },
});
