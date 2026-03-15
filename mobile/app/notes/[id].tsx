import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { format } from 'date-fns';
import { getNote, analyzeNote, ClassNote, NoteAnalysis } from '../../lib/api';

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [note, setNote] = useState<ClassNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadNote() {
    try {
      const data = await getNote(id);
      setNote(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNote().then((data) => {
      if (data && !data.analysis) {
        startPolling();
      }
    });
    return () => stopPolling();
  }, [id]);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await getNote(id);
        setNote(data);
        if (data.analysis) {
          stopPolling();
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleAnalyze() {
    if (!note) return;
    setAnalyzing(true);
    try {
      const result = await analyzeNote(note.id);
      setNote(result.note);
      stopPolling();
    } catch (e) {
      Alert.alert('Error', 'Failed to analyze note. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  let analysis: NoteAnalysis | null = null;
  if (note?.analysis) {
    try {
      analysis = JSON.parse(note.analysis) as NoteAnalysis;
    } catch {
      analysis = null;
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Note not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.metaRow}>
        <Text style={styles.dateText}>{format(new Date(note.sessionDate), 'MMMM d, yyyy')}</Text>
        {!note.analysis && (
          <View style={styles.pendingBadge}>
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 4 }} />
            <Text style={styles.pendingText}>Analyzing...</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Session Notes</Text>
        <Text style={styles.noteContent}>{note.content}</Text>
      </View>

      {!note.analysis ? (
        <View style={styles.analyzingCard}>
          <Text style={styles.analyzingTitle}>Analysis Pending</Text>
          <Text style={styles.analyzingSubText}>
            AI analysis is being generated. This page will update automatically.
          </Text>
        </View>
      ) : (
        <>
          {analysis && (
            <View style={styles.analysisContainer}>
              <Text style={styles.sectionHeading}>AI Analysis</Text>

              {analysis.techniques?.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Techniques</Text>
                  {analysis.techniques.map((t, i) => (
                    <Text key={i} style={styles.bullet}>• {t}</Text>
                  ))}
                </View>
              )}

              {analysis.drills?.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Recommended Drills</Text>
                  {analysis.drills.map((d, i) => (
                    <Text key={i} style={styles.bullet}>• {d}</Text>
                  ))}
                </View>
              )}

              {analysis.corrections?.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Corrections</Text>
                  {analysis.corrections.map((c, i) => (
                    <Text key={i} style={styles.bullet}>• {c}</Text>
                  ))}
                </View>
              )}

              {analysis.keyInsights?.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Key Insights</Text>
                  {analysis.keyInsights.map((k, i) => (
                    <Text key={i} style={styles.bullet}>• {k}</Text>
                  ))}
                </View>
              )}

              {analysis.areasToImprove?.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Areas to Improve</Text>
                  {analysis.areasToImprove.map((a, i) => (
                    <Text key={i} style={styles.bullet}>• {a}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.reanalyzeButton, analyzing && styles.buttonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.reanalyzeButtonText}>Re-analyze</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#9ca3af', fontSize: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateText: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1d3b6e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pendingText: { color: '#93c5fd', fontSize: 12, fontWeight: '500' },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    marginBottom: 16,
  },
  cardLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  noteContent: { fontSize: 15, color: '#e5e7eb', lineHeight: 24 },
  analyzingCard: {
    backgroundColor: '#0f1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 20,
    alignItems: 'center',
  },
  analyzingTitle: { fontSize: 16, fontWeight: '600', color: '#93c5fd', marginBottom: 8 },
  analyzingSubText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  analysisContainer: { marginBottom: 16 },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  analysisSection: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    marginBottom: 10,
  },
  analysisSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bullet: { fontSize: 14, color: '#d1d5db', lineHeight: 22, paddingLeft: 4 },
  reanalyzeButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  reanalyzeButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
});
