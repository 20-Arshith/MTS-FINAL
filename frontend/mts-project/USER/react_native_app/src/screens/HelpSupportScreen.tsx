import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
    TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ShadowIconBox from '../components/ShadowIconBox';

const HelpSupportScreen = ({ navigation }) => {
    const categories = [
        { title: 'My Bookings', icon: 'calendar-check', color: '#3B82F6' },
        { title: 'Payments/Refund', icon: 'wallet-outline', color: '#10B981' },
        { title: 'Service Quality', icon: 'star-circle-outline', color: '#F59E0B' },
        { title: 'Account Safety', icon: 'shield-check-outline', color: '#8B5CF6' },
    ];

    const faqs = [
        'How do I reschedule my booking?',
        'What is your cancellation policy?',
        'How do I apply a coupon?',
        'Missing items after service',
    ];

    return (
        <SafeAreaView
            className="flex-1 bg-[#F5F6FA]"
            style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
        >
            <View className="bg-white flex-row items-center px-4 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 ml-4">Help & Support</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Search Header */}
                <View className="bg-white px-5 py-6 rounded-b-[32px] shadow-sm mb-6">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">How can we help?</Text>
                    <Text className="text-gray-500 text-sm mb-6">Search for questions or contact us below</Text>

                    <View className="flex-row items-center bg-[#F5F6FA] rounded-2xl px-4 py-3 border border-gray-100">
                        <Ionicons name="search" size={20} color="#9CA3AF" />
                        <TextInput
                            placeholder="Describe your issue..."
                            className="flex-1 ml-3 text-sm text-gray-800"
                        />
                    </View>
                </View>

                {/* Categories */}
                <View className="px-5 mb-8">
                    <Text className="text-base font-bold text-gray-900 mb-4">Categories</Text>
                    <View className="flex-row flex-wrap justify-between">
                        {categories.map((cat, i) => (
                            <TouchableOpacity
                                key={i}
                                className="bg-white w-[48%] rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm"
                            >
                                <View style={{ backgroundColor: `${cat.color}20` }} className="w-10 h-10 rounded-xl items-center justify-center mb-3">
                                    <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
                                </View>
                                <Text className="text-sm font-bold text-gray-800">{cat.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* FAQs */}
                <View className="px-5 mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-base font-bold text-gray-900">Popular Queries</Text>
                        <TouchableOpacity>
                            <Text className="text-blue-600 text-xs font-bold">View all</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        {faqs.map((q, i) => (
                            <TouchableOpacity
                                key={i}
                                className={`flex-row justify-between items-center p-4 ${i < faqs.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                                <Text className="text-sm text-gray-700 flex-1 pr-4">{q}</Text>
                                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Contact info */}
                <View className="px-5 mb-10">
                    <Text className="text-base font-bold text-gray-900 mb-4">Still need help?</Text>
                    <View className="flex-row justify-between">
                        <TouchableOpacity className="flex-1 bg-white border border-blue-100 rounded-2xl py-4 items-center mr-3 shadow-sm">
                            <Ionicons name="chatbubble-ellipses" size={24} color="#007BFF" />
                            <Text className="text-[#007BFF] font-bold text-sm mt-1">Live Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 bg-[#007BFF] rounded-2xl py-4 items-center shadow-lg shadow-blue-300">
                            <Ionicons name="call" size={24} color="white" />
                            <Text className="text-white font-bold text-sm mt-1">Call Us</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Support timing */}
            <View className="py-4 items-center border-t border-gray-100 bg-white">
                <Text className="text-gray-400 text-xs font-medium">Available 24/7 for premium members</Text>
            </View>
        </SafeAreaView>
    );
};

export default HelpSupportScreen;
