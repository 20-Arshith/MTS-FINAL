import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, Linking, Text, TouchableOpacity, View, ActivityIndicator, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { bookingService } from '../../services/api'; 

export default function OrdersScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'completed'>('pending');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [completionOtp, setCompletionOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpSubmitting, setOtpSubmitting] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchBookings = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const res = await bookingService.getVendorBookings();
            setOrders(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Re-fetch every time the screen comes into focus + start polling
    useFocusEffect(
        useCallback(() => {
            fetchBookings(true);

            // Poll every 20 seconds for new bookings
            pollingRef.current = setInterval(() => {
                fetchBookings(false);
            }, 20000);

            return () => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            };
        }, [fetchBookings])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, []);

    const openWhatsApp = (phone: string, customer: string) => {
        const message = `Hi ${customer}, this is your vendor from MTS Services regarding your recent booking.`;
        Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            // Optimistically update UI
            setOrders(prev => prev.map(order => order.booking_id === id ? { ...order, booking_status: newStatus } : order));
            await bookingService.updateStatus(id, newStatus);
        } catch (error) {
            // Revert on failure
            Alert.alert('Error', 'Failed to update booking status.');
            fetchBookings(); 
        }
    };

    const openCompletionOtpModal = (order: any) => {
        setSelectedOrder(order);
        setCompletionOtp('');
        setOtpError('');
        setOtpModalVisible(true);
    };

    const closeCompletionOtpModal = () => {
        if (otpSubmitting) {
            return;
        }

        setOtpModalVisible(false);
        setSelectedOrder(null);
        setCompletionOtp('');
        setOtpError('');
    };

    const handleConfirmCompletion = async () => {
        const normalizedOtp = completionOtp.trim();

        if (!selectedOrder) {
            closeCompletionOtpModal();
            return;
        }

        if (normalizedOtp.length !== 6) {
            setOtpError('Invalid OTP');
            return;
        }

        setOtpError('');
        setOtpSubmitting(true);
        try {
            const res = await bookingService.updateStatus(selectedOrder.booking_id, 'completed', normalizedOtp);
            const updatedStatus = res.data?.data?.booking_status || 'completed';
            setOrders((prev) => prev.map((order) => (
                order.booking_id === selectedOrder.booking_id
                    ? { ...order, booking_status: updatedStatus }
                    : order
            )));
            setOtpSubmitting(false);
            setOtpModalVisible(false);
            setSelectedOrder(null);
            setCompletionOtp('');
            setOtpError('');
        } catch (error: any) {
            setOtpError(
                error?.response?.data?.message === 'Invalid OTP'
                    ? 'Invalid OTP'
                    : error?.response?.data?.message || 'Please verify the OTP and try again.'
            );
            setOtpSubmitting(false);
        }
    };

    // Filter orders based on active tab
    const filteredOrders = orders.filter(o => {
        const s = o.booking_status || 'pending';
        if (activeTab === 'pending') return s === 'pending';
        if (activeTab === 'accepted') return s === 'accepted' || s === 'confirmed';
        if (activeTab === 'completed') return s === 'completed';
        return false;
    });

    const renderItem = ({ item }: { item: any }) => {
        const customerName = item.user?.full_name || 'Customer';
        const serviceName = item.vendor_service?.service_title || 'Service';
        const date = new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const price = item.total_price ? `₹${item.total_price}` : (item.vendor_service?.price_min ? `₹${item.vendor_service.price_min}` : 'TBD');
        const phone = item.user?.mobile || '';
        const address = item.address || item.user?.profile?.address || 'Address not provided';
        const status = item.booking_status || 'pending';

        return (
            <View className="bg-card border border-border rounded-2xl p-5 mb-5 shadow-sm">
                <View className="flex-row justify-between mb-4">
                    <View className="flex-1 pr-4">
                        <Text className="text-xl font-bold text-textPrimary">{customerName}</Text>
                        <Text className="text-base text-primary font-medium mt-1">{serviceName}</Text>
                        <Text className="text-sm text-textSecondary font-medium mt-1">Booking #{item.booking_id}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-lg font-bold text-textPrimary">{price}</Text>
                    </View>
                </View>

                <View className="bg-background rounded-xl p-3 mb-4 space-y-2 border border-border">
                    <View className="flex-row items-center">
                        <MaterialCommunityIcons name="calendar-range" size={18} color="#64748B" />
                        <Text className="text-textSecondary ml-2 text-sm font-medium">{date}</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <MaterialCommunityIcons name="map-marker-outline" size={18} color="#64748B" />
                        <Text className="text-textSecondary ml-2 text-sm font-medium flex-1">{address}</Text>
                    </View>
                </View>

                {status === 'pending' && (
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 bg-red-50 py-3 rounded-xl border border-red-200 items-center justify-center"
                            onPress={() => handleUpdateStatus(item.booking_id, 'cancelled')}
                        >
                            <Text className="text-red-500 font-semibold">Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-primary py-3 rounded-xl items-center justify-center shadow-sm"
                            onPress={() => handleUpdateStatus(item.booking_id, 'confirmed')}
                        >
                            <Text className="text-white font-semibold">Accept Order</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {(status === 'accepted' || status === 'confirmed') && (
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 bg-green-500 py-3 rounded-xl flex-row justify-center items-center shadow-sm"
                            onPress={() => {
                                if (phone) openWhatsApp(phone, customerName);
                                else Alert.alert('Unavailable', 'Phone number not provided');
                            }}
                        >
                            <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
                            <Text className="text-white font-semibold ml-2">WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-background border border-primary py-3 rounded-xl items-center justify-center"
                            onPress={() => openCompletionOtpModal(item)}
                        >
                            <Text className="text-primary font-semibold">Mark Done</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {status === 'completed' && (
                    <View className="bg-green-50 border border-green-200 py-3 rounded-xl items-center justify-center">
                        <Text className="text-green-600 font-semibold">Order Completed</Text>
                    </View>
                )}

                {status === 'cancelled' && (
                    <View className="bg-red-50 border border-red-200 py-3 rounded-xl items-center justify-center">
                        <Text className="text-red-600 font-semibold">Order Cancelled</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
         return (
             <View className="flex-1 bg-background items-center justify-center">
                 <ActivityIndicator size="large" color="#006AE8" />
             </View>
         );
    }

    // counts for tabs
    const pendingCount = orders.filter(o => o.booking_status === 'pending' || !o.booking_status).length;
    const activeCount = orders.filter(o => o.booking_status === 'accepted' || o.booking_status === 'confirmed').length;
    const completedCount = orders.filter(o => o.booking_status === 'completed').length;

    return (
        <View className="flex-1 bg-background pt-16 px-5">
            <Text className="text-3xl font-bold text-textPrimary mb-6">Manage Orders</Text>

            {/* Custom Tab Selector */}
            <View className="flex-row bg-input rounded-xl p-1 mb-6 border border-border">
                <TouchableOpacity
                    className="flex-1 py-2 items-center rounded-lg"
                    style={{
                        backgroundColor: activeTab === 'pending' ? '#006AE8' : 'transparent',
                        shadowColor: activeTab === 'pending' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: activeTab === 'pending' ? 2 : 0
                    }}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={{ fontWeight: '600', color: activeTab === 'pending' ? '#FFFFFF' : '#64748B' }}>
                        New ({pendingCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 py-2 items-center rounded-lg"
                    style={{
                        backgroundColor: activeTab === 'accepted' ? '#006AE8' : 'transparent',
                        shadowColor: activeTab === 'accepted' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: activeTab === 'accepted' ? 2 : 0
                    }}
                    onPress={() => setActiveTab('accepted')}
                >
                    <Text style={{ fontWeight: '600', color: activeTab === 'accepted' ? '#FFFFFF' : '#64748B' }}>
                        Active ({activeCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 py-2 items-center rounded-lg"
                    style={{
                        backgroundColor: activeTab === 'completed' ? '#006AE8' : 'transparent',
                        shadowColor: activeTab === 'completed' ? '#000' : 'transparent',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: activeTab === 'completed' ? 2 : 0
                    }}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={{ fontWeight: '600', color: activeTab === 'completed' ? '#FFFFFF' : '#64748B' }}>
                        Done ({completedCount})
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => String(item.booking_id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#006AE8']} />}
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center mt-20">
                        <MaterialCommunityIcons name="clipboard-text-off-outline" size={64} color="#CBD5E1" />
                        <Text className="text-textSecondary text-lg font-medium mt-4">
                            No {activeTab} orders right now.
                        </Text>
                    </View>
                }
            />

            <Modal
                visible={otpModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeCompletionOtpModal}
            >
                <View className="flex-1 bg-black/40 items-center justify-center px-6">
                    <View className="w-full bg-white rounded-3xl p-6">
                        <Text className="text-2xl font-bold text-textPrimary">Confirm service completion</Text>
                        <Text className="text-base text-textSecondary mt-2">
                            Ask the user for the 6-digit OTP shown in their booking, then enter it here to mark the order as done.
                        </Text>

                        <View className="mt-5 border border-border rounded-2xl px-4 py-3 bg-background">
                            <Text className="text-sm text-textSecondary mb-2">OTP</Text>
                            <TextInput
                                value={completionOtp}
                                onChangeText={(value) => {
                                    setCompletionOtp(value.replace(/[^0-9]/g, '').slice(0, 6));
                                    if (otpError) {
                                        setOtpError('');
                                    }
                                }}
                                keyboardType="number-pad"
                                maxLength={6}
                                style={{ fontSize: 22, fontWeight: '700', letterSpacing: 8, color: '#0F172A' }}
                            />
                        </View>
                        {otpError ? (
                            <Text className="text-red-500 text-sm font-medium mt-2">{otpError}</Text>
                        ) : null}

                        <View className="flex-row gap-3 mt-6">
                            <TouchableOpacity
                                className="flex-1 border border-border rounded-2xl py-3 items-center justify-center"
                                onPress={closeCompletionOtpModal}
                                disabled={otpSubmitting}
                            >
                                <Text className="text-textSecondary font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-primary rounded-2xl py-3 items-center justify-center"
                                onPress={handleConfirmCompletion}
                                disabled={otpSubmitting}
                            >
                                <Text className="text-white font-semibold">
                                    {otpSubmitting ? 'Verifying...' : 'Confirm Done'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
