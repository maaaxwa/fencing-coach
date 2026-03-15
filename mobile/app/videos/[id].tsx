import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { format } from 'date-fns';
import { getVideo, analyzeVideo, getMediaUrl, Video, VideoAnalysis } from '../../lib/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function VideoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoUri = video
    ? getMediaUrl(`/api/uploads/videos/${video.filename}`)
    : '';

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = false;
  });

  async function loadVideo() {
    try {
      const data = await getVideo(id);
      setVideo(data);
      return data;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideo().then((data) => {
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
        const data = await getVideo(id);
        setVideo(data);
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
    if (!video) return;
    setAnalyzing(true);
    try {
      const result = await analyzeVideo(video.id);
      setVideo(result.video);
      stopPolling();
    } catch (e) {
      Alert.alert('Error', 'Failed to analyze video. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  let analysis: VideoAnalysis | null = null;
  if (video?.analysis) {
    try {
      analysis = JSON.parse(video.analysis) as VideoAnalysis;
    } catch {
      analysis = null;
    }
  }

  const thumbnailUri = video?.thumbnailPath
    ? getMediaUrl(`/api/uploads/thumbnails/${video.id}.jpg`)
    : undefined;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Video not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <VideoView
        player={player}
        style={styles.videoPlayer}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls
      />

      <View style={styles.metaRow}>
        <Text style={styles.dateText}>{format(new Date(video.boutDate), 'MMMM d, yyyy')}</Text>
        {!video.analysis && (
          <View style={styles.pendingBadge}>
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 4 }} />
            <Text style={styles.pendingText}>Analyzing...</Text>
          </View>
        )}
      </View>

      {video.fencerDescription && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Fencer</Text>
          <Text style={styles.cardValue}>{video.fencerDescription}</Text>
        </View>
      )}

      {!video.analysis ? (
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

              {analysis.overallScore !== undefined && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Overall Score</Text>
                  <Text style={styles.scoreValue}>{analysis.overallScore}<Text style={styles.scoreMax}>/100</Text></Text>
                </View>
              )}

              {analysis.footwork && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Footwork</Text>
                  <Text style={styles.analysisText}>{analysis.footwork}</Text>
                </View>
              )}

              {analysis.bladeWork && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Blade Work</Text>
                  <Text style={styles.analysisText}>{analysis.bladeWork}</Text>
                </View>
              )}

              {analysis.posture && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Posture</Text>
                  <Text style={styles.analysisText}>{analysis.posture}</Text>
                </View>
              )}

              {analysis.speedAndTiming && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Speed & Timing</Text>
                  <Text style={styles.analysisText}>{analysis.speedAndTiming}</Text>
                </View>
              )}

              {analysis.tacticalDecisions && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Tactical Decisions</Text>
                  <Text style={styles.analysisText}>{analysis.tacticalDecisions}</Text>
                </View>
              )}

              {analysis.topSuggestions?.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Top Suggestions</Text>
                  {analysis.topSuggestions.map((s, i) => (
                    <Text key={i} style={styles.bullet}>• {s}</Text>
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
  content: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#9ca3af', fontSize: 16 },
  videoPlayer: {
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 9) / 16,
    backgroundColor: '#000',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
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
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 15, color: '#e5e7eb' },
  analyzingCard: {
    backgroundColor: '#0f1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 20,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  analyzingTitle: { fontSize: 16, fontWeight: '600', color: '#93c5fd', marginBottom: 8 },
  analyzingSubText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  analysisContainer: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  scoreCard: {
    backgroundColor: '#0f1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: { fontSize: 13, color: '#93c5fd', marginBottom: 4 },
  scoreValue: { fontSize: 40, fontWeight: '700', color: '#2563eb' },
  scoreMax: { fontSize: 20, color: '#6b7280' },
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
  analysisText: { fontSize: 14, color: '#d1d5db', lineHeight: 22 },
  bullet: { fontSize: 14, color: '#d1d5db', lineHeight: 22, paddingLeft: 4 },
  reanalyzeButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  reanalyzeButtonText: { color: '#2563eb', fontWeight: '600', fontSize: 15 },
});
