import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { format } from 'date-fns';
import { getReports, generateReport, CoachingReport, CoachingReportContent } from '../../lib/api';

function ReportCard({ report }: { report: CoachingReport }) {
  const [expanded, setExpanded] = useState(false);

  let content: CoachingReportContent | null = null;
  try {
    content = JSON.parse(report.content) as CoachingReportContent;
  } catch {
    content = null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{format(new Date(report.createdAt), 'MMM d, yyyy')}</Text>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {content && (
        <Text style={styles.summary} numberOfLines={expanded ? undefined : 2}>
          {content.executiveSummary}
        </Text>
      )}
      {expanded && content && (
        <View style={styles.expandedContent}>
          {content.strengths?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strengths</Text>
              {content.strengths.map((s, i) => (
                <Text key={i} style={styles.bullet}>• {s}</Text>
              ))}
            </View>
          )}
          {content.areasToImprove && content.areasToImprove !== undefined && (content as any).areasToImprove?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Areas to Improve</Text>
              {(content as any).areasToImprove.map((s: string, i: number) => (
                <Text key={i} style={styles.bullet}>• {s}</Text>
              ))}
            </View>
          )}
          {content.weaknesses?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weaknesses</Text>
              {content.weaknesses.map((s, i) => (
                <Text key={i} style={styles.bullet}>• {s}</Text>
              ))}
            </View>
          )}
          {content.priorityDrills?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority Drills</Text>
              {content.priorityDrills.map((s, i) => (
                <Text key={i} style={styles.bullet}>• {s}</Text>
              ))}
            </View>
          )}
          {content.shortTermGoals?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Short-Term Goals</Text>
              {content.shortTermGoals.map((s, i) => (
                <Text key={i} style={styles.bullet}>• {s}</Text>
              ))}
            </View>
          )}
          {content.overallAssessment && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Assessment</Text>
              <Text style={styles.bodyText}>{content.overallAssessment}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ReportsScreen() {
  const [reports, setReports] = useState<CoachingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function loadReports() {
    try {
      const data = await getReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadReports();
  }

  async function handleGenerate() {
    Alert.alert('Generate Report', 'This will create a new coaching report based on your notes and videos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Generate',
        onPress: async () => {
          setGenerating(true);
          try {
            const report = await generateReport();
            setReports((prev) => [report, ...prev]);
          } catch (e) {
            Alert.alert('Error', 'Failed to generate report. Make sure you have notes or videos to analyze.');
          } finally {
            setGenerating(false);
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
        <Text style={styles.heading}>Reports</Text>
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Report</Text>
          )}
        </TouchableOpacity>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No reports yet.</Text>
          <Text style={styles.emptySubText}>
            Generate your first coaching report after adding notes or videos.
          </Text>
        </View>
      ) : (
        reports.map((report) => <ReportCard key={report.id} report={report} />)
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
  generateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  generateButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyContainer: { marginTop: 60, alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { color: '#9ca3af', fontSize: 16, fontWeight: '500', marginBottom: 8 },
  emptySubText: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  expandIcon: { color: '#6b7280', fontSize: 12 },
  summary: { fontSize: 14, color: '#e5e7eb', lineHeight: 20 },
  expandedContent: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#2563eb', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  bullet: { fontSize: 14, color: '#d1d5db', lineHeight: 22, paddingLeft: 4 },
  bodyText: { fontSize: 14, color: '#d1d5db', lineHeight: 20 },
});
