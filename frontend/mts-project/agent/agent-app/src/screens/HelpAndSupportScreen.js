import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet, Dimensions, StatusBar } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageSquare, PhoneCall, Mail, ChevronRight, HelpCircle, ArrowLeft, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HelpAndSupportScreen() {
    const navigation = useNavigation();

    const FAQs = [
        "How do I register a new vendor?",
        "When will I receive my commission?",
        "How do I update my bank details?",
        "What happens if a vendor is rejected?"
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <View style={styles.headerRight} />
                </View>
                
                <View style={styles.searchContainer}>
                    <Search color="rgba(255, 255, 255, 0.6)" size={20} />
                    <Text style={styles.searchPlaceholder}>Search for topics or help...</Text>
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.flex1} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mainWrapper}>
                    {/* Hero Section */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroIconBox}>
                            <HelpCircle color="#2563eb" size={40} />
                        </View>
                        <Text style={styles.heroTitle}>How can we help?</Text>
                        <Text style={styles.heroSubtitle}>
                            Find answers to common questions or reach out to our dedicated agent support team.
                        </Text>
                    </View>

                    {/* Contact Options */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>CONTACT SUPPORT</Text>
                        
                        <TouchableOpacity style={styles.contactCard} activeOpacity={0.7}>
                            <View style={[styles.contactIconBox, { backgroundColor: '#eff6ff' }]}>
                                <MessageSquare color="#2563eb" size={22} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitle}>Live Chat</Text>
                                <Text style={styles.contactSubtitle}>Typical reply within 5 mins</Text>
                            </View>
                            <ChevronRight color="#cbd5e1" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} activeOpacity={0.7}>
                            <View style={[styles.contactIconBox, { backgroundColor: '#f0fdf4' }]}>
                                <PhoneCall color="#16a34a" size={22} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitle}>Call Us</Text>
                                <Text style={styles.contactSubtitle}>Mon-Fri, 9am to 6pm</Text>
                            </View>
                            <ChevronRight color="#cbd5e1" size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} activeOpacity={0.7}>
                            <View style={[styles.contactIconBox, { backgroundColor: '#fff7ed' }]}>
                                <Mail color="#ea580c" size={22} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitle}>Email Request</Text>
                                <Text style={styles.contactSubtitle}>agents@mts.com</Text>
                            </View>
                            <ChevronRight color="#cbd5e1" size={18} />
                        </TouchableOpacity>
                    </View>

                    {/* FAQ Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
                        
                        <View style={styles.faqWrapper}>
                            {FAQs.map((faq, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={[styles.faqItem, index !== FAQs.length - 1 && styles.borderBottom]}
                                    activeOpacity={0.6}
                                >
                                    <Text style={styles.faqText}>{faq}</Text>
                                    <ChevronRight color="#cbd5e1" size={18} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    
                    <View style={styles.footerNote}>
                        <Text style={styles.footerText}>Agent Support ID: MTS-7821-AG</Text>
                    </View>
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
    flex1: {
        flex: 1,
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
        marginBottom: 20,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
    },
    searchPlaceholder: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '500',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    mainWrapper: {
        paddingHorizontal: 20,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 30,
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    heroIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f7ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        letterSpacing: 1.2,
        marginBottom: 12,
        marginLeft: 4,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    contactIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    contactSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    faqWrapper: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    faqItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    faqText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#334155',
        paddingRight: 12,
    },
    footerNote: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500',
    }
});

