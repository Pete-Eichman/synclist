import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ListItem } from '../services/api';
import { colors } from '../theme/colors';

interface Props {
  item: ListItem;
  isOwn: boolean;
  dimmed: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

export function ItemRow({ item, isOwn, dimmed, onToggle, onDelete }: Props) {
  const handleLongPress = () => {
    Alert.alert('Delete item', `Remove "${item.text}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onToggle}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.text, dimmed && styles.textDimmed]} numberOfLines={3}>
          {item.text}
        </Text>
        {isOwn && <Text style={styles.addedBy}>added by you</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    borderColor: colors.checked,
    backgroundColor: colors.checked,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  textDimmed: {
    color: colors.checked,
    textDecorationLine: 'line-through',
  },
  addedBy: {
    color: colors.textDisabled,
    fontSize: 11,
  },
});
