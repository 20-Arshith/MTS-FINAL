import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { User, Mail, Phone, Camera, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { agentService } from '../services/api';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const loadProfile = async () => {
                setLoading(true);
                try {
                    const response = await agentService.getProfile();
                    const profile = response.data?.data;

                    if (!isMounted || !profile) {
                        return;
                    }

                    setName(profile.name || '');
                    setEmail(profile.email || '');
                    setPhone(profile.mobile || '');
                } catch (error) {
                    Alert.alert('Error', 'Failed to load agent profile.');
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };

            loadProfile();

            return () => {
                isMounted = false;
            };
        }, [])
    );

    const handleSave = async () => {
        if (!name.trim() || (!phone.trim() && !email.trim())) {
            Alert.alert('Required Fields', 'Name and at least one contact detail are required.');
            return;
        }

        setSaving(true);
        try {
            const response = await agentService.updateProfile({
                name,
                email: email.trim(),
                mobile: phone.trim(),
            });

            const updatedProfile = response.data?.data;
            if (updatedProfile) {
                await AsyncStorage.setItem('userData', JSON.stringify(updatedProfile));
            }

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Update Failed', error?.response?.data?.message || 'Could not update your profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingShell} edges={['top']}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={styles.headerRight} />
            </LinearGradient>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.mainWrapper}>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarCircle}>
                                    <User color="#2563eb" size={48} />
                                </View>
                                <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
                                    <Camera color="#fff" size={16} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.avatarNote}>Agent details are loaded from the agents table</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputBox}>
                                    <User color="#94a3b8" size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#94a3b8"
                                    />
                                    {name.length > 2 && <CheckCircle2 color="#10b981" size={16} />}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputBox}>
                                    <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder="Enter your email address"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <View style={styles.inputBox}>
                                    <Phone color="#94a3b8" size={20} style={styles.inputIcon} />
                                    <Text style={styles.prefix}>+91</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={phone}
                                        onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 10))}
                                        keyboardType="phone-pad"
                                        placeholder="Phone number"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9} disabled={saving}>
                        <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.btnGradient}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingShell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 15,
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    flex1: {
        flex: 1,
    },
    header: {
        paddingTop: 10,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        width: 40,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    mainWrapper: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 35,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f7ff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        elevation: 10,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#2563eb',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarNote: {
        marginTop: 12,
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    inputIcon: {
        marginRight: 12,
    },
    prefix: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#64748b',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    saveBtn: {
        height: 58,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    btnGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});
