// register.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function Register({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      // Créer l'utilisateur avec Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Créer un document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: '',
        pseudo: '',
        phone: '',
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Succès', 'Compte créé avec succès!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      let errorMessage = 'Une erreur est survenue';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Cet email est déjà utilisé';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/weak-password':
          errorMessage = 'Le mot de passe est trop faible';
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
        <Text style={styles.title}>Register</Text>

        <View style={[styles.blurContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
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
            placeholder="password"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
          <TextInput
            placeholder="confirm password"
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="green" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.buttonRow}>
            <View style={styles.buttonContainer}>
              <Button title="Submit" color="green" onPress={handleRegister} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Back" color="gray" onPress={() => navigation.navigate('Auth')} />
            </View>
          </View>
        )}

        <StatusBar style="dark" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, color: 'white', marginBottom: 20 },
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
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  buttonContainer: { width: 120 },
});
