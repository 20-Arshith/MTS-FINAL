import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddServiceScreen from '../screens/Dashboard/AddServiceScreen';
import ChatSettingsScreen from '../screens/Dashboard/ChatSettingsScreen';
import NotificationsScreen from '../screens/Dashboard/NotificationsScreen';
import TimeSlotsScreen from '../screens/Dashboard/TimeSlotsScreen';
import UploadReelsScreen from '../screens/Dashboard/UploadReelsScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export default function MainStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={MainTabNavigator} />
            <Stack.Screen name="AddService" component={AddServiceScreen} />
            <Stack.Screen name="TimeSlots" component={TimeSlotsScreen} />
            <Stack.Screen name="UploadReels" component={UploadReelsScreen} />
            <Stack.Screen name="ChatSettings" component={ChatSettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
    );
}
