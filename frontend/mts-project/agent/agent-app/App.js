import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import AgentRegisterScreen from './src/screens/AgentRegisterScreen';
import SplashScreen from './src/screens/SplashScreen';
import VendorRegistrationScreen from './src/screens/VendorRegistrationScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import HelpAndSupportScreen from './src/screens/HelpAndSupportScreen';
import TabNavigator from './src/navigation/TabNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Splash"
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#f8fafc' } // Slate-50 background global
                    }}
                >
                    {/* Auth Flow */}
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="AgentRegister" component={AgentRegisterScreen} />

                    {/* Main App Flow */}
                    <Stack.Screen name="MainTabs" component={TabNavigator} />
                    <Stack.Screen name="VendorRegistration" component={VendorRegistrationScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
                </Stack.Navigator>
                <StatusBar style="auto" />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
