import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Image, ActivityIndicator, Alert, RefreshControl, StyleSheet, Dimensions, StatusBar } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Info, Settings, Wallet, CreditCard, Send, CheckCircle2, History, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { agentService } from '../services/api';
import { getErrorMessage } from '../utils/error';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
    const navigation = useNavigation();
    const [payoutMethod, setPayoutMethod] = useState('BANK');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [upi, setUpi] = useState('');
    const [commissionBalance, setCommissionBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    const MIN_WITHDRAWAL = 50;
    const isBalanceTooLow = commissionBalance < MIN_WITHDRAWAL;
    const hasValidBankDetails = accountNumber.trim().length >= 6 && ifscCode.trim().length >= 6;
    const hasValidUpi = upi.trim().includes('@');
    const hasValidPayoutMethod = payoutMethod === 'BANK' ? hasValidBankDetails : hasValidUpi;
    const isWithdrawDisabled = isBalanceTooLow || !hasValidPayoutMethod;
    const payoutInfoTitle = isBalanceTooLow
        ? 'Threshold Not Met'
        : !hasValidPayoutMethod
            ? 'Payout Method Required'
            : 'Ready to Withdraw';
    const payoutInfoDescription = isBalanceTooLow
        ? `You need a minimum of Rs.${MIN_WITHDRAWAL} to request a payout. Current gap is Rs.${(MIN_WITHDRAWAL - commissionBalance).toFixed(2)}.`
        : !hasValidPayoutMethod
            ? `Enter ${payoutMethod === 'BANK' ? 'account number and IFSC code' : 'a valid UPI ID'} to request a payout.`
            : 'Congratulations! You have reached the minimum threshold. Your funds can be transferred now.';

    const fetchCommission = async () => {
        try {
            setLoadError('');
            const response = await agentService.getCommission();
            const balance = parseFloat(response.data?.balance || 0);
            setCommissionBalance(balance);
        } catch (err) {
            console.error('Failed to fetch commission:', err?.response?.data || err.message);
            setLoadError(getErrorMessage(err, 'Unable to load your commission balance right now. Please try again.'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchCommission(); }, []);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchCommission(); }, []);

    const selectPayoutMethod = (method) => {
        setPayoutMethod(method);
        if (method === 'BANK') {
            setUpi('');
        } else {
            setAccountNumber('');
            setIfscCode('');
        }
    };

    const handleWithdraw = () => {
        if (!hasValidPayoutMethod) {
            Alert.alert(
                'Payment Method Required',
                payoutMethod === 'BANK'
                    ? 'Please enter both account number and IFSC code.'
                    : 'Please enter a valid UPI ID.'
            );
            return;
        }
        Alert.alert(
            'Confirm Withdrawal',
            `Withdraw ₹${commissionBalance.toFixed(2)} to your ${upi ? 'UPI: ' + upi : 'bank account'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    onPress: async () => {
                        setWithdrawLoading(true);
                        try {
                            await agentService.createPayoutRequest({
                                amount: commissionBalance,
                                payout_method: payoutMethod,
                                ...(payoutMethod === 'BANK'
                                    ? {
                                        account_number: accountNumber.trim(),
                                        ifsc_code: ifscCode.trim(),
                                    }
                                    : {
                                        upi_id: upi.trim(),
                                    }),
                            });
                            setAccountNumber('');
                            setIfscCode('');
                            setUpi('');
                            Alert.alert('Requested!', 'Withdrawal request submitted. You will receive funds within 2-3 business days.');
                            fetchCommission();
                        } catch (err) {
                            Alert.alert('Request Failed', getErrorMessage(err, 'Could not submit withdrawal request.'));
                        } finally {
                            setWithdrawLoading(false);
                        }
                    }
                }
            ]
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
                    <Text style={styles.headerTitle}>Financials</Text>
                    <TouchableOpacity style={styles.settingsBtn}>
                        <Settings color="#fff" size={22} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.balanceContainer}>
                    <View style={styles.balanceIconBox}>
                        <Wallet color="#fff" size={28} />
                    </View>
                    <View style={styles.balanceInfo}>
                        <Text style={styles.balanceLabel}>Available Commission</Text>
                        <View style={styles.balanceRow}>
                            <Text style={styles.currency}>₹</Text>
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" style={styles.loader} />
                            ) : (
                                <Text style={styles.balanceAmount}>{commissionBalance.toFixed(2)}</Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.historyBtn} activeOpacity={0.7}>
                        <History color="#fff" size={20} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.flex1}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={['#2563eb']} 
                            tintColor="#2563eb"
                        />
                    }
                >
                    <View style={styles.mainWrapper}>
                        {loadError ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorBannerText}>{loadError}</Text>
                            </View>
                        ) : null}

                        {/* Section: Withdrawal Methods */}
                        <View style={styles.sectionHeader}>
                            <CreditCard size={20} color="#2563eb" />
                            <Text style={styles.sectionTitle}>Payout Details</Text>
                        </View>

                        <View style={styles.methodToggle}>
                            <TouchableOpacity
                                style={[styles.methodOption, payoutMethod === 'BANK' && styles.methodOptionActive]}
                                onPress={() => selectPayoutMethod('BANK')}
                            >
                                <Text style={[styles.methodText, payoutMethod === 'BANK' && styles.methodTextActive]}>
                                    Bank Account
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodOption, payoutMethod === 'UPI' && styles.methodOptionActive]}
                                onPress={() => selectPayoutMethod('UPI')}
                            >
                                <Text style={[styles.methodText, payoutMethod === 'UPI' && styles.methodTextActive]}>
                                    UPI ID
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {payoutMethod === 'BANK' ? (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.inputLabel}>Account Number</Text>
                                    <View style={styles.inputBox}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter bank account number"
                                            placeholderTextColor="#94a3b8"
                                            value={accountNumber}
                                            onChangeText={setAccountNumber}
                                            keyboardType="number-pad"
                                        />
                                        {accountNumber.trim().length >= 6 && <CheckCircle2 size={16} color="#10b981" />}
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.inputLabel}>IFSC Code</Text>
                                    <View style={styles.inputBox}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. HDFC0001234"
                                            placeholderTextColor="#94a3b8"
                                            value={ifscCode}
                                            onChangeText={(value) => setIfscCode(value.toUpperCase())}
                                            autoCapitalize="characters"
                                        />
                                        {ifscCode.trim().length >= 6 && <CheckCircle2 size={16} color="#10b981" />}
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>UPI ID</Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. mobile@apl"
                                        placeholderTextColor="#94a3b8"
                                        value={upi}
                                        onChangeText={setUpi}
                                        autoCapitalize="none"
                                    />
                                    {upi.includes('@') && <CheckCircle2 size={16} color="#10b981" />}
                                </View>
                            </View>
                        )}

                        <Text style={styles.methodHint}>
                            Choose one payout method. Bank account and UPI cannot be submitted together.
                        </Text>

                        {/* Info Card */}
                        <View style={[styles.infoCard, isWithdrawDisabled ? styles.warningCard : styles.successCard]}>
                            <View style={styles.infoIconBox}>
                                {isWithdrawDisabled ? (
                                    <Info color="#b45309" size={22} />
                                ) : (
                                    <ShieldCheck color="#047857" size={22} />
                                )}
                            </View>
                            <View style={styles.infoTextGroup}>
                                <Text style={[styles.infoTitle, isWithdrawDisabled ? styles.warningTitle : styles.successTitle]}>
                                    {payoutInfoTitle}
                                </Text>
                                <Text style={[styles.infoDesc, isWithdrawDisabled ? styles.warningDesc : styles.successDesc]}>
                                    {isBalanceTooLow 
                                        ? `You need a minimum of ₹${MIN_WITHDRAWAL} to request a payout. Current gap is ₹${(MIN_WITHDRAWAL - commissionBalance).toFixed(2)}.`
                                        : !hasValidPayoutMethod
                                            ? `Enter ${payoutMethod === 'BANK' ? 'account number and IFSC code' : 'a valid UPI ID'} to request a payout.`
                                            : 'Congratulations! You have reached the minimum threshold. Your funds can be transferred now.'}
                                </Text>
                            </View>
                        </View>

                        {/* Withdraw Button */}
                        <TouchableOpacity
                            style={[styles.withdrawBtn, (isWithdrawDisabled || withdrawLoading) && styles.btnDisabled]}
                            disabled={isWithdrawDisabled || withdrawLoading}
                            onPress={handleWithdraw}
                            activeOpacity={0.9}
                        >
                            <LinearGradient 
                                colors={isWithdrawDisabled ? ['#e2e8f0', '#cbd5e1'] : ['#10b981', '#059669']} 
                                style={styles.btnGradient}
                            >
                                {withdrawLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <View style={styles.btnContent}>
                                        <Send size={20} color={isWithdrawDisabled ? '#94a3b8' : '#fff'} style={styles.btnIcon} />
                                        <Text style={[styles.btnText, isWithdrawDisabled && styles.btnTextDisabled]}>
                                            {isWithdrawDisabled ? 'Insufficient Balance' : `Withdraw ₹${commissionBalance.toFixed(2)}`}
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footerNote}>
                            <Text style={styles.footerText}>Payouts are processed within 48-72 hours.</Text>
                            <Text style={styles.footerText}>Standard platform charges may apply.</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    flex1: {
        flex: 1,
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
        marginBottom: 30,
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
    settingsBtn: {
        padding: 8,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 24,
        padding: 20,
    },
    balanceIconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceInfo: {
        flex: 1,
        marginLeft: 15,
    },
    balanceLabel: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currency: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginRight: 2,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
    },
    loader: {
        marginLeft: 5,
    },
    historyBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    mainWrapper: {
        padding: 24,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
    },
    errorBannerText: {
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 10,
    },
    methodToggle: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 16,
        padding: 4,
        marginBottom: 18,
    },
    methodOption: {
        flex: 1,
        minHeight: 44,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodOptionActive: {
        backgroundColor: '#2563eb',
    },
    methodText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    methodTextActive: {
        color: '#ffffff',
    },
    methodHint: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 17,
        marginTop: -6,
        marginBottom: 18,
        marginLeft: 4,
    },
    formGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
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
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
    },
    warningCard: {
        backgroundColor: '#fffcf0',
        borderColor: '#fef3c7',
    },
    successCard: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    infoIconBox: {
        marginRight: 12,
        marginTop: 2,
    },
    infoTextGroup: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    warningTitle: {
        color: '#92400e',
    },
    successTitle: {
        color: '#166534',
    },
    infoDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    warningDesc: {
        color: '#b45309',
    },
    successDesc: {
        color: '#15803d',
    },
    withdrawBtn: {
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    btnDisabled: {
        elevation: 0,
        shadowOpacity: 0,
    },
    btnGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnIcon: {
        marginRight: 10,
    },
    btnText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    btnTextDisabled: {
        color: '#94a3b8',
    },
    footerNote: {
        marginTop: 25,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 18,
    }
});
