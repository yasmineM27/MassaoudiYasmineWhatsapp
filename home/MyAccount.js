// home/MyAccount.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyAccount() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}> My Account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24 },
});
