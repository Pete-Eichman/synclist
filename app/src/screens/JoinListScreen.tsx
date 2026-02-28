import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function JoinListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Join List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
