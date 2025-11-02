// auth.js
import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, StatusBar, Image, ImageBackground } from 'react-native';

export default function Auth({ navigation }) {
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
          <TextInput placeholder="email@site.com" style={styles.input} />
          <TextInput placeholder="** password **" style={styles.input} secureTextEntry />
       <View style={styles.box}>
          

          <View style={styles.buttonRow}>
            <View style={styles.buttonContainer}>
              <Button title="Submit" color="green" onPress={() => navigation.navigate('Home')} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Exit" color="green" onPress={() => alert('Exited!')} />
            </View>
          </View>
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
