// register.js
import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, ImageBackground, StatusBar } from 'react-native';

export default function Register({ navigation }) {
  return (
    <ImageBackground 
      source={require('./assets/background.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>

        <View style={[styles.blurContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
          <TextInput placeholder="email@site.com" style={styles.input} />
          <TextInput placeholder="password" style={styles.input} secureTextEntry />
          <TextInput placeholder="confirm password" style={styles.input} secureTextEntry />
        </View>

        <View style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button title="Submit" color="green" onPress={() => navigation.navigate('Home')} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Back" color="gray" onPress={() => navigation.navigate('Auth')} />
          </View>
        </View>

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
