import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../theme/colors';
import { MyListsScreen } from '../screens/MyListsScreen';
import { CreateListScreen } from '../screens/CreateListScreen';
import { JoinListScreen } from '../screens/JoinListScreen';
import { ListDetailScreen } from '../screens/ListDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// --- Param list types ---

export type ListsStackParamList = {
  MyLists: undefined;
  ListDetail: { listId: string; listName: string };
  CreateList: undefined;
  JoinList: undefined;
};

export type RootTabParamList = {
  ListsTab: undefined;
  SettingsTab: undefined;
};

// --- Navigators ---

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<ListsStackParamList>();

function ListsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MyLists" component={MyListsScreen} options={{ title: 'My Lists' }} />
      <Stack.Screen name="CreateList" component={CreateListScreen} options={{ title: 'New List' }} />
      <Stack.Screen name="JoinList" component={JoinListScreen} options={{ title: 'Join a List' }} />
      <Stack.Screen
        name="ListDetail"
        component={ListDetailScreen}
        options={({ route }) => ({ title: route.params.listName })}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        <Tab.Screen
          name="ListsTab"
          component={ListsStack}
          options={{
            tabBarLabel: 'My Lists',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>☑</Text>,
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
