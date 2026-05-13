import React from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors } from "../../theme";

export default function AppIcon({ name, size = 20, color = colors.textPrimary, style }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
}
