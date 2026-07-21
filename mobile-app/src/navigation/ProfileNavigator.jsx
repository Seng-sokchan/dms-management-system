import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/ProfileScreen";
import LegalDocumentScreen from "../screens/LegalDocumentScreen";
import { useStackScreenOptions } from "./screenOptions";

const ProfileStack = createNativeStackNavigator();

export const LEGAL_DOCUMENT_ROUTE = "LegalDocument";

export default function ProfileNavigator() {
  const stackScreenOptions = useStackScreenOptions();

  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name={LEGAL_DOCUMENT_ROUTE}
        component={LegalDocumentScreen}
        options={({ route }) => ({
          title: route.params?.title ?? "",
          headerBackTitleVisible: false,
        })}
      />
    </ProfileStack.Navigator>
  );
}
