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

type Nav = NativeStackNavigationProp<ListsStackParamList, 'JoinList'>;

// Mirror the server's character set (excludes O, 0, I, 1 to avoid visual confusion)
const VALID_CODE_CHARS = /[^A-HJ-NP-Z2-9]/g;

export function JoinListScreen() {
  const navigation = useNavigation<Nav>();
  const addList = useListStore((s) => s.addList);
  const deviceId = useSettingsStore((s) => s.deviceId);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = code.length === 6 && !loading;

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase().replace(VALID_CODE_CHARS, ''));
    setError('');
  };

  const handleJoin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const list = await api.joinList(code, deviceId);
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
        <Text style={styles.label}>6-character code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="A7BX3Z"
          placeholderTextColor={colors.textDisabled}
          value={code}
          onChangeText={handleCodeChange}
          onSubmitEditing={handleJoin}
          returnKeyType="go"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.buttonText}>Join</Text>
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
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
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
