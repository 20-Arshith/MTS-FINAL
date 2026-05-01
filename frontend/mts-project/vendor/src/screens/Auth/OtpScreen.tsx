import { useNavigation, useRoute } from '@react-navigation/native';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OtpScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const isLogin = route.params?.isLogin ?? false;

    return (
        <View className="flex-1 bg-background px-6 pt-16">
            <View className="mb-10">
                <Text className="text-3xl font-bold text-textPrimary">Enter OTP</Text>
                <Text className="text-textSecondary mt-2">We&apos;ve sent a 6-digit verification code to your contact.</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <TextInput
                        className="w-full bg-input border border-border rounded-xl px-4 py-4 text-textPrimary text-center text-3xl font-bold tracking-[16px]"
                        placeholder="------"
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholderTextColor="#CBD5E1"
                    />
                </View>

                <TouchableOpacity
                    className="w-full bg-primary py-4 rounded-xl items-center mt-8 shadow-sm"
                    onPress={() => {
                        if (isLogin) {
                            const parentNav = navigation.getParent();
                            if (parentNav) {
                                parentNav.reset({
                                    index: 0,
                                    routes: [{ name: 'Main' }],
                                });
                            } else {
                                navigation.replace('Main');
                            }
                        } else {
                            navigation.navigate('BusinessProfile');
                        }
                    }}
                >
                    <Text className="text-white font-semibold text-lg">Verify</Text>
                </TouchableOpacity>

                <TouchableOpacity className="items-center mt-6">
                    <Text className="text-primary font-medium">Resend Code</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
