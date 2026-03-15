import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getProfile, saveProfile, Profile } from '../../lib/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [experienceMonths, setExperienceMonths] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getProfile();
        setProfile(data);
        setName(data.name ?? '');
        setExperienceYears(String(data.experienceYears ?? 0));
        setExperienceMonths(String(data.experienceMonths ?? 0));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    const years = parseInt(experienceYears, 10);
    const months = parseInt(experienceMonths, 10);
    if (isNaN(years) || years < 0) {
      Alert.alert('Error', 'Please enter a valid number of years.');
      return;
    }
    if (isNaN(months) || months < 0 || months > 11) {
      Alert.alert('Error', 'Months must be between 0 and 11.');
      return;
    }
    setSaving(true);
    try {
      const updated = await saveProfile({
        name: name.trim(),
        weapon: 'Épée',
        experienceYears: years,
        experienceMonths: months,
      });
      setProfile(updated);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#6b7280"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Weapon</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>Épée</Text>
          </View>

          <Text style={styles.label}>Experience</Text>
          <View style={styles.experienceRow}>
            <View style={styles.experienceItem}>
              <TextInput
                style={styles.numberInput}
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6b7280"
                maxLength={2}
              />
              <Text style={styles.experienceUnit}>years</Text>
            </View>
            <View style={styles.experienceItem}>
              <TextInput
                style={styles.numberInput}
                value={experienceMonths}
                onChangeText={setExperienceMonths}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6b7280"
                maxLength={2}
              />
              <Text style={styles.experienceUnit}>months</Text>
            </View>
          </View>
        </View>

        {profile && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Current Profile</Text>
            <Text style={styles.infoText}>Name: {profile.name || '(not set)'}</Text>
            <Text style={styles.infoText}>Weapon: {profile.weapon || 'Épée'}</Text>
            <Text style={styles.infoText}>
              Experience: {profile.experienceYears}y {profile.experienceMonths}m
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 20 },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    marginBottom: 16,
  },
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    padding: 12,
    fontSize: 15,
  },
  readOnlyField: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  readOnlyText: { color: '#6b7280', fontSize: 15 },
  experienceRow: { flexDirection: 'row', gap: 12 },
  experienceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  numberInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    padding: 12,
    fontSize: 15,
    textAlign: 'center',
  },
  experienceUnit: { color: '#9ca3af', fontSize: 14 },
  infoCard: {
    backgroundColor: '#0f1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 14,
    marginBottom: 20,
  },
  infoTitle: { color: '#2563eb', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  infoText: { color: '#93c5fd', fontSize: 14, marginBottom: 4 },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
