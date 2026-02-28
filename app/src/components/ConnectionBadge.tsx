import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConnectionStatus } from '../services/socket';
import { colors } from '../theme/colors';

interface Props {
  status: ConnectionStatus;
}

export function ConnectionBadge({ status }: Props) {
  const live = status === 'connected';
  return (
    <View style={styles.container}>
      <View style={[styles.dot, live ? styles.dotLive : styles.dotOffline]} />
      <Text style={[styles.label, live ? styles.labelLive : styles.labelOffline]}>
        {live ? 'Live' : 'Reconnecting…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotLive: {
    backgroundColor: colors.online,
  },
  dotOffline: {
    backgroundColor: colors.offline,
  },
  label: {
    fontSize: 13,
  },
  labelLive: {
    color: colors.online,
  },
  labelOffline: {
    color: colors.textSecondary,
  },
});
