import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AddItemInput } from '../components/AddItemInput';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { ItemRow } from '../components/ItemRow';
import { ListsStackParamList } from '../navigation/index';
import { api } from '../services/api';
import { ConnectionStatus, socketManager } from '../services/socket';
import { useListStore } from '../store/useListStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<ListsStackParamList, 'ListDetail'>;
type Route = RouteProp<ListsStackParamList, 'ListDetail'>;

export function ListDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { listId } = useRoute<Route>().params;
  const deviceId = useSettingsStore((s) => s.deviceId);

  const list = useListStore((s) => s.lists.find((l) => l.id === listId));
  const setListItems = useListStore((s) => s.setListItems);
  const applyItemAdded = useListStore((s) => s.applyItemAdded);
  const applyItemChecked = useListStore((s) => s.applyItemChecked);
  const applyItemDeleted = useListStore((s) => s.applyItemDeleted);
  const applyItemReordered = useListStore((s) => s.applyItemReordered);

  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting');

  const items = list?.items ?? [];
  const unchecked = items.filter((i) => !i.checked).sort((a, b) => a.position - b.position);
  const checked = items.filter((i) => i.checked).sort((a, b) => a.position - b.position);
  const listData = [
    ...unchecked.map((item) => ({ item, dimmed: false })),
    ...checked.map((item) => ({ item, dimmed: true })),
  ];

  // Load items and open WebSocket on mount; disconnect on unmount
  useEffect(() => {
    api.getList(listId).then((data) => setListItems(listId, data.items));
    socketManager.connect(listId, deviceId);
    return () => socketManager.disconnect();
  }, [listId, deviceId, setListItems]);

  // Route incoming WS events to the store
  useEffect(() => {
    return socketManager.onEvent((event) => {
      switch (event.type) {
        case 'item_added':
          applyItemAdded(listId, event.payload);
          break;
        case 'item_checked':
        case 'item_unchecked':
          applyItemChecked(listId, event.payload);
          break;
        case 'item_deleted':
          applyItemDeleted(listId, event.payload.id);
          break;
        case 'item_reordered':
          applyItemReordered(listId, event.payload.items);
          break;
      }
    });
  }, [listId, applyItemAdded, applyItemChecked, applyItemDeleted, applyItemReordered]);

  // Track connection status for the badge
  useEffect(() => {
    return socketManager.onStatusChange(setConnStatus);
  }, []);

  // Header title: list name + tappable join code (share sheet)
  useLayoutEffect(() => {
    if (!list) return;
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => Share.share({ message: list.join_code })}
          style={styles.headerTitle}
        >
          <Text style={styles.headerName} numberOfLines={1}>
            {list.name}
          </Text>
          <Text style={styles.headerCode}>Code: {list.join_code}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, list]);

  // Header badge: updates independently of the title
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <ConnectionBadge status={connStatus} />,
    });
  }, [navigation, connStatus]);

  const handleAddItem = (text: string) => {
    // item_added: server echoes back to sender → applied via onEvent handler
    socketManager.send({
      type: 'item_added',
      listId,
      deviceId,
      payload: { text, position: items.length },
    });
  };

  const handleToggle = (itemId: string, currentlyChecked: boolean) => {
    // item_checked/unchecked: server does NOT echo to sender → apply locally now
    const existing = items.find((i) => i.id === itemId);
    if (!existing) return;
    applyItemChecked(listId, { ...existing, checked: !currentlyChecked });
    socketManager.send({
      type: currentlyChecked ? 'item_unchecked' : 'item_checked',
      listId,
      deviceId,
      payload: { id: itemId },
    });
  };

  const handleDelete = (itemId: string) => {
    // item_deleted: server does NOT echo to sender → apply locally now
    applyItemDeleted(listId, itemId);
    socketManager.send({ type: 'item_deleted', listId, deviceId, payload: { id: itemId } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {connStatus !== 'connected' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Offline — changes will sync when reconnected
          </Text>
        </View>
      )}
      <FlatList
        data={listData}
        keyExtractor={({ item }) => item.id}
        renderItem={({ item: { item, dimmed } }) => (
          <ItemRow
            item={item}
            isOwn={item.created_by === deviceId}
            dimmed={dimmed}
            onToggle={() => handleToggle(item.id, item.checked)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items yet. Add something below.</Text>
          </View>
        }
      />
      <AddItemInput onSubmit={handleAddItem} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    alignItems: 'center',
  },
  headerName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    maxWidth: 180,
  },
  headerCode: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  offlineBanner: {
    backgroundColor: colors.primaryDim,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    color: colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
});
