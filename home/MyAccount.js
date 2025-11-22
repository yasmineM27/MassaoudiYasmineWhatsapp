import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function MyAccount({ navigation }) {
  const [image, setImage] = useState(require('../assets/logo.png'));
  const [name, setName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les données de l'utilisateur depuis Firestore
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          setEmail(user.email || '');

          // Récupérer les données supplémentaires depuis Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setName(userData.name || '');
            setPseudo(userData.pseudo || '');
            setPhone(userData.phone || '');
            if (userData.imageUrl) {
              setImage({ uri: userData.imageUrl });
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        Alert.alert('Erreur', 'Impossible de charger les données utilisateur');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission refusée!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7, // Réduire la qualité pour optimiser le stockage
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImage({ uri: imageUri });

      // Upload l'image vers Firebase Storage
      await uploadImageToFirebase(imageUri);
    }
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      setSaving(true);

      console.log('Début upload image:', uri);

      // Convertir l'image en blob
      const response = await fetch(uri);
      const blob = await response.blob();

      console.log('Blob créé, taille:', blob.size);

      // Créer une référence dans Firebase Storage
      const imageRef = ref(storage, `profileImages/${user.uid}`);

      console.log('Référence Storage créée');

      // Upload l'image
      await uploadBytes(imageRef, blob);

      console.log('Image uploadée avec succès');

      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(imageRef);

      console.log('URL obtenue:', downloadURL);

      // Sauvegarder l'URL dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        imageUrl: downloadURL,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      console.log('URL sauvegardée dans Firestore');

      Alert.alert('Succès', 'Photo de profil mise à jour!');
    } catch (error) {
      console.error('Erreur détaillée lors de l\'upload:', error);
      console.error('Code erreur:', error.code);
      console.error('Message erreur:', error.message);

      let errorMessage = 'Impossible de télécharger l\'image';

      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Firebase Storage n\'est pas activé ou les règles de sécurité bloquent l\'upload. Veuillez activer Storage dans Firebase Console.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload annulé';
      } else if (error.code === 'storage/unknown') {
        errorMessage = 'Erreur inconnue. Vérifiez que Firebase Storage est activé.';
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`;
      }

      Alert.alert('Erreur Upload', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Sauvegarder les données dans Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name,
          pseudo,
          email: user.email,
          phone,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        Alert.alert('Succès', 'Informations sauvegardées avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les données');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('Erreur de déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr ',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              setSaving(true);

              // 1. Supprimer l'image de profil de Storage (si elle existe)
              try {
                const imageRef = ref(storage, `profileImages/${user.uid}`);
                await deleteObject(imageRef);
              } catch (error) {
                // L'image n'existe peut-être pas, on continue
                console.log('Pas d\'image à supprimer ou erreur:', error);
              }

              // 2. Supprimer le document utilisateur de Firestore
              await deleteDoc(doc(db, 'users', user.uid));

              // 3. Supprimer le compte Firebase Authentication
              await deleteUser(user);

              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé avec succès.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                      });
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Erreur lors de la suppression du compte:', error);

              let errorMessage = 'Impossible de supprimer le compte';

              // Si l'erreur est liée à la réauthentification
              if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer votre compte.';
              }

              Alert.alert('Erreur', errorMessage);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="green" />
        <Text style={{ marginTop: 10, color: '#666' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}> My Account</Text>

      <View style={styles.settingsContainer}>
        {/* Image cliquable */}
        <TouchableOpacity onPress={pickImage}>
          <Image source={image} style={styles.profileImage} />
        </TouchableOpacity>
        <Text style={styles.changeText}>Appuyez sur l'image pour changer</Text>

        {/* Inputs stylés */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nom:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            editable={!saving}
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Pseudo:</Text>
          <TextInput
            style={styles.input}
            value={pseudo}
            onChangeText={setPseudo}
            editable={!saving}
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <TextInput
            style={styles.input}
            value={email}
            keyboardType="email-address"
            editable={false}
            placeholder="Email de connexion"
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Numéro:</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!saving}
          />
        </View>

        {/* Bouton Sauvegarder */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}> Sauvegarder</Text>
          )}
        </TouchableOpacity>

        {/* Bouton Déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>

        {/* Bouton Supprimer le compte */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={saving}
        >
          <Text style={styles.deleteButtonText}> Supprimer le compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  changeText: { fontSize: 12, color: 'gray', marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  label: { fontWeight: 'bold', fontSize: 16, width: 80 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'green',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  saveButton: {
    marginTop: 25,
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 15,
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    elevation: 5,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: '#8B0000',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
