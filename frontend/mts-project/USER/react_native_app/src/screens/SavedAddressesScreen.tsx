import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const SavedAddressesScreen = ({ navigation }) => {
    const addresses = [
        {
            id: '1',
            type: 'Home',
            address: '123, Block C, HSR Layout, Sector 2',
            city: 'Bangalore, 560102',
            icon: 'home',
            isDefault: true
        },
        {
            id: '2',
            type: 'Office',
            address: 'Tech Park, 4th Floor, Electronic City',
            city: 'Bangalore, 560100',
            icon: 'business',
            isDefault: false
        },
        {
            id: '3',
            type: 'Other',
            address: 'G-45, Brigade Road, Central Street',
            city: 'Bangalore, 560001',
            icon: 'location-on',
            isDefault: false
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-[#F5F6FA]" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 ml-4">Saved Addresses</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                <Text className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Your saved locations</Text>

                {addresses.map((addr, index) => (
                    <View
                        key={index}
                        className="bg-white rounded-[20px] p-5 mb-4 flex-row items-start shadow-sm border border-gray-100"
                    >
                        <View className="bg-blue-50 w-12 h-12 rounded-2xl items-center justify-center mr-4">
                            <MaterialIcons name={addr.icon as any} size={24} color="#007BFF" />
                        </View>

                        <View className="flex-1">
                            <View className="flex-row items-center mb-1">
                                <Text className="text-[17px] font-bold text-gray-900 mr-2">{addr.type}</Text>
                                {addr.isDefault && (
                                    <View className="bg-green-100 px-2 py-0.5 rounded-md">
                                        <Text className="text-green-700 text-[10px] font-bold uppercase">Default</Text>
                                    </View>
                                )}
                            </View>
                            <Text className="text-sm text-gray-600 leading-5">{addr.address}</Text>
                            <Text className="text-[13px] text-gray-400 mt-1 font-medium">{addr.city}</Text>

                            <View className="flex-row mt-4 pt-3 border-t border-gray-50">
                                <TouchableOpacity className="flex-row items-center mr-6">
                                    <Ionicons name="create-outline" size={16} color="#007BFF" />
                                    <Text className="text-[#007BFF] text-xs font-bold ml-1.5">Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-row items-center">
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    <Text className="text-[#EF4444] text-xs font-bold ml-1.5">Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                <TouchableOpacity className="mt-2 bg-white border-2 border-dashed border-blue-200 rounded-[20px] p-6 flex-row items-center justify-center active:bg-blue-50/50">
                    <View className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center mr-3 shadow-lg shadow-blue-200">
                        <Ionicons name="add" size={20} color="white" />
                    </View>
                    <Text className="text-[#007BFF] font-black text-base">Add New Address</Text>
                </TouchableOpacity>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default SavedAddressesScreen;
