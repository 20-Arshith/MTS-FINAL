import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BusinessProfileScreen from '../screens/Auth/BusinessProfileScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ServiceCategoriesScreen from '../screens/Auth/ServiceCategoriesScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
            <Stack.Screen name="ServiceCategories" component={ServiceCategoriesScreen} />
        </Stack.Navigator>
    );
}
