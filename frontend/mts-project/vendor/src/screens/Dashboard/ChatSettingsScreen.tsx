import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Linking, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

type SettingToggle = {
    label: string;
    desc: string;
    key: string;
    icon: string;
    color: string;
};

const SETTINGS: SettingToggle[] = [
    { label: 'WhatsApp Chat', desc: 'Let customers message you on WhatsApp', key: 'whatsapp', icon: 'whatsapp', color: '#22C55E' },
    { label: 'In-App Chat', desc: 'Receive chat requests in the app', key: 'inApp', icon: 'chat-processing-outline', color: '#006AE8' },
    { label: 'Auto-Reply', desc: "Send 'I'll be in touch soon' to new messages", key: 'autoReply', icon: 'reply-outline', color: '#8B5CF6' },
    { label: 'Order Notifications', desc: 'Get notified for new order requests', key: 'orderNotif', icon: 'bell-ring-outline', color: '#F59E0B' },
    { label: 'Promotional Messages', desc: 'Receive offers and announcements', key: 'promo', icon: 'bullhorn-outline', color: '#EC4899' },
];

export default function ChatSettingsScreen() {
    const navigation = useNavigation<any>();
    const WHATSAPP_NUMBER = '+919876543210';
    const [toggles, setToggles] = useState<Record<string, boolean>>(
        Object.fromEntries(SETTINGS.map((s, i) => [s.key, i < 2]))
    );

    const flip = (key: string) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const openWhatsApp = () => {
        Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}`).catch(() =>
            Alert.alert('WhatsApp not found', 'Please install WhatsApp to use this feature.')
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Header */}
            <View style={{
                backgroundColor: '#006AE8',
                paddingTop: 56,
                paddingBottom: 20,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                    <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>Chat Settings</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
                        Manage how customers reach you
                    </Text>
                </View>
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
                {/* WhatsApp quick-open card */}
                <TouchableOpacity
                    onPress={openWhatsApp}
                    style={{
                        backgroundColor: '#22C55E',
                        borderRadius: 16,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 20,
                        shadowColor: '#22C55E',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <MaterialCommunityIcons name="whatsapp" size={32} color="#FFFFFF" />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Open WhatsApp</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                            {WHATSAPP_NUMBER}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.8)" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                {/* Toggle Settings */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Preferences
                </Text>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                    {SETTINGS.map((s, idx) => (
                        <View
                            key={s.key}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                borderTopWidth: idx === 0 ? 0 : 1,
                                borderTopColor: '#F1F5F9',
                            }}
                        >
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: `${s.color}15`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 14,
                            }}>
                                <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: '600', fontSize: 14, color: '#1E293B' }}>{s.label}</Text>
                                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{s.desc}</Text>
                            </View>
                            <Switch
                                value={toggles[s.key]}
                                onValueChange={() => flip(s.key)}
                                trackColor={{ false: '#E2E8F0', true: `${s.color}55` }}
                                thumbColor={toggles[s.key] ? s.color : '#FFFFFF'}
                            />
                        </View>
                    ))}
                </View>

                {/* WhatsApp number section */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginTop: 22, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    WhatsApp Number
                </Text>
                <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12,
                }}>
                    <MaterialCommunityIcons name="phone-outline" size={20} color="#006AE8" />
                    <Text style={{ marginLeft: 12, flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '600' }}>
                        {WHATSAPP_NUMBER}
                    </Text>
                    <TouchableOpacity onPress={() => Alert.alert('Change Number', 'Number edit coming soon.')}>
                        <Text style={{ color: '#006AE8', fontWeight: '700', fontSize: 14 }}>Change</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}
