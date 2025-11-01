// home/List.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function List() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}> List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24 },
});
