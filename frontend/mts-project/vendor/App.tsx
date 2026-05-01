import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';
import AppNavigator from './src/navigation/AppNavigator';
import './src/styles/global.css';

export default function App() {
    return (
        <View style={{ flex: 1 }}>
            <AppNavigator />
            <StatusBar style="auto" />
        </View>
    );
}

registerRootComponent(App);
