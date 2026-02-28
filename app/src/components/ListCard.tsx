import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { List, ListItem } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  list: List & { items: ListItem[] };
  isOwner: boolean;
  onPress: () => void;
  onDelete: () => void;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function ListCard({ list, isOwner, onPress, onDelete }: Props) {
  const total = list.items.length;
  const checked = list.items.filter((i) => i.checked).length;

  const lastActivity =
    list.items.length > 0
      ? list.items.reduce((latest, item) => (item.updated_at > latest ? item.updated_at : latest), list.items[0].updated_at)
      : list.created_at;

  const handleLongPress = () => {
    Alert.alert('Delete List', `Delete "${list.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={isOwner ? handleLongPress : undefined}
      activeOpacity={0.7}
    >
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={styles.meta}>
          {checked}/{total} done · {formatRelativeTime(lastActivity)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chevron: {
    color: colors.textDisabled,
    fontSize: 22,
    marginLeft: 8,
  },
});
