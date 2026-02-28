import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  members: string[];
  ownDeviceId: string;
}

export function MemberAvatars({ members, ownDeviceId }: Props) {
  if (members.length === 0) return null;

  return (
    <View style={styles.container}>
      {members.map((deviceId) => {
        const isOwn = deviceId === ownDeviceId;
        return (
          <View key={deviceId} style={[styles.avatar, isOwn && styles.avatarOwn]}>
            <Text style={styles.label}>{isOwn ? 'You' : deviceId.charAt(0).toUpperCase()}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingLeft: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOwn: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
});
