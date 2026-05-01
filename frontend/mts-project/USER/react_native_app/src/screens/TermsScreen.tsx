import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TermsScreen = ({ navigation }) => {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Terms & Conditions</Text>
            </View>

            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                <Text className="text-xl font-bold text-gray-900 mb-4">Terms of Service</Text>
                <Text className="text-sm text-gray-600 leading-6 mb-4">
                    Welcome to MTS India. These Terms of Service ("Terms") govern your use of our mobile application and related services.
                    By accessing or using our services, you agree to be bound by these requirements and any future amendments.
                </Text>

                <Text className="text-lg font-bold text-gray-900 mt-2 mb-2">1. Booking & Cancellation</Text>
                <Text className="text-sm text-gray-600 leading-6 mb-4">
                    Users may book services via the app. Cancellations made within 24 hours of the scheduled time may be subject to a cancellation fee.
                </Text>

                <Text className="text-lg font-bold text-gray-900 mt-2 mb-2">2. Vendor Liability</Text>
                <Text className="text-sm text-gray-600 leading-6 mb-4">
                    MTS India acts as an intermediary. Background checks are performed on all vendors, however, any disputes must be resolved per our vendor resolution policy.
                </Text>

                <Text className="text-lg font-bold text-gray-900 mt-2 mb-2">3. Payments</Text>
                <Text className="text-sm text-gray-600 leading-6 mb-4">
                    All prices listed are estimated. The final agreed-upon price is determined between the vendor and the customer after assessment. Payments processed via the app are secured via SSL formatting.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default TermsScreen;
