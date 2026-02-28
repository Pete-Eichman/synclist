import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ListsStackParamList } from '../navigation/index';
import { api } from '../services/api';
import { useListStore } from '../store/useListStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<ListsStackParamList, 'CreateList'>;

export function CreateListScreen() {
  const navigation = useNavigation<Nav>();
  const addList = useListStore((s) => s.addList);
  const deviceId = useSettingsStore((s) => s.deviceId);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name.trim().length > 0 && !loading;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const list = await api.createList(name.trim(), deviceId);
      addList(list);
      navigation.replace('ListDetail', { listId: list.id, listName: list.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.label}>List name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Grocery run"
          placeholderTextColor={colors.textDisabled}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
          autoFocus
          maxLength={80}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: 20,
    gap: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.primaryDim,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
