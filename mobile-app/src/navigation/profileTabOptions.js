import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { LEGAL_DOCUMENT_ROUTE } from "./ProfileNavigator";

export function profileTabOptions({ route }, floatingTabScreenOptions, colors) {
  const nestedRoute = getFocusedRouteNameFromRoute(route);
  const hideTabBar = nestedRoute === LEGAL_DOCUMENT_ROUTE;

  if (hideTabBar) {
    return {
      tabBarStyle: { display: "none" },
      sceneContainerStyle: {
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: 0,
      },
    };
  }

  return {
    tabBarStyle: floatingTabScreenOptions.tabBarStyle,
    sceneContainerStyle: floatingTabScreenOptions.sceneContainerStyle,
  };
}
