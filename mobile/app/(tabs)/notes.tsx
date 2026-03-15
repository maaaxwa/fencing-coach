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
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { getNotes, createNote, deleteNote, ClassNote } from '../../lib/api';

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadNotes() {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotes();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadNotes();
  }

  async function handleSubmit() {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter note content.');
      return;
    }
    setSubmitting(true);
    try {
      const note = await createNote({
        content: content.trim(),
        sessionDate: format(sessionDate, 'yyyy-MM-dd'),
      });
      setNotes((prev) => [note, ...prev]);
      setContent('');
      setSessionDate(new Date());
      setShowForm(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to create note.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(id);
            setNotes((prev) => prev.filter((n) => n.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete note.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Class Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? 'Cancel' : '+ Add Note'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>Session Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateInputText}>{format(sessionDate, 'MMM d, yyyy')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={sessionDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setSessionDate(date);
              }}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="What did you work on in this session?"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Save Note</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {notes.length === 0 ? (
        <Text style={styles.emptyText}>No notes yet. Add your first class note.</Text>
      ) : (
        notes.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.card}
            onPress={() => router.push(`/notes/${note.id}`)}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardDate}>
                {format(new Date(note.sessionDate), 'MMM d, yyyy')}
              </Text>
              <View style={styles.cardActions}>
                <View style={[styles.badge, note.analysis ? styles.badgeGreen : styles.badgeGray]}>
                  <Text style={styles.badgeText}>{note.analysis ? 'Analyzed' : 'Pending'}</Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardContent} numberOfLines={3}>
              {note.content}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff' },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  form: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    marginBottom: 16,
  },
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 6, marginTop: 10 },
  dateInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  dateInputText: { color: '#fff', fontSize: 15 },
  doneButton: { alignSelf: 'flex-end', marginTop: 8 },
  doneButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    color: '#fff',
    padding: 12,
    fontSize: 15,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDate: { fontSize: 13, color: '#9ca3af' },
  cardContent: { fontSize: 14, color: '#e5e7eb', lineHeight: 20 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#052e16' },
  badgeGray: { backgroundColor: '#1f2937' },
  badgeText: { fontSize: 11, color: '#d1d5db', fontWeight: '500' },
  deleteButton: { padding: 4 },
  deleteText: { color: '#6b7280', fontSize: 14 },
});
