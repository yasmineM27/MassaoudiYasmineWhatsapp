// home/Home.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function Home({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}> Home</Text>

      <Button title="My Account" onPress={() => navigation.navigate('MyAccount')} />
      <Button title="Group" onPress={() => navigation.navigate('Group')} />
      <Button title="List" onPress={() => navigation.navigate('List')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
});
