import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Platform, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

const RateReviewScreen = ({ navigation, route }) => {
    const { booking } = route.params || {};
    const vendorName = booking?.vendor || 'Vendor';
    const service = booking?.service || 'Service';

    const [rating, setRating] = useState(booking?.review?.rating || 0);
    const [review, setReview] = useState(booking?.review?.comment || '');
    const [saving, setSaving] = useState(false);

    const navigateBackToBookings = () => {
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: 'Main',
                    state: {
                        routes: [{ name: 'Bookings' }],
                    },
                },
            ],
        });
    };

    const handleSubmit = async () => {
        if (rating === 0 || saving) {
            return;
        }

        setSaving(true);
        try {
            await api.post(`/bookings/${booking.id}/review`, {
                rating,
                comment: review,
            });
            if (Platform.OS === 'web') {
                navigateBackToBookings();
                return;
            }
            Alert.alert('Success', 'Review submitted successfully!', [
                { text: 'OK', onPress: navigateBackToBookings }
            ]);
        } catch (error: any) {
            Alert.alert('Review Failed', error?.response?.data?.message || 'Could not save your rating.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F3F5' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>Rate & Review</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 20 }}>
                    How was the service?
                </Text>
                <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 30 }}>
                    {service} by {vendorName}
                </Text>

                {/* Stars */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 40 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ marginHorizontal: 6 }}>
                            <Ionicons name={rating >= s ? 'star' : 'star-outline'} size={44} color={rating >= s ? '#F59E0B' : '#D1D5DB'} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Text Input */}
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 }}>Share your experience (Optional)</Text>
                <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
                    <TextInput
                        placeholder="What did you like or dislike?"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        value={review}
                        onChangeText={setReview}
                        style={{ padding: 16, fontSize: 15, color: '#111827', minHeight: 120, textAlignVertical: 'top' }}
                    />
                </View>
            </ScrollView>

            {/* Action Button */}
            <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F3F5' }}>
                <TouchableOpacity
                    style={{ backgroundColor: rating > 0 ? '#F97316' : '#E5E7EB', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
                    disabled={rating === 0 || saving}
                    onPress={handleSubmit}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: rating > 0 ? '#fff' : '#9CA3AF', fontSize: 16, fontWeight: '800' }}>
                            {booking?.review?.rating ? 'Update Review' : 'Submit Review'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default RateReviewScreen;
