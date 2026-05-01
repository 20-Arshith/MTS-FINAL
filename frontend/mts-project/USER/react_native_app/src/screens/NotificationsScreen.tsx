import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { notificationService } from '../utils/api';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getMyNotifications(25);
      setNotifications(response.data?.data?.notifications || []);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      notificationService.markAllRead().catch(() => null);
    }, [fetchNotifications])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6FA', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>Notifications</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notification_id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{item.title}</Text>
                  <Text style={{ fontSize: 13, color: '#4B5563', marginTop: 6, lineHeight: 19 }}>{item.message}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                    {new Date(item.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {!item.is_read ? (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#007BFF', marginTop: 4 }} />
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: 80, alignItems: 'center' }}>
              <Ionicons name="notifications-outline" size={42} color="#93C5FD" />
              <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: '#111827' }}>No notifications yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
