import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import {
    ScrollView, Text, TextInput, TouchableOpacity, View,
    ActivityIndicator, Alert, Switch, Image, StyleSheet, Platform
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { vendorService, uploadService } from '../../services/api';

function getServiceCategoryName(service: any, categories: any[], primaryCategory?: any) {
    const directCategoryName = service?.category?.category_name;
    if (directCategoryName) return directCategoryName;
    const matchedCategory = categories.find((c) => c.category_id === service?.category_id);
    if (matchedCategory?.category_name) return matchedCategory.category_name;
    if (primaryCategory?.category_name && primaryCategory.category_id === service?.category_id)
        return primaryCategory.category_name;
    return 'Category unavailable';
}

async function buildUploadFormData(uri: string, assetType: string): Promise<FormData> {
    const fd = new FormData() as any;
    fd.append('asset_type', assetType);

    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        fd.append('file', blob, 'upload.jpg');
    } else {
        const filename = uri.split('/').pop() || 'photo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeMap: Record<string, string> = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
        };
        fd.append('file', { uri, name: filename, type: mimeMap[ext] || 'image/jpeg' });
    }
    
    return fd;
}

export default function EditProfileScreen() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile fields
    const [businessName, setBusinessName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Services
    const [serviceCategory, setServiceCategory] = useState('No service categories added yet');
    const [services, setServices] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [categoryLoadError, setCategoryLoadError] = useState('');
    const [primaryCategory, setPrimaryCategory] = useState<any>(null);
    const [togglingServiceId, setTogglingServiceId] = useState<number | null>(null);

    const openServiceEditor = (service?: any) => {
        const rootNavigation = navigation.getParent?.()?.getParent?.();
        if (rootNavigation) { rootNavigation.navigate('AddService', service ? { service } : undefined); return; }
        navigation.navigate('AddService', service ? { service } : undefined);
    };

    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    setCategoryLoadError('');
                    const [profileResult, categoriesResult] = await Promise.allSettled([
                        vendorService.getProfile(),
                        vendorService.getCategories(),
                    ]);

                    if (profileResult.status !== 'fulfilled') throw profileResult.reason;

                    const data = profileResult.value.data?.data;
                    const categoryList = categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value.data?.data)
                        ? categoriesResult.value.data.data : [];
                    setCategories(categoryList);
                    if (categoriesResult.status !== 'fulfilled') setCategoryLoadError('Could not load service categories right now.');

                    if (data) {
                        setBusinessName(data.business_name || '');
                        setAddress(data.address || '');
                        setDescription(data.description || '');
                        setLogoUrl(data.logo_url || null);
                        setBannerUrl(data.banner_url || null);
                        setPrimaryCategory(data.category || null);

                        const vendorServices = Array.isArray(data.services) ? data.services : [];
                        setServices(vendorServices);

                        const uniqueCategories = [...new Set(
                            vendorServices
                                .map((s: any) => getServiceCategoryName(s, categoryList, data.category))
                                .filter(Boolean)
                        )];
                        if (uniqueCategories.length > 0) setServiceCategory(uniqueCategories.join(', '));
                        else if (data.category?.category_name) setServiceCategory(data.category.category_name);
                        else setServiceCategory('No service categories added yet');
                    }
                } catch {
                    Alert.alert('Error', 'Failed to load profile details.');
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }, [])
    );

    // ── Image pickers ─────────────────────────────────────────────────────────
    const pickImage = async (type: 'logo' | 'banner') => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow photo library access.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            allowsEditing: true,
            aspect: type === 'logo' ? [1, 1] : [16, 9],
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const uri = result.assets[0].uri;

        if (type === 'logo') setUploadingLogo(true);
        else setUploadingBanner(true);

        try {
            const fd = await buildUploadFormData(uri, type);
            const res = await uploadService.uploadImageDirect(fd);
            const url: string = res.data?.data?.url;
            if (!url) throw new Error('Upload failed');
            // Immediately persist to backend
            await vendorService.updateProfile(type === 'logo' ? { logo_url: url } : { banner_url: url });
            if (type === 'logo') setLogoUrl(url);
            else setBannerUrl(url);
            Alert.alert('Success', `${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully!`);
        } catch (err: any) {
            Alert.alert('Upload Failed', err?.response?.data?.message || 'Could not upload image.');
        } finally {
            if (type === 'logo') setUploadingLogo(false);
            else setUploadingBanner(false);
        }
    };

    // ── Save profile ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!businessName.trim() || !address.trim()) {
            Alert.alert('Required Fields', 'Please fill in Business Name and Address.');
            return;
        }
        setSaving(true);
        try {
            await vendorService.updateProfile({ business_name: businessName, address, description });
            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err: any) {
            Alert.alert('Update Failed', err?.response?.data?.message || 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleServiceAvailabilityToggle = async (serviceId: number, currentValue: boolean) => {
        const nextValue = !currentValue;
        const previousServices = services;
        setTogglingServiceId(serviceId);
        setServices((prev) => prev.map((s) => s.id === serviceId ? { ...s, is_available: nextValue } : s));
        try {
            await vendorService.updateServiceAvailability(serviceId, nextValue);
        } catch (err: any) {
            setServices(previousServices);
            Alert.alert('Update Failed', err?.response?.data?.message || 'Could not update service availability.');
        } finally {
            setTogglingServiceId(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#006AE8" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* ── Banner ──────────────────────────────────────────────── */}
            <TouchableOpacity onPress={() => pickImage('banner')} style={styles.bannerContainer} activeOpacity={0.85}>
                {bannerUrl ? (
                    <Image source={{ uri: bannerUrl }} style={styles.bannerImg} resizeMode="cover" />
                ) : (
                    <View style={styles.bannerPlaceholder}>
                        <MaterialCommunityIcons name="image-plus" size={36} color="#94A3B8" />
                        <Text style={styles.bannerPlaceholderText}>Tap to add a banner image</Text>
                    </View>
                )}
                {uploadingBanner && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={{ color: '#fff', marginTop: 8, fontWeight: '600' }}>Uploading...</Text>
                    </View>
                )}
                <View style={styles.bannerEditBadge}>
                    <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>Edit Banner</Text>
                </View>
            </TouchableOpacity>

            {/* ── Logo ────────────────────────────────────────────────── */}
            <View style={styles.logoRow}>
                <TouchableOpacity onPress={() => pickImage('logo')} style={styles.logoContainer} activeOpacity={0.85}>
                    {logoUrl ? (
                        <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="cover" />
                    ) : (
                        <View style={styles.logoPlaceholder}>
                            <MaterialCommunityIcons name="storefront-outline" size={36} color="#006AE8" />
                        </View>
                    )}
                    {uploadingLogo ? (
                        <View style={styles.logoUploading}>
                            <ActivityIndicator size="small" color="#fff" />
                        </View>
                    ) : (
                        <View style={styles.logoEditBadge}>
                            <MaterialCommunityIcons name="camera" size={14} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.logoBadgeTitle}>Business Logo</Text>
                    <Text style={styles.logoBadgeSub}>Square image recommended (1:1)</Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                {/* Business Name */}
                <Text style={styles.label}>Business Name *</Text>
                <TextInput
                    style={styles.input}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="E.g. RK Plumbing Services"
                    placeholderTextColor="#94A3B8"
                />

                {/* Business Address */}
                <Text style={styles.label}>Business Address *</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your full business address"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor="#94A3B8"
                />

                {/* Description */}
                <Text style={styles.label}>About Your Business</Text>
                <TextInput
                    style={[styles.input, { height: 90 }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tell customers what makes your business unique..."
                    multiline
                    textAlignVertical="top"
                    placeholderTextColor="#94A3B8"
                />

                {/* Service Categories (read-only) */}
                <Text style={styles.label}>Service Categories</Text>
                <View style={[styles.input, { opacity: 0.7 }]}>
                    <Text style={{ color: '#1E293B', fontSize: 15 }}>{serviceCategory}</Text>
                </View>
                {categoryLoadError ? <Text style={styles.errorText}>{categoryLoadError}</Text> : null}

                {/* ── Manage Services ─────────────────────────────────── */}
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Manage Specific Services</Text>

                {services.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyCardTitle}>No services added yet</Text>
                        <Text style={styles.emptyCardSub}>Add your first service to send it for admin approval.</Text>
                    </View>
                ) : null}

                {services.map((service) => (
                    <View key={service.id} style={styles.serviceCard}>
                        {/* Service thumbnail row */}
                        {Array.isArray(service.image_urls) && service.image_urls.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                {service.image_urls.map((url: string, idx: number) => (
                                    <Image key={idx} source={{ uri: url }} style={styles.serviceThumb} resizeMode="cover" />
                                ))}
                            </ScrollView>
                        )}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.serviceName}>{service.service_title}</Text>
                            <TouchableOpacity onPress={() => openServiceEditor(service)}>
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.serviceDetail}>₹{service.price_min} — {getServiceCategoryName(service, categories, primaryCategory)}</Text>
                        <Text style={styles.serviceStatus}>
                            Status: {service.approval_status === 'approved' ? '✅ Approved' : service.approval_status === 'rejected' ? '❌ Rejected' : '⏳ Pending Approval'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                            <Text style={styles.availabilityLabel}>
                                {service.is_available ? 'Available to users' : 'Inactive for users'}
                            </Text>
                            <Switch
                                value={Boolean(service.is_available)}
                                onValueChange={() => handleServiceAvailabilityToggle(service.id, Boolean(service.is_available))}
                                disabled={togglingServiceId === service.id || service.approval_status !== 'approved'}
                                trackColor={{ false: '#CBD5E1', true: '#22C55E' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                        {service.approval_status !== 'approved' && (
                            <Text style={styles.approvalHint}>Toggle becomes active after admin approval.</Text>
                        )}
                    </View>
                ))}

                <TouchableOpacity style={styles.addServiceBtn} onPress={() => openServiceEditor()}>
                    <Text style={styles.addServiceText}>+ Add New Service</Text>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                >
                    {saving
                        ? <ActivityIndicator color="#FFFFFF" />
                        : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: '#F8FAFC' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
    // Banner
    bannerContainer: {
        width: '100%', height: 180, backgroundColor: '#E2E8F0',
        overflow: 'hidden', position: 'relative',
    },
    bannerImg: { width: '100%', height: '100%' },
    bannerPlaceholder: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    bannerPlaceholderText: { color: '#94A3B8', fontSize: 13, marginTop: 8 },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },
    bannerEditBadge: {
        position: 'absolute', bottom: 10, right: 12,
        backgroundColor: 'rgba(0,0,0,0.55)',
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    // Logo
    logoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    logoContainer: {
        width: 72, height: 72, borderRadius: 36,
        overflow: 'hidden', position: 'relative',
        borderWidth: 3, borderColor: '#006AE8',
    },
    logoImg: { width: '100%', height: '100%' },
    logoPlaceholder: {
        width: '100%', height: '100%',
        backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center',
    },
    logoUploading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center', justifyContent: 'center',
    },
    logoEditBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#006AE8',
        width: 22, height: 22, borderRadius: 11,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    logoBadgeTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    logoBadgeSub: { fontSize: 12, color: '#64748B', marginTop: 3 },
    // Form
    formContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
    label: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
    input: {
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 15, color: '#1E293B', marginBottom: 16,
    },
    errorText: { fontSize: 12, color: '#EF4444', marginTop: -10, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    emptyCard: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 14, padding: 16, marginBottom: 12,
    },
    emptyCardTitle: { fontWeight: '600', color: '#1E293B' },
    emptyCardSub: { color: '#64748B', marginTop: 4, fontSize: 13 },
    serviceCard: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 14, padding: 14, marginBottom: 12,
    },
    serviceThumb: {
        width: 64, height: 64, borderRadius: 10,
        marginRight: 8, backgroundColor: '#E2E8F0',
    },
    serviceName: { fontSize: 15, fontWeight: '600', color: '#1E293B', flex: 1 },
    editText: { color: '#006AE8', fontWeight: '600', fontSize: 14 },
    serviceDetail: { color: '#64748B', fontSize: 13, marginTop: 4 },
    serviceStatus: { fontSize: 12, color: '#64748B', marginTop: 6 },
    availabilityLabel: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
    approvalHint: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
    addServiceBtn: {
        borderWidth: 1.5, borderColor: '#006AE8', borderStyle: 'dashed',
        borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 24,
    },
    addServiceText: { color: '#006AE8', fontWeight: '600' },
    saveBtn: {
        backgroundColor: '#006AE8', paddingVertical: 16, borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#006AE8', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
