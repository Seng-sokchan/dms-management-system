import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import AdminMenuGridScreen from "../screens/admin/AdminMenuGridScreen";
import AdminOverviewScreen from "../screens/admin/AdminOverviewScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminAssignOrdersScreen from "../screens/admin/AdminAssignOrdersScreen";
import AdminCustomersScreen from "../screens/admin/AdminCustomersScreen";
import AdminCatalogsScreen from "../screens/admin/AdminCatalogsScreen";
import AdminItemsScreen from "../screens/admin/AdminItemsScreen";
import AdminSimpleCrudScreen from "../screens/admin/AdminSimpleCrudScreen";
import AdminPriceListScreen from "../screens/admin/AdminPriceListScreen";
import AdminPaymentsScreen from "../screens/admin/AdminPaymentsScreen";
import AdminCustomerOrderHistoryScreen from "../screens/admin/AdminCustomerOrderHistoryScreen";
import AdminCustomersByDepotScreen from "../screens/admin/AdminCustomersByDepotScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminSpecialDayScreen from "../screens/admin/AdminSpecialDayScreen";
import AdminBorrowedMaterialsScreen from "../screens/admin/AdminBorrowedMaterialsScreen";
import AdminTrackingScreen from "../screens/admin/AdminTrackingScreen";
import ComingSoonScreen from "../screens/admin/ComingSoonScreen";
import ProfileNavigator, { LEGAL_DOCUMENT_ROUTE } from "./ProfileNavigator";
import LegalDocumentScreen from "../screens/LegalDocumentScreen";
import { useStackScreenOptions } from "./screenOptions";

const Stack = createNativeStackNavigator();

function ProvincesScreen(props) {
  return <AdminSimpleCrudScreen {...props} route={{ ...props.route, params: { entityKey: "provinces" } }} />;
}
function DepotsScreen(props) {
  return <AdminSimpleCrudScreen {...props} route={{ ...props.route, params: { entityKey: "depots" } }} />;
}
function ProducersScreen(props) {
  return <AdminSimpleCrudScreen {...props} route={{ ...props.route, params: { entityKey: "producers" } }} />;
}
function DeliveryAgentsScreen(props) {
  return <AdminSimpleCrudScreen {...props} route={{ ...props.route, params: { entityKey: "deliveryAgents" } }} />;
}
function CustomerPricesScreen(props) {
  return <AdminPriceListScreen {...props} route={{ ...props.route, params: { mode: "customer" } }} />;
}
function DepotPricesScreen(props) {
  return <AdminPriceListScreen {...props} route={{ ...props.route, params: { mode: "depot" } }} />;
}

export default function AdminRootNavigator() {
  const { t } = useTranslation();
  const stackScreenOptions = useStackScreenOptions();

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdminMenu" component={AdminMenuGridScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} options={{ title: t("admin.nav.overview") }} />
      <Stack.Screen name="AdminCatalogs" component={AdminCatalogsScreen} options={{ title: t("admin.nav.catalogs") }} />
      <Stack.Screen name="AdminItems" component={AdminItemsScreen} options={{ title: t("admin.nav.items") }} />
      <Stack.Screen name="AdminCustomerPrices" component={CustomerPricesScreen} options={{ title: t("admin.nav.customerItemPrices") }} />
      <Stack.Screen name="AdminDepotPrices" component={DepotPricesScreen} options={{ title: t("admin.nav.depotItemPrices") }} />
      <Stack.Screen name="AdminCustomers" component={AdminCustomersScreen} options={{ title: t("admin.nav.customers") }} />
      <Stack.Screen name="AdminProvinces" component={ProvincesScreen} options={{ title: t("admin.nav.provinces") }} />
      <Stack.Screen name="AdminTracking" component={AdminTrackingScreen} options={{ title: t("admin.nav.trackingCustomerLocation") }} />
      <Stack.Screen name="AdminBorrowedMaterials" component={AdminBorrowedMaterialsScreen} options={{ title: t("admin.nav.borrowedMaterials") }} />
      <Stack.Screen name="AdminDepots" component={DepotsScreen} options={{ title: t("admin.nav.depots") }} />
      <Stack.Screen name="AdminCustomersByDepot" component={AdminCustomersByDepotScreen} options={{ title: t("admin.nav.customersByDepot") }} />
      <Stack.Screen name="AdminProducers" component={ProducersScreen} options={{ title: t("admin.nav.producers") }} />
      <Stack.Screen name="AdminDeliveryAgents" component={DeliveryAgentsScreen} options={{ title: t("admin.nav.deliveryAgents") }} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: t("admin.nav.orders") }} />
      <Stack.Screen name="AdminAssignOrders" component={AdminAssignOrdersScreen} options={{ title: t("admin.nav.assignOrders") }} />
      <Stack.Screen name="AdminSpecialDay" component={AdminSpecialDayScreen} options={{ title: t("admin.nav.specialDay") }} />
      <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} options={{ title: t("admin.nav.payments") }} />
      <Stack.Screen name="AdminCustomerOrderHistory" component={AdminCustomerOrderHistoryScreen} options={{ title: t("admin.nav.customerOrderHistory") }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: t("admin.nav.users") }} />
      <Stack.Screen
        name="AdminComingSoon"
        component={ComingSoonScreen}
        options={({ route }) => ({ title: route.params?.title || t("admin.comingSoon.title") })}
      />
      <Stack.Screen name="AdminProfile" component={ProfileNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name={LEGAL_DOCUMENT_ROUTE}
        component={LegalDocumentScreen}
        options={({ route }) => ({
          title: route.params?.title ?? "",
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
