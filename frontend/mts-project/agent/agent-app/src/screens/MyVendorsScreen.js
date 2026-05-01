import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Dimensions, StatusBar, Alert } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Store, ChevronRight, AlertCircle, Phone, Calendar, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { agentService } from '../services/api';
import { getErrorMessage } from '../utils/error';

const { width } = Dimensions.get('window');

export default function MyVendorsScreen() {
    const navigation = useNavigation();
    const [vendors, setVendors] = useState([]);
    const [agentApprovalStatus, setAgentApprovalStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchVendors = async () => {
        try {
            setError(null);
            const response = await agentService.getVendors();
            const vendorList = response.data?.data?.vendors || [];
            setVendors(vendorList);
            setAgentApprovalStatus(response.data?.data?.approval_status || 'pending');
        } catch (err) {
            console.error('Failed to fetch vendors:', err);
            setError(getErrorMessage(err, 'Failed to load vendors. Pull down to retry.'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchVendors(); }, []);

    const handleRegisterVendor = () => {
        if (agentApprovalStatus !== 'approved') {
            const label = agentApprovalStatus.charAt(0).toUpperCase() + agentApprovalStatus.slice(1);
            Alert.alert('Approval Required', `Vendor onboarding is blocked because this agent is ${label}. Ask admin to approve the agent first.`);
            return;
        }

        navigation.navigate('VendorRegistration');
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVendors();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved':  return { bg: '#dcfce7', text: '#15803d', shadow: '#22c55e', label: 'Active' };
            case 'pending':   return { bg: '#fef9c3', text: '#a16207', shadow: '#eab308', label: 'Pending' };
            case 'rejected':  return { bg: '#fee2e2', text: '#b91c1c', shadow: '#ef4444', label: 'Rejected' };
            default:          return { bg: '#f1f5f9', text: '#475569', shadow: '#94a3b8', label: status };
        }
    };

    const renderVendorItem = ({ item }) => {
        const style = getStatusStyle(item.approval_status);
        const categoryNames = item.category?.category_name || item.services?.map(s => s.category?.category_name).filter(Boolean).join(', ') || 'General Services';

        const openDetails = () => {
            Alert.alert(
                item.business_name,
                [
                    `Owner: ${item.owner_name || 'N/A'}`,
                    `Mobile: ${item.mobile || 'N/A'}`,
                    `Category: ${categoryNames}`,
                    `Address: ${item.address || 'N/A'}`,
                    `Status: ${style.label}`,
                ].join('\n')
            );
        };

        return (
            <View style={styles.vendorCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.businessInfo}>
                        <Text style={styles.businessName} numberOfLines={1}>{item.business_name}</Text>
                        <View style={styles.categoryRow}>
                            <Store size={12} color="#64748b" />
                            <Text style={styles.categoryText} numberOfLines={1}>{categoryNames}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                        <Text style={[styles.statusText, { color: style.text }]}>{style.label}</Text>
                    </View>
                </View>

                <View style={styles.detailsSection}>
                    {item.address && (
                        <View style={styles.detailRow}>
                            <MapPin size={14} color="#94a3b8" />
                            <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Phone size={14} color="#94a3b8" />
                        <Text style={styles.detailText}>{item.mobile || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.joinedBox}>
                        <Calendar size={12} color="#94a3b8" style={styles.footerIcon} />
                        <Text style={styles.joinedText}>
                            Joined {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.viewDetailsBtn} onPress={openDetails}>
                        <Text style={styles.viewDetailsText}>Details</Text>
                        <ChevronRight size={16} color="#2563eb" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Vendors</Text>
                    <View style={styles.headerRight} />
                </View>
                
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{vendors.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, styles.textGreen]}>
                            {vendors.filter(v => v.approval_status === 'approved').length}
                        </Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, styles.textYellow]}>
                            {vendors.filter(v => v.approval_status === 'pending').length}
                        </Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text style={styles.loadingText}>Loading your network...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <AlertCircle size={48} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchVendors}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : vendors.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Store size={80} color="#e2e8f0" />
                        <Text style={styles.emptyTitle}>No vendors yet</Text>
                        <Text style={styles.emptySubtitle}>Start onboarding vendors to see them here.</Text>
                        <TouchableOpacity 
                            style={styles.addBtn}
                            onPress={handleRegisterVendor}
                        >
                            <Text style={styles.addBtnText}>+ Register Vendor</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={vendors}
                        keyExtractor={item => String(item.vendor_id)}
                        renderItem={renderVendorItem}
                        contentContainerStyle={styles.listPadding}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl 
                                refreshing={refreshing} 
                                onRefresh={onRefresh} 
                                colors={['#2563eb']} 
                                tintColor="#2563eb"
                            />
                        }
                    />
                )}
            </View>
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
        paddingBottom: 30,
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
        marginBottom: 25,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerRight: {
        width: 40,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    textGreen: {
        color: '#4ade80',
    },
    textYellow: {
        color: '#fbbf24',
    },
    content: {
        flex: 1,
    },
    listPadding: {
        padding: 20,
        paddingBottom: 40,
    },
    vendorCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    businessInfo: {
        flex: 1,
        marginRight: 10,
    },
    businessName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    detailsSection: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 13,
        color: '#475569',
        marginLeft: 8,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    joinedBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerIcon: {
        marginRight: 6,
    },
    joinedText: {
        fontSize: 12,
        color: '#94a3b8',
    },
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetailsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
        marginRight: 2,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    errorText: {
        marginTop: 15,
        fontSize: 15,
        color: '#ef4444',
        textAlign: 'center',
        fontWeight: '500',
    },
    retryBtn: {
        marginTop: 20,
        backgroundColor: '#2563eb',
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 12,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 25,
    },
    addBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 16,
        elevation: 5,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
