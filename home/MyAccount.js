import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function MyAccount() {
  const [image, setImage] = useState(require('../assets/logo.png'));
  const [name, setName] = useState('Yasmine Massoudi');
  const [pseudo, setPseudo] = useState('Yasmi123');
  const [email, setEmail] = useState('yasmine@example.com');
  const [phone, setPhone] = useState('+216 12 345 678');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission refusée!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.cancelled) {
      setImage({ uri: result.uri });
    }
  };

  const handleSave = () => {
    Alert.alert('Infos sauvegardées!', `Nom: ${name}\nPseudo: ${pseudo}\nEmail: ${email}\nNuméro: ${phone}`);
  };

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
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Pseudo:</Text>
          <TextInput style={styles.input} value={pseudo} onChangeText={setPseudo} />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Numéro:</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        {/* Bouton Sauvegarder */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}> Sauvegarder</Text>
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
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
