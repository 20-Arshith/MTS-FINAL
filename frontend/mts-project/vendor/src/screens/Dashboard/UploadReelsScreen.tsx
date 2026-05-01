import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { vendorService } from '../../services/api';

type PickedVideo = {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
    file?: File;
};

type ReelItem = {
    id: number;
    caption?: string | null;
    video_url: string;
    thumbnail_url?: string | null;
    expiry_date?: string | null;
    created_at: string;
};

const REELS_PAGE_SIZE = 8;

const mergeUniqueReels = (current: ReelItem[], incoming: ReelItem[]) => {
    const seen = new Set(current.map((item) => item.id));
    const merged = [...current];

    incoming.forEach((item) => {
        if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
        }
    });

    return merged;
};

function formatShortDate(value?: string | null) {
    if (!value) {
        return 'Today';
    }

    return new Date(value).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
    });
}

function formatFileSize(bytes?: number) {
    if (!bytes) {
        return '';
    }

    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
}

export default function UploadReelsScreen() {
    const navigation = useNavigation<any>();
    const [title, setTitle] = useState('');
    const [pickedVideo, setPickedVideo] = useState<PickedVideo | null>(null);
    const [reels, setReels] = useState<ReelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalReels, setTotalReels] = useState(0);

    const fetchMyReels = useCallback(async ({ pageToLoad = 1, append = false } = {}) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await vendorService.getMyReels({
                page: pageToLoad,
                limit: REELS_PAGE_SIZE,
            });
            const nextReels = response.data?.data || [];
            const meta = response.data?.meta || {};

            setReels((current) => (append ? mergeUniqueReels(current, nextReels) : nextReels));
            setPage(meta.page || pageToLoad);
            setHasMore(Boolean(meta.hasMore));
            setTotalReels(meta.total ?? nextReels.length);
        } catch (error) {
            console.error('Failed to load reels', error);
            Alert.alert('Error', 'Failed to load reels.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchMyReels({ pageToLoad: 1, append: false });
        }, [fetchMyReels])
    );

    const handleLoadMore = useCallback(() => {
        if (loading || loadingMore || !hasMore) {
            return;
        }

        fetchMyReels({ pageToLoad: page + 1, append: true });
    }, [fetchMyReels, hasMore, loading, loadingMore, page]);

    const selectedVideoMeta = useMemo(() => {
        if (!pickedVideo) {
            return null;
        }

        const fileSize = formatFileSize(pickedVideo.size);
        return fileSize ? `${pickedVideo.name} • ${fileSize}` : pickedVideo.name;
    }, [pickedVideo]);

    const handlePickVideo = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled || !result.assets?.length) {
                return;
            }

            const asset = result.assets[0];
            setPickedVideo({
                uri: asset.uri,
                name: asset.name || `reel-${Date.now()}.mp4`,
                mimeType: asset.mimeType || 'video/mp4',
                size: asset.size,
                file: (asset as any).file,
            });
        } catch (error) {
            console.error('Failed to pick video', error);
            Alert.alert('Error', 'Could not select a video file.');
        }
    };

    const handleUpload = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a title for your reel.');
            return;
        }

        if (!pickedVideo) {
            Alert.alert('Missing Video', 'Please select a video to upload.');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('caption', title.trim());

            if (Platform.OS === 'web' && pickedVideo.file) {
                formData.append('video', pickedVideo.file, pickedVideo.name);
            } else {
                formData.append('video', {
                    uri: pickedVideo.uri,
                    name: pickedVideo.name,
                    type: pickedVideo.mimeType || 'video/mp4',
                } as any);
            }

            await vendorService.uploadReel(formData);

            setTitle('');
            setPickedVideo(null);
            await fetchMyReels({ pageToLoad: 1, append: false });

            Alert.alert('Success', 'Your reel was uploaded successfully.');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Upload Failed', error?.response?.data?.message || 'Failed to upload reel.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (reelId: number) => {
        setDeletingId(reelId);

        try {
            await vendorService.deleteReel(reelId);
            setReels((prev) => prev.filter((item) => item.id !== reelId));
            setTotalReels((prev) => Math.max(0, prev - 1));
        } catch (error: any) {
            Alert.alert('Delete Failed', error?.response?.data?.message || 'Could not delete reel.');
        } finally {
            setDeletingId(null);
        }
    };

    const renderReelCard = ({ item }: { item: ReelItem }) => {
        const isExpired = item.expiry_date ? new Date(item.expiry_date) < new Date() : false;

        return (
            <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                <View style={{
                    width: 68,
                    height: 68,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    {item.thumbnail_url ? (
                        <Image
                            source={{ uri: item.thumbnail_url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <MaterialCommunityIcons name="video-outline" size={28} color="#006AE8" />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: '#1E293B' }}>
                        {item.caption || 'Untitled Reel'}
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
                        Uploaded {formatShortDate(item.created_at)}
                    </Text>
                    <Text style={{ color: isExpired ? '#D97706' : '#16A34A', fontSize: 12, marginTop: 2, fontWeight: '700' }}>
                        {isExpired ? 'Expired' : 'Active'}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: '#FEF2F2',
                        opacity: deletingId === item.id ? 0.6 : 1,
                    }}
                >
                    <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>
                        {deletingId === item.id ? '...' : 'Delete'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View
                style={{
                    backgroundColor: '#006AE8',
                    paddingTop: 56,
                    paddingBottom: 20,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>Upload Reels</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
                        Upload vendor reels to Cloudinary
                    </Text>
                </View>
            </View>

            <FlatList
                data={reels}
                keyExtractor={(item) => String(item.id)}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                ListHeaderComponent={
                    <View>
                        <TouchableOpacity
                            onPress={handlePickVideo}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderWidth: 2,
                                borderColor: '#BFDBFE',
                                borderStyle: 'dashed',
                                borderRadius: 16,
                                minHeight: 140,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 12,
                                padding: 20,
                            }}
                        >
                            <MaterialCommunityIcons name="video-plus-outline" size={40} color="#006AE8" />
                            <Text style={{ color: '#006AE8', fontWeight: '700', fontSize: 15, marginTop: 8 }}>
                                {pickedVideo ? 'Change Selected Video' : 'Tap to Select Video'}
                            </Text>
                            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                                MP4, MOV or other video formats up to 100MB
                            </Text>
                            {selectedVideoMeta ? (
                                <Text style={{ color: '#1E293B', fontSize: 12, marginTop: 10, textAlign: 'center', fontWeight: '600' }}>
                                    {selectedVideoMeta}
                                </Text>
                            ) : null}
                        </TouchableOpacity>

                        <TextInput
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 13,
                                fontSize: 15,
                                color: '#1E293B',
                                marginBottom: 12,
                            }}
                            placeholder="Reel title (e.g. AC Cleaning Demo)"
                            placeholderTextColor="#94A3B8"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <TouchableOpacity
                            onPress={handleUpload}
                            disabled={uploading}
                            style={{
                                backgroundColor: '#006AE8',
                                paddingVertical: 15,
                                borderRadius: 13,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                marginBottom: 24,
                                shadowColor: '#006AE8',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6,
                                opacity: uploading ? 0.7 : 1,
                            }}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <MaterialCommunityIcons name="upload" size={20} color="#FFFFFF" />
                            )}
                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
                                {uploading ? 'Uploading Reel...' : 'Upload Reel'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>
                            My Reels ({totalReels || reels.length})
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#006AE8" />
                        </View>
                    ) : (
                        <View style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 14,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            alignItems: 'center',
                        }}>
                            <MaterialCommunityIcons name="video-off-outline" size={28} color="#94A3B8" />
                            <Text style={{ color: '#1E293B', fontWeight: '700', marginTop: 10 }}>No reels uploaded yet</Text>
                            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                                Select a video and upload your first reel.
                            </Text>
                        </View>
                    )
                }
                renderItem={renderReelCard}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.35}
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color="#006AE8" />
                        </View>
                    ) : null
                }
            />
        </View>
    );
}
