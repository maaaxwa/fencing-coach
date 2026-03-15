import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import {
  getNotes,
  getVideos,
  getReports,
  getMediaUrl,
  ClassNote,
  Video,
  CoachingReport,
  CoachingReportContent,
} from '../../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [reports, setReports] = useState<CoachingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [n, v, r] = await Promise.all([getNotes(), getVideos(), getReports()]);
      setNotes(n);
      setVideos(v);
      setReports(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  const latestReport = reports[0] ?? null;
  let reportContent: CoachingReportContent | null = null;
  if (latestReport) {
    try {
      reportContent = JSON.parse(latestReport.content) as CoachingReportContent;
    } catch {
      reportContent = null;
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      <Text style={styles.heading}>Dashboard</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{notes.length}</Text>
          <Text style={styles.statLabel}>Notes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{videos.length}</Text>
          <Text style={styles.statLabel}>Videos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reports.length}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Notes</Text>
      {notes.length === 0 ? (
        <Text style={styles.emptyText}>No notes yet.</Text>
      ) : (
        notes.slice(0, 3).map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.card}
            onPress={() => router.push(`/notes/${note.id}`)}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardDate}>
                {format(new Date(note.sessionDate), 'MMM d, yyyy')}
              </Text>
              <View style={[styles.badge, note.analysis ? styles.badgeGreen : styles.badgeGray]}>
                <Text style={styles.badgeText}>{note.analysis ? 'Analyzed' : 'Pending'}</Text>
              </View>
            </View>
            <Text style={styles.cardContent} numberOfLines={2}>
              {note.content}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <Text style={styles.sectionTitle}>Recent Videos</Text>
      {videos.length === 0 ? (
        <Text style={styles.emptyText}>No videos yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoRow}>
          {videos.slice(0, 5).map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoThumb}
              onPress={() => router.push(`/videos/${video.id}`)}
            >
              {video.thumbnailPath ? (
                <Image
                  source={{ uri: getMediaUrl(`/api/uploads/thumbnails/${video.id}.jpg`) }}
                  style={styles.thumbImage}
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Text style={styles.thumbPlaceholderText}>No thumb</Text>
                </View>
              )}
              {!video.analysis && (
                <View style={styles.analyzingOverlay}>
                  <Text style={styles.analyzingText}>Analyzing...</Text>
                </View>
              )}
              <Text style={styles.videoDate} numberOfLines={1}>
                {format(new Date(video.boutDate), 'MMM d')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {reportContent && (
        <>
          <Text style={styles.sectionTitle}>Latest Report</Text>
          <View style={styles.card}>
            <Text style={styles.cardDate}>
              {format(new Date(latestReport!.createdAt), 'MMM d, yyyy')}
            </Text>
            <Text style={styles.cardContent} numberOfLines={3}>
              {reportContent.executiveSummary}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#2563eb' },
  statLabel: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 10, marginTop: 8 },
  emptyText: { color: '#6b7280', fontSize: 14, marginBottom: 16 },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardDate: { fontSize: 13, color: '#9ca3af' },
  cardContent: { fontSize: 14, color: '#e5e7eb', lineHeight: 20 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#052e16' },
  badgeGray: { backgroundColor: '#1f2937' },
  badgeText: { fontSize: 11, color: '#d1d5db', fontWeight: '500' },
  videoRow: { marginBottom: 16 },
  videoThumb: { width: 130, marginRight: 10 },
  thumbImage: { width: 130, height: 80, borderRadius: 8, backgroundColor: '#222' },
  thumbPlaceholder: {
    width: 130,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: { color: '#6b7280', fontSize: 11 },
  analyzingOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(37,99,235,0.85)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  analyzingText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  videoDate: { fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
});
