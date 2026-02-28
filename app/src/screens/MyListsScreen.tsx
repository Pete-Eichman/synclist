import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ListCard } from '../components/ListCard';
import { ListsStackParamList } from '../navigation/index';
import { useListStore } from '../store/useListStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors } from '../theme/colors';
import { getOrCreateDeviceId, getOrCreateDisplayName } from '../utils/deviceId';

type Nav = NativeStackNavigationProp<ListsStackParamList, 'MyLists'>;

export function MyListsScreen() {
  const navigation = useNavigation<Nav>();
  const lists = useListStore((s) => s.lists);
  const removeList = useListStore((s) => s.removeList);
  const deviceId = useSettingsStore((s) => s.deviceId);
  const setDeviceId = useSettingsStore((s) => s.setDeviceId);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);

  useEffect(() => {
    (async () => {
      const [id, name] = await Promise.all([getOrCreateDeviceId(), getOrCreateDisplayName()]);
      setDeviceId(id);
      setDisplayName(name);
    })();
  }, [setDeviceId, setDisplayName]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('JoinList')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateList')}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  if (lists.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No lists yet</Text>
        <Text style={styles.emptyHint}>Tap Create to start one, or Join to enter a code.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={lists}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <ListCard
          list={item}
          isOwner={item.created_by === deviceId}
          onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
          onDelete={() => removeList(item.id)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  empty: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
