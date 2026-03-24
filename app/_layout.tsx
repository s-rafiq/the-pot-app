import { Stack } from 'expo-router';
import { PotProvider } from '../context/PotContext';

export default function RootLayout() {
  return (
    <PotProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PotProvider>
  );
}