import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getServiceMeta } from '../utils/serviceHelpers';
import api from '../utils/api';

const STATUS_CONFIG: Record<string, any> = {
  pending:   { label: 'Awaiting Acceptance', bg: '#FFFBEB', fg: '#92400E', dot: '#F59E0B' },
  confirmed: { label: 'Vendor Accepted',     bg: '#F0FDF4', fg: '#166534', dot: '#22C55E' },
  accepted:  { label: 'Vendor Accepted',     bg: '#F0FDF4', fg: '#166534', dot: '#22C55E' },
  completed: { label: 'Completed',           bg: '#EFF6FF', fg: '#1E40AF', dot: '#3B82F6' },
  cancelled: { label: 'Cancelled',           bg: '#FEF2F2', fg: '#991B1B', dot: '#EF4444' },
};

const BookingsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Upcoming', 'Completed', 'Cancelled'];

  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/bookings/my');
      if (res.data.success) {
        setAllBookings(res.data.data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch bookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Re-fetch every time the screen comes into focus and start realtime polling
  useFocusEffect(
    useCallback(() => {
      fetchBookings(true);

      pollingRef.current = setInterval(() => {
        fetchBookings(false);
      }, 15000); // Poll every 15 seconds for real-time order status

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, [fetchBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(false);
  };

  // Map raw API booking → display shape
  const mapBooking = (b: any) => {
    const svc = b.vendor_service;
    const vendorPhone = svc?.vendor?.user?.mobile
      ? '+91' + svc.vendor.user.mobile
      : null;
    return {
      id: b.booking_id,
      service: svc?.service_title || 'Service',
      vendor: svc?.vendor?.business_name || 'Vendor',
      vendorPhone,
      dateTime: b.scheduled_at
        ? new Date(b.scheduled_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : new Date(b.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      address: b.address || 'Address not provided',
      price: b.total_price ? Number(b.total_price) : (svc?.price_min ? Number(svc.price_min) : 0),
      status: b.booking_status || 'pending',
      review: b.review || null,
      completionOtp: b.completion_otp || '',
    };
  };

  const upcoming = allBookings
    .filter(b => ['pending', 'accepted', 'confirmed'].includes(b.booking_status))
    .map(mapBooking);

  const completed = allBookings
    .filter(b => b.booking_status === 'completed')
    .map(mapBooking);

  const cancelled = allBookings
    .filter(b => b.booking_status === 'cancelled')
    .map(mapBooking);

  const lists = [upcoming, completed, cancelled];
  const currentBookings = lists[activeTab];

  const openWhatsApp = (phone: string, service: string, vendor: string) => {
    const msg = encodeURIComponent(
      `Hi ${vendor}! I'm reaching out about my MTS booking for "${service}". Could you please confirm the arrival time?`
    );
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${msg}`).catch(() =>
      Alert.alert('WhatsApp not found', 'Please install WhatsApp to contact the vendor.')
    );
  };

  const openCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>

      {/* ── Header ── */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.3 }}>My Bookings</Text>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          {tabs.map((t, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveTab(i)}
              style={{ marginRight: 24, paddingBottom: 12, borderBottomWidth: 2.5, borderBottomColor: activeTab === i ? '#007BFF' : 'transparent' }}
            >
              <Text style={{ fontSize: 14, fontWeight: activeTab === i ? '700' : '500', color: activeTab === i ? '#007BFF' : '#9CA3AF' }}>
                {t}
                <Text style={{ fontSize: 12, color: activeTab === i ? '#007BFF' : '#C4C9D4' }}> {lists[i].length}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007BFF']} />}
      >
        {currentBookings.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 72 }}>
            <Ionicons name="calendar-outline" size={54} color="#D1D5DB" />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 16 }}>No bookings yet</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Your {tabs[activeTab].toLowerCase()} bookings will show here</Text>
            {activeTab === 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Search')}
                style={{ marginTop: 20, backgroundColor: '#007BFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Browse Services</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentBookings.map((b: any) => {
            const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
            const meta = getServiceMeta(b.service);
            const isAccepted = b.status === 'accepted' || b.status === 'confirmed';
            return (
              <View key={b.id} style={{ backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, borderWidth: 1, borderColor: '#F1F3F5' }}>

                {/* ── Top row: service + status ── */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: meta.color + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialIcons name={meta.icon as any} size={22} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{b.service}</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{b.vendor}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Booking #{b.id}</Text>
                  </View>
                  {/* Status pill */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot, marginRight: 5 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: cfg.fg }}>{cfg.label}</Text>
                  </View>
                </View>

                {/* ── Divider + meta info ── */}
                <View style={{ height: 1, backgroundColor: '#F8F9FB' }} />
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                    <Text style={{ fontSize: 12.5, color: '#6B7280', marginLeft: 6 }}>{b.dateTime}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                    {b.price > 0 ? `₹${b.price}` : 'Price on request'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12 }}>
                  <Ionicons name="location-outline" size={13} color="#9CA3AF" />
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 6, flex: 1 }} numberOfLines={1}>{b.address}</Text>
                </View>

                {/* ── Actions — strictly status-gated ── */}
                {b.status === 'pending' && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 10, padding: 10 }}>
                      <Ionicons name="time-outline" size={15} color="#F59E0B" />
                      <Text style={{ fontSize: 12.5, color: '#92400E', marginLeft: 8, fontWeight: '500' }}>
                        Waiting for the vendor to accept your booking
                      </Text>
                    </View>
                  </View>
                )}

                {isAccepted && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F1F3F5', padding: 14 }}>
                    {b.completionOtp ? (
                      <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginBottom: 6 }}>Service completion OTP</Text>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: 6 }}>{b.completionOtp}</Text>
                        <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 6, lineHeight: 17 }}>
                          Share this OTP with the vendor only after the work is fully completed.
                        </Text>
                      </View>
                    ) : null}
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Contact your vendor</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {b.vendorPhone ? (
                        <>
                          <TouchableOpacity
                            onPress={() => openCall(b.vendorPhone)}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FDF4', borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: '#BBF7D0', marginRight: 8 }}
                          >
                            <Ionicons name="call-outline" size={16} color="#16A34A" />
                            <Text style={{ color: '#16A34A', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Call</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => openWhatsApp(b.vendorPhone, b.service, b.vendor)}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', borderRadius: 10, paddingVertical: 11 }}
                          >
                            <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>WhatsApp</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <View style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}>
                          <Text style={{ color: '#6B7280', fontSize: 13 }}>Contact details not available</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={{ marginTop: 8, backgroundColor: meta.color, borderRadius: 10, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => navigation.navigate('Tracking', { booking: b })}
                    >
                      <MaterialIcons name="my-location" size={16} color="white" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Track Vendor</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {b.status === 'completed' && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingHorizontal: 14, paddingVertical: 12 }}>
                    {b.review?.rating ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <Ionicons name="star" size={15} color="#F59E0B" />
                        <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                          Your rating: {b.review.rating}/5
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10 }}
                        onPress={() => navigation.navigate('RateReview', { booking: b })}
                      >
                        <Ionicons name="star" size={15} color="#F97316" />
                        <Text style={{ color: '#F97316', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                          Rate & Review
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {b.status === 'cancelled' && (
                  <View style={{ borderTopWidth: 1, borderTopColor: '#F1F3F5', paddingHorizontal: 14, paddingVertical: 12 }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: meta.color + '15', borderRadius: 10, paddingVertical: 10 }}
                      onPress={() => navigation.navigate('Search')}
                    >
                      <MaterialIcons name="refresh" size={15} color={meta.color} />
                      <Text style={{ color: meta.color, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>Book Again</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingsScreen;
