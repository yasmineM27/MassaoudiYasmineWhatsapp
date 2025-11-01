// home/Group.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Group() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}> Group</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24 },
});
