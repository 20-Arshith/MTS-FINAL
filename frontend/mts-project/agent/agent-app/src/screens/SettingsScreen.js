import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, Alert, Platform } from 'react-native';
import React from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, MapPin, CreditCard, Headphones, Star, Share2, Shield, FileText, ChevronRight, LogOut, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
    const navigation = useNavigation();

    const performLogout = async () => {
        try {
            await AsyncStorage.multiRemove(['userToken', 'userData']);

            const stackNavigation = navigation.getParent?.() || navigation;
            stackNavigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        } catch (error) {
            console.error('Failed to logout:', error);
            Alert.alert('Logout Failed', 'Please try again.');
        }
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            const shouldLogout = typeof window === 'undefined'
                ? true
                : window.confirm('Are you sure you want to log out?');

            if (shouldLogout) {
                performLogout();
            }
            return;
        }

        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: performLogout
                }
            ]
        );
    };

    const SectionHeader = ({ title }) => (
        <Text style={styles.sectionTitle}>{title}</Text>
    );

    const SettingsItem = ({ icon: Icon, title, subtitle, bgClass, iconColor, onPress, isLast }) => (
        <TouchableOpacity 
            style={[styles.settingsItem, !isLast && styles.borderBottom]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                <Icon color={iconColor} size={22} />
            </View>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{title}</Text>
                {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight color="#cbd5e1" size={18} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Settings</Text>
                    <View style={styles.headerRight} />
                </View>
                <Text style={styles.headerSubtext}>Manage your agent profile and preferences</Text>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mainWrapper}>
                    {/* Account Section */}
                    <SectionHeader title="ACCOUNT" />
                    <View style={styles.sectionCard}>
                        <SettingsItem 
                            icon={User} 
                            title="Edit Profile" 
                            subtitle="Name, Phone, and Professional Bio" 
                            iconColor="#2563eb"
                            onPress={() => navigation.navigate('EditProfile')}
                            isLast={true}
                        />
                    </View>

                    {/* Support Section */}
                    <SectionHeader title="SUPPORT" />
                    <View style={styles.sectionCard}>
                        <SettingsItem 
                            icon={Headphones} 
                            title="Help & Support" 
                            subtitle="Get assistance from our team" 
                            iconColor="#f59e0b"
                            onPress={() => navigation.navigate('HelpAndSupport')}
                            isLast={false}
                        />
                        <SettingsItem 
                            icon={Star} 
                            title="Rate the App" 
                            subtitle="Share your feedback with us" 
                            iconColor="#fbbf24"
                            onPress={() => {}}
                            isLast={false}
                        />
                        <SettingsItem 
                            icon={Share2} 
                            title="Refer & Earn" 
                            subtitle="Invite friends and earn rewards" 
                            iconColor="#ec4899"
                            onPress={() => {}}
                            isLast={true}
                        />
                    </View>

                    {/* Legal Section */}
                    <SectionHeader title="LEGAL" />
                    <View style={styles.sectionCard}>
                        <SettingsItem 
                            icon={Shield} 
                            title="Privacy Policy" 
                            iconColor="#64748b"
                            onPress={() => {}}
                            isLast={false}
                        />
                        <SettingsItem 
                            icon={FileText} 
                            title="Terms of Service" 
                            iconColor="#64748b"
                            onPress={() => {}}
                            isLast={true}
                        />
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity 
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <LogOut color="#ef4444" size={20} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.versionText}>MTS Agent App • v1.0.4</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 10,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        width: 40,
    },
    headerSubtext: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        marginLeft: 2,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    mainWrapper: {
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        marginTop: -20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1.2,
        marginTop: 30,
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    itemSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginTop: 40,
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    versionText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 24,
    }
});

