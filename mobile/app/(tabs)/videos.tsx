import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { getVideos, uploadVideo, deleteVideo, getMediaUrl, Video } from '../../lib/api';

export default function VideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [boutDate, setBoutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fencerSide, setFencerSide] = useState<'left' | 'right'>('left');
  const [uploading, setUploading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadVideos() {
    try {
      const data = await getVideos();
      setVideos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    const hasUnanalyzed = videos.some((v) => !v.analysis);
    if (hasUnanalyzed) {
      if (!pollRef.current) {
        pollRef.current = setInterval(async () => {
          try {
            const data = await getVideos();
            setVideos(data);
            if (!data.some((v) => !v.analysis) && pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          } catch (e) {
            console.error(e);
          }
        }, 5000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [videos]);

  function onRefresh() {
    setRefreshing(true);
    loadVideos();
  }

  async function pickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSelectedUri(result.assets[0].uri);
      setShowForm(true);
    }
  }

  async function handleUpload() {
    if (!selectedUri) {
      Alert.alert('Error', 'Please select a video first.');
      return;
    }
    setUploading(true);
    try {
      const video = await uploadVideo({
        uri: selectedUri,
        boutDate: format(boutDate, 'yyyy-MM-dd'),
        fencerDescription: fencerSide,
      });
      setVideos((prev) => [video, ...prev]);
      setSelectedUri(null);
      setBoutDate(new Date());
      setFencerSide('left');
      setShowForm(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to upload video.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Video', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideo(id);
            setVideos((prev) => prev.filter((v) => v.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete video.');
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
        <Text style={styles.heading}>Videos</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickVideo}>
          <Text style={styles.addButtonText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {showForm && selectedUri && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Upload Video</Text>
          <Text style={styles.selectedFile} numberOfLines={1}>
            Selected: {selectedUri.split('/').pop()}
          </Text>

          <Text style={styles.label}>Bout Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateInputText}>{format(boutDate, 'MMM d, yyyy')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={boutDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setBoutDate(date);
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

          <Text style={styles.label}>Fencer Side</Text>
          <View style={styles.sideRow}>
            <TouchableOpacity
              style={[styles.sideButton, fencerSide === 'left' && styles.sideButtonActive]}
              onPress={() => setFencerSide('left')}
            >
              <Text style={[styles.sideButtonText, fencerSide === 'left' && styles.sideButtonTextActive]}>
                Left
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideButton, fencerSide === 'right' && styles.sideButtonActive]}
              onPress={() => setFencerSide('right')}
            >
              <Text style={[styles.sideButtonText, fencerSide === 'right' && styles.sideButtonTextActive]}>
                Right
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setSelectedUri(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.buttonDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>Upload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {videos.length === 0 ? (
        <Text style={styles.emptyText}>No videos yet. Upload your first bout video.</Text>
      ) : (
        <View style={styles.grid}>
          {videos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.gridItem}
              onPress={() => router.push(`/videos/${video.id}`)}
            >
              {video.thumbnailPath ? (
                <Image
                  source={{ uri: getMediaUrl(`/api/uploads/thumbnails/${video.id}.jpg`) }}
                  style={styles.thumbImage}
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Text style={styles.thumbPlaceholderText}>No thumbnail</Text>
                </View>
              )}
              {!video.analysis && (
                <View style={styles.analyzingBadge}>
                  <Text style={styles.analyzingText}>Analyzing...</Text>
                </View>
              )}
              <View style={styles.videoInfo}>
                <Text style={styles.videoDate}>{format(new Date(video.boutDate), 'MMM d, yyyy')}</Text>
                {video.fencerDescription && (
                  <Text style={styles.videoDesc} numberOfLines={1}>
                    {video.fencerDescription}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteOverlay}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(video.id);
                }}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
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
  formTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  selectedFile: { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
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
  sideRow: { flexDirection: 'row', gap: 10 },
  sideButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  sideButtonActive: { borderColor: '#2563eb', backgroundColor: '#1d3b6e' },
  sideButtonText: { color: '#9ca3af', fontSize: 15 },
  sideButtonTextActive: { color: '#fff', fontWeight: '600' },
  formButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelButton: {
    flex: 1,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#9ca3af', fontSize: 15 },
  uploadButton: {
    flex: 2,
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  uploadButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '47%',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: 100, backgroundColor: '#222' },
  thumbPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlaceholderText: { color: '#6b7280', fontSize: 12 },
  analyzingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(37,99,235,0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  analyzingText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  videoInfo: { padding: 8 },
  videoDate: { fontSize: 12, color: '#d1d5db', fontWeight: '500' },
  videoDesc: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  deleteOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontSize: 12 },
});
