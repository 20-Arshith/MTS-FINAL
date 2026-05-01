import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { vendorService } from '../../services/api';

const REELS_PAGE_SIZE = 8;

const mergeUniqueReels = (current: any[], incoming: any[]) => {
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

export default function ReelsScreen() {
    const navigation = useNavigation<any>();
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalReels, setTotalReels] = useState(0);

    useFocusEffect(
        useCallback(() => {
            const fetchMyReels = async ({ pageToLoad = 1, append = false } = {}) => {
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
                } finally {
                    setLoading(false);
                    setLoadingMore(false);
                }
            };

            fetchMyReels({ pageToLoad: 1, append: false });

            return () => undefined;
        }, [])
    );

    const handleLoadMore = useCallback(async () => {
        if (loading || loadingMore || !hasMore) {
            return;
        }

        setLoadingMore(true);

        try {
            const response = await vendorService.getMyReels({
                page: page + 1,
                limit: REELS_PAGE_SIZE,
            });
            const nextReels = response.data?.data || [];
            const meta = response.data?.meta || {};

            setReels((current) => mergeUniqueReels(current, nextReels));
            setPage(meta.page || (page + 1));
            setHasMore(Boolean(meta.hasMore));
            setTotalReels(meta.total ?? totalReels);
        } catch (error) {
            console.error('Failed to load more reels', error);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loading, loadingMore, page, totalReels]);

    const renderReelCard = ({ item }: { item: any }) => (
        <View className="w-[48%] bg-card rounded-xl border border-border overflow-hidden mb-4">
            <View className="h-32 bg-gray-200 items-center justify-center">
                {item.thumbnail_url ? (
                    <Image
                        source={{ uri: item.thumbnail_url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    <MaterialCommunityIcons name="play-circle-outline" size={32} color="#94A3B8" />
                )}
            </View>
            <View className="p-3">
                <Text className="text-textPrimary font-medium text-sm" numberOfLines={1}>
                    {item.caption || 'Untitled Reel'}
                </Text>
                <Text className="text-xs text-textSecondary mt-1">
                    Uploaded {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </Text>
            </View>
        </View>
    );

    return (
        <FlatList
            data={reels}
            numColumns={2}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderReelCard}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
            className="flex-1 bg-background"
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            ListHeaderComponent={
                <View>
                    <View className="bg-info/10 border border-info rounded-xl p-4 mb-6">
                        <Text className="text-textPrimary font-medium mb-1">Video Guidelines</Text>
                        <Text className="text-textSecondary text-sm">- Max length: 1 minute short videos</Text>
                        <Text className="text-textSecondary text-sm">- Videos expire automatically after 30 days</Text>
                        <Text className="text-textSecondary text-sm">- Uploaded videos are stored in Cloudinary</Text>
                    </View>

                    <TouchableOpacity
                        className="bg-card border-2 border-dashed border-primary rounded-2xl h-48 items-center justify-center mb-8"
                        onPress={() => navigation.getParent?.()?.getParent?.()?.navigate('UploadReels')}
                    >
                        <View className="w-16 h-16 rounded-full bg-primary-soft items-center justify-center mb-3">
                            <MaterialCommunityIcons name="cloud-upload-outline" size={32} color="#006AE8" />
                        </View>
                        <Text className="text-lg font-bold text-textPrimary">Open Reel Uploader</Text>
                        <Text className="text-textSecondary mt-1">Upload MP4 or MOV up to 100MB</Text>
                    </TouchableOpacity>

                    <Text className="text-lg font-bold text-textPrimary mb-4">My Reels ({totalReels || reels.length})</Text>
                </View>
            }
            ListEmptyComponent={
                loading ? (
                    <View className="py-10 items-center">
                        <ActivityIndicator size="large" color="#006AE8" />
                    </View>
                ) : (
                    <View className="bg-card rounded-xl border border-border p-5 items-center">
                        <MaterialCommunityIcons name="video-off-outline" size={28} color="#94A3B8" />
                        <Text className="text-textPrimary font-medium mt-3">No reels uploaded yet</Text>
                    </View>
                )
            }
            ListFooterComponent={
                loadingMore ? (
                    <View className="py-4 items-center">
                        <ActivityIndicator size="small" color="#006AE8" />
                    </View>
                ) : null
            }
        />
    );
}
