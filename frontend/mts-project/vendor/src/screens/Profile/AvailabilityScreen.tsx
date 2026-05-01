import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { vendorService } from '../../services/api';
import { DayConfig, formatTimeLabel, sortSchedule } from '../../utils/availability';

function showActivationBlockedDialog(message?: string) {
    Alert.alert(
        'Cannot Go Active',
        message || 'At least one service must be approved by admin and turned on before you can go active.'
    );
}

export default function AvailabilityScreen() {
    const [isAvailable, setIsAvailable] = useState(true);
    const [schedule, setSchedule] = useState<DayConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availabilityMeta, setAvailabilityMeta] = useState({
        canEnable: true,
        reason: '',
    });

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const res = await vendorService.getAvailability();
            setIsAvailable(Boolean(res.data?.data?.is_available));
            setSchedule(sortSchedule(res.data?.data?.schedule || []));
            setAvailabilityMeta({
                canEnable: Boolean(res.data?.data?.can_enable ?? true),
                reason: res.data?.data?.unavailable_reason || '',
            });
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Could not load availability.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

    const toggleDay = (dayOfWeek: number) => {
        setSchedule((prev) => prev.map((item) => (
            item.day_of_week === dayOfWeek
                ? { ...item, is_active: !item.is_active }
                : item
        )));
    };

    const handleAvailabilityToggle = (value: boolean) => {
        if (value && !availabilityMeta.canEnable) {
            showActivationBlockedDialog(availabilityMeta.reason);
            return;
        }

        setIsAvailable(value);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await vendorService.updateAvailability({
                is_available: isAvailable,
                schedule: schedule.map((item) => ({
                    day_of_week: item.day_of_week,
                    is_active: item.is_active,
                    start_time: item.start_time,
                    end_time: item.end_time,
                })),
            });
            setAvailabilityMeta({
                canEnable: Boolean(response.data?.data?.can_enable ?? true),
                reason: response.data?.data?.unavailable_reason || '',
            });
            Alert.alert('Saved', 'Your availability settings have been updated.');
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Could not update availability.';
            if (isAvailable) {
                showActivationBlockedDialog(message);
                setAvailabilityMeta((current) => ({
                    ...current,
                    canEnable: false,
                    reason: message,
                }));
            } else {
                Alert.alert('Save Failed', message);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#006AE8" />
                <Text className="text-textSecondary mt-3">Loading availability...</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-background px-6 pt-6">
            <View className="bg-card border border-border rounded-xl p-4 flex-row justify-between items-center mb-8">
                <View className="flex-1 pr-4">
                    <Text className="text-lg font-bold text-textPrimary">Taking New Bookings</Text>
                    <Text className="text-textSecondary text-sm mt-1">This controls whether users can book you right now.</Text>
                </View>
                <Switch
                    value={isAvailable}
                    onValueChange={handleAvailabilityToggle}
                    trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                    thumbColor="#FFFFFF"
                />
            </View>

            {!isAvailable && availabilityMeta.reason ? (
                <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex-row">
                    <View className="mr-3 pt-0.5">
                        <Text style={{ color: '#F59E0B', fontSize: 18 }}>!</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-orange-900 font-bold">Why you cannot go live</Text>
                        <Text className="text-orange-900 text-sm mt-1">{availabilityMeta.reason}</Text>
                    </View>
                </View>
            ) : null}

            <Text className="text-lg font-bold text-textPrimary mb-4">Weekly Schedule</Text>

            <View className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
                {schedule.map((day, index) => (
                    <View
                        key={day.day_of_week}
                        className={`flex-row justify-between items-center p-4 ${index !== schedule.length - 1 ? 'border-b border-border' : ''}`}
                    >
                        <View className="flex-1 pr-4">
                            <Text className={`font-semibold ${day.is_active ? 'text-textPrimary' : 'text-textDisabled'}`}>
                                {day.day_label}
                            </Text>
                            <Text className={`text-sm mt-1 ${day.is_active ? 'text-primary' : 'text-textDisabled'}`}>
                                {day.is_active
                                    ? `${formatTimeLabel(day.start_time)} - ${formatTimeLabel(day.end_time)}`
                                    : 'Closed'}
                            </Text>
                        </View>
                        <Switch
                            value={day.is_active}
                            onValueChange={() => toggleDay(day.day_of_week)}
                            trackColor={{ false: '#E2E8F0', true: '#006AE8' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                ))}
            </View>

            <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="rounded-2xl items-center mb-10"
                style={{ backgroundColor: saving ? '#93C5FD' : '#006AE8', paddingVertical: 16 }}
            >
                <Text className="text-white font-bold text-base">
                    {saving ? 'Saving...' : 'Save Availability'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
