import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { setDisplayName as persistDisplayName } from '../utils/deviceId';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors } from '../theme/colors';

export function SettingsScreen() {
  const displayName = useSettingsStore((s) => s.displayName);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const deviceId = useSettingsStore((s) => s.deviceId);

  const [nameInput, setNameInput] = useState(displayName);
  const [saving, setSaving] = useState(false);

  const isDirty = nameInput.trim() !== displayName && nameInput.trim().length > 0;

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await persistDisplayName(trimmed);
      setDisplayName(trimmed);
    } catch {
      Alert.alert('Error', 'Could not save display name.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Display name</Text>
          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Your name"
            placeholderTextColor={colors.textDisabled}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            style={[styles.saveButton, !isDirty && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isDirty || saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Shown to other list members as "added by {nameInput.trim() || displayName}".
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <Row label="App" value="SyncList" />
          <Divider />
          <Row label="Version" value="1.0.0" />
          <Divider />
          <Row label="Device ID" value={deviceId ? `${deviceId.slice(0, 8)}…` : '—'} />
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 28,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryDim,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: colors.textDisabled,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
