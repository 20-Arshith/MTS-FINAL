import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { vendorService } from '../../services/api';
import { DayConfig, formatTimeLabel, sortSchedule, TIME_OPTIONS } from '../../utils/availability';

export default function TimeSlotsScreen() {
    const navigation = useNavigation<any>();
    const [schedule, setSchedule] = useState<DayConfig[]>([]);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const res = await vendorService.getAvailability();
            setSchedule(sortSchedule(res.data?.data?.schedule || []));
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Could not load availability.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
    }, []);

    const toggle = (dayOfWeek: number) => {
        setSchedule((prev) => prev.map((item) => (
            item.day_of_week === dayOfWeek
                ? { ...item, is_active: !item.is_active }
                : item
        )));
    };

    const setTime = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
        setSchedule((prev) => prev.map((item) => (
            item.day_of_week === dayOfWeek
                ? { ...item, [field]: value }
                : item
        )));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await vendorService.updateAvailability({
                schedule: schedule.map((item) => ({
                    day_of_week: item.day_of_week,
                    is_active: item.is_active,
                    start_time: item.start_time,
                    end_time: item.end_time,
                })),
            });
            Alert.alert('Saved', 'Your weekly time slots have been updated.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            Alert.alert('Save Failed', error?.response?.data?.message || 'Could not update availability.');
        } finally {
            setSaving(false);
        }
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
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>Time Slots</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
                        Set your weekly availability
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#006AE8" />
                    <Text style={{ color: '#64748B', marginTop: 12 }}>Loading availability...</Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                    {schedule.map((cfg) => {
                        const isExpanded = expandedDay === cfg.day_of_week;
                        return (
                            <View
                                key={cfg.day_of_week}
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 14,
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: cfg.is_active ? '#BFDBFE' : '#E2E8F0',
                                    overflow: 'hidden',
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => cfg.is_active && setExpandedDay(isExpanded ? null : cfg.day_of_week)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                    }}
                                >
                                    <Switch
                                        value={cfg.is_active}
                                        onValueChange={() => toggle(cfg.day_of_week)}
                                        trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
                                        thumbColor={cfg.is_active ? '#006AE8' : '#94A3B8'}
                                    />
                                    <Text
                                        style={{
                                            marginLeft: 12,
                                            flex: 1,
                                            fontSize: 15,
                                            fontWeight: '600',
                                            color: cfg.is_active ? '#1E293B' : '#94A3B8',
                                        }}
                                    >
                                        {cfg.day_label}
                                    </Text>
                                    {cfg.is_active ? (
                                        <Text style={{ fontSize: 13, color: '#006AE8', fontWeight: '500', marginRight: 8 }}>
                                            {formatTimeLabel(cfg.start_time)} - {formatTimeLabel(cfg.end_time)}
                                        </Text>
                                    ) : (
                                        <Text style={{ fontSize: 13, color: '#94A3B8', marginRight: 8 }}>Closed</Text>
                                    )}
                                    {cfg.is_active && (
                                        <MaterialCommunityIcons
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    )}
                                </TouchableOpacity>

                                {isExpanded && cfg.is_active && (
                                    <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                                        {(['start_time', 'end_time'] as const).map((field) => (
                                            <View key={field} style={{ marginTop: 12 }}>
                                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 }}>
                                                    {field === 'start_time' ? 'Start Time' : 'End Time'}
                                                </Text>
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                    {TIME_OPTIONS.map((time) => (
                                                        <TouchableOpacity
                                                            key={time}
                                                            onPress={() => setTime(cfg.day_of_week, field, time)}
                                                            style={{
                                                                paddingHorizontal: 12,
                                                                paddingVertical: 6,
                                                                borderRadius: 8,
                                                                marginRight: 6,
                                                                backgroundColor: cfg[field] === time ? '#006AE8' : '#F1F5F9',
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: '600',
                                                                    color: cfg[field] === time ? '#FFFFFF' : '#475569',
                                                                }}
                                                            >
                                                                {formatTimeLabel(time)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={{
                            backgroundColor: saving ? '#93C5FD' : '#006AE8',
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: 'center',
                            marginTop: 8,
                            marginBottom: 32,
                            shadowColor: '#006AE8',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                            {saving ? 'Saving...' : 'Save Schedule'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}
