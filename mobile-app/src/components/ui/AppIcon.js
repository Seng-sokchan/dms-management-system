import React from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
export default function AppIcon({ name, size = 20, color = "#111111", style }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}
