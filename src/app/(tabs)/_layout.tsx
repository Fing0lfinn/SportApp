import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { C } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg }, animation: 'fade' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="board" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
