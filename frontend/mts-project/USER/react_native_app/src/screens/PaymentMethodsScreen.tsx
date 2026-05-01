import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const PaymentMethodsScreen = ({ navigation }) => {
  const methods = [
    { name: 'Amazon Pay', type: 'Wallet', number: 'Linked', icon: 'account-balance-wallet', color: '#FF9900' },
    { name: 'HDFC Credit Card', type: 'Card', number: '**** 4321', icon: 'credit-card', color: '#004A97', brand: 'visa' },
    { name: 'SBI Debit Card', type: 'Card', number: '**** 9876', icon: 'credit-card', color: '#1A6DBA', brand: 'mastercard' },
    { name: 'Google Pay', type: 'UPI', number: 'user@okicici', icon: 'bolt', color: '#4285F4' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F5F6FA]" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-4">Payment Methods</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* UPI Section */}
        <Text className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">UPI & Wallets</Text>
        <View className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-8">
          {methods.filter(m => m.type !== 'Card').map((method, index, arr) => (
            <View key={index}>
              <View className="p-5 flex-row items-center">
                <View style={{ backgroundColor: `${method.color}15` }} className="p-3 rounded-2xl mr-4">
                  <MaterialIcons name={method.icon as any} size={24} color={method.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-gray-900">{method.name}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5 font-medium">{method.number}</Text>
                </View>
                <TouchableOpacity className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Text className="text-gray-500 text-[11px] font-bold uppercase">Menu</Text>
                </TouchableOpacity>
              </View>
              {index < arr.length - 1 && <View className="h-[1px] bg-gray-50 mx-5" />}
            </View>
          ))}
        </View>

        {/* Cards Section */}
        <Text className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Saved Cards</Text>
        <View className="space-y-4">
          {methods.filter(m => m.type === 'Card').map((card, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 mb-4"
              style={{
                shadowColor: card.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5
              }}
            >
              <View className="flex-row justify-between items-start mb-6">
                <View style={{ backgroundColor: `${card.color}15` }} className="p-2.5 rounded-xl">
                  <Ionicons name="card" size={24} color={card.color} />
                </View>
                <FontAwesome5 name={card.brand as any} size={28} color="#E5E7EB" />
              </View>

              <Text className="text-lg font-bold text-gray-900 mb-1">{card.number}</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-gray-400 font-medium">{card.name}</Text>
                <Text className="text-xs text-gray-400 font-medium">12/28</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New */}
        <TouchableOpacity className="mt-4 bg-[#007BFF] rounded-2xl p-5 flex-row items-center justify-between shadow-lg shadow-blue-300">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-xl mr-3">
              <Ionicons name="add" size={24} color="white" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">Add New Method</Text>
              <Text className="text-white/70 text-xs">Link UPI, Card or Wallet</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;
