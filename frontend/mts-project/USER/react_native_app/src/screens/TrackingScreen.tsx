import React, { useCallback, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import { getServiceMeta } from '../utils/serviceHelpers';

const formatDateTime = (value?: string | Date | null) => {
    if (!value) return '--';
    return new Date(value).toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const TrackingScreen = ({ navigation, route }: any) => {
    const bookingId = route.params?.booking?.id || route.params?.booking?.booking_id;
    const fallbackBooking = route.params?.booking;

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchBooking = useCallback(async () => {
        if (!bookingId) {
            setBooking(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/bookings/my/${bookingId}`);
            setBooking(res.data?.data || null);
        } catch (error) {
            setBooking(null);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useFocusEffect(
        useCallback(() => {
            fetchBooking();
        }, [fetchBooking])
    );

    if (loading) {
        return (
            <SafeAreaView
                className="flex-1 bg-[#F5F6FA]"
                style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
            >
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#007BFF" />
                    <Text className="text-gray-500 mt-3">Loading booking status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const activeBooking = booking || fallbackBooking;
    const serviceName = activeBooking?.vendor_service?.service_title || activeBooking?.service || 'Service';
    const vendorName = activeBooking?.vendor_service?.vendor?.business_name || activeBooking?.vendor || 'Vendor';
    const price = activeBooking?.total_price
        ? Number(activeBooking.total_price)
        : Number(activeBooking?.price || activeBooking?.vendor_service?.price_min || 0);
    const address = activeBooking?.address || 'Address not provided';
    const bookingStatus = activeBooking?.booking_status || activeBooking?.status || 'pending';
    const vendorPhone = activeBooking?.vendor_service?.vendor?.user?.mobile
        ? `+91${activeBooking.vendor_service.vendor.user.mobile}`
        : null;
    const scheduledAt = activeBooking?.scheduled_at;
    const createdAt = activeBooking?.created_at;
    const updatedAt = activeBooking?.updated_at;
    const meta = getServiceMeta(serviceName);

    const timeline = [
        {
            title: 'Booking Requested',
            time: formatDateTime(createdAt),
            completed: true,
            desc: 'Your booking has been saved in our system.',
        },
        {
            title: bookingStatus === 'cancelled' ? 'Vendor Response' : 'Vendor Confirmation',
            time: ['accepted', 'confirmed', 'completed', 'cancelled'].includes(bookingStatus) ? formatDateTime(updatedAt) : '--',
            completed: ['accepted', 'confirmed', 'completed', 'cancelled'].includes(bookingStatus),
            desc: bookingStatus === 'pending'
                ? 'Waiting for the vendor to accept this booking.'
                : bookingStatus === 'cancelled'
                    ? 'This booking was cancelled.'
                    : `${vendorName} accepted this booking.`,
        },
        {
            title: 'Scheduled Visit',
            time: formatDateTime(scheduledAt),
            completed: ['accepted', 'confirmed', 'completed'].includes(bookingStatus),
            desc: scheduledAt ? `Visit planned for ${formatDateTime(scheduledAt)}.` : 'Schedule not available.',
        },
        {
            title: bookingStatus === 'cancelled' ? 'Booking Closed' : 'Service Completed',
            time: bookingStatus === 'completed' || bookingStatus === 'cancelled' ? formatDateTime(updatedAt) : '--',
            completed: bookingStatus === 'completed' || bookingStatus === 'cancelled',
            desc: bookingStatus === 'completed'
                ? 'The vendor marked this service as completed.'
                : bookingStatus === 'cancelled'
                    ? 'This booking is no longer active.'
                    : 'This step will update once the service is finished.',
        },
    ];

    const openCall = () => {
        if (!vendorPhone) return;
        Linking.openURL(`tel:${vendorPhone}`).catch(() => {});
    };

    return (
        <SafeAreaView
            className="flex-1 bg-[#F5F6FA]"
            style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
        >
            <View className="bg-white px-4 py-4 flex-row items-center border-b border-gray-200">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Track Order</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="bg-white p-4 mb-3 border-b border-gray-200">
                    <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-row flex-1 pr-3">
                            <View
                                style={{ backgroundColor: `${meta.color}15` }}
                                className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                            >
                                <MaterialIcons name={meta.icon as any} size={24} color={meta.color} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-bold text-gray-900">{serviceName}</Text>
                                <Text className="text-sm text-gray-500 mt-1">{vendorName}</Text>
                                <Text className="text-xs text-gray-400 mt-1">Booking #{activeBooking?.booking_id || activeBooking?.id || '--'}</Text>
                            </View>
                        </View>
                        <Text className="text-base font-bold text-[#007BFF]">{price > 0 ? `₹${price}` : 'On Request'}</Text>
                    </View>

                    <View className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text className="text-sm text-gray-600 ml-2">{formatDateTime(scheduledAt)}</Text>
                        </View>
                        <View className="flex-row items-start">
                            <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
                            <Text className="text-sm text-gray-600 ml-2 flex-1">{address}</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white px-4 py-5 mb-3 border-b border-gray-200">
                    {['accepted', 'confirmed'].includes(bookingStatus) && activeBooking?.completion_otp ? (
                        <View className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 mb-5">
                            <Text className="text-xs font-bold text-[#1D4ED8] mb-2">SERVICE COMPLETION OTP</Text>
                            <Text className="text-[30px] font-extrabold text-gray-900 tracking-[6px]">{activeBooking.completion_otp}</Text>
                            <Text className="text-sm text-gray-600 mt-2">
                                Share this OTP with the vendor only after the service is fully completed.
                            </Text>
                        </View>
                    ) : null}

                    <Text className="text-base font-bold text-gray-900 mb-4">Vendor Details</Text>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-4">
                            <View className="w-11 h-11 bg-[#E6F0FF] rounded-full items-center justify-center mr-3">
                                <Ionicons name="storefront-outline" size={20} color="#007BFF" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-semibold text-gray-900">{vendorName}</Text>
                                <Text className="text-sm text-gray-500 mt-1">
                                    {vendorPhone || (bookingStatus === 'pending' ? 'Contact shown after acceptance' : 'Contact not available')}
                                </Text>
                            </View>
                        </View>
                        {vendorPhone && ['accepted', 'confirmed', 'completed'].includes(bookingStatus) && (
                            <TouchableOpacity
                                onPress={openCall}
                                className="w-11 h-11 bg-[#007BFF] rounded-full items-center justify-center"
                            >
                                <Ionicons name="call" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View className="bg-white p-5 flex-1">
                    <Text className="text-base font-bold text-gray-900 mb-6">Order Status</Text>

                    {timeline.map((step, index) => (
                        <View key={index} className="flex-row mb-6">
                            <View className="items-center mr-4">
                                <View className={`w-5 h-5 rounded-full items-center justify-center ${step.completed ? 'bg-[#007BFF]' : 'bg-gray-200'}`}>
                                    {step.completed && <Ionicons name="checkmark" size={12} color="white" />}
                                </View>
                                {index < timeline.length - 1 && (
                                    <View className={`w-[2px] h-12 mt-1 ${timeline[index + 1].completed ? 'bg-[#007BFF]' : 'bg-gray-200'}`} />
                                )}
                            </View>

                            <View className="flex-1 mt-[-2px]">
                                <View className="flex-row justify-between items-center pr-2">
                                    <Text className={`font-semibold text-[15px] ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.title}
                                    </Text>
                                    <Text className={`text-xs ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {step.time}
                                    </Text>
                                </View>
                                <Text className="text-sm text-gray-500 mt-1">{step.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TrackingScreen;
