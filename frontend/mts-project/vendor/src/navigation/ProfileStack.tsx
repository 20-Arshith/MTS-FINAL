import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AvailabilityScreen from '../screens/Profile/AvailabilityScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import GalleryScreen from '../screens/Profile/GalleryScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ReelsScreen from '../screens/Profile/ReelsScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile & Services', headerShadowVisible: false }} />
            <Stack.Screen name="Availability" component={AvailabilityScreen} options={{ title: 'Manage Availability', headerShadowVisible: false }} />
            <Stack.Screen name="Reels" component={ReelsScreen} options={{ title: 'Upload Reels', headerShadowVisible: false }} />
            <Stack.Screen name="Gallery" component={GalleryScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

