import { Redirect } from 'expo-router';

export default function Index() {
  // This will redirect to the auth flow or the tabs flow depending on authentication
  return <Redirect href="/(auth)/login" />;
} 