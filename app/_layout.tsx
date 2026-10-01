import { Stack } from 'expo-router';
import { theme } from '../constants/theme';
import { PotProvider } from '../context/PotContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PotProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      </PotProvider>
    </GestureHandlerRootView>
  );
}