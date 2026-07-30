import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { hasAdminPanelAccess, hasPortalAccess } from "./constants/menus";
import { AdminLayout } from "./components/layout/AdminLayout";
import { Button } from "./components/ui/Button";
import { DashboardBootstrapScreen } from "./components/ui/DashboardBootstrapScreen";
import { LoginForm } from "./features/auth/LoginForm";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { PortalApp } from "./portal";
import { GetAppPage } from "./portal/pages/GetAppPage";
import { shouldShowStorePrompt } from "./utils/storeLinks";
import { DeliveryAgentsPage } from "./pages/DeliveryAgentsPage";
import { OrdersAllPage, OrdersByDeliveryPage, OrdersByProvincePage } from "./pages/orders";
import { AssignOrdersPage } from "./pages/AssignOrdersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { CustomerOrderHistoryPage } from "./pages/CustomerOrderHistoryPage";
import { OverviewPage } from "./pages/OverviewPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import { ItemsPage } from "./pages/ItemsPage";
import { CustomerItemPricesPage } from "./pages/CustomerItemPricesPage";
import { DepotItemPricesPage } from "./pages/DepotItemPricesPage";
import { ProducersPage } from "./pages/ProducersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ProvincesPage } from "./pages/ProvincesPage";
import { CustomersByDepotPage } from "./pages/CustomersByDepotPage";
import { TrackingCustomerLocationPage } from "./pages/TrackingCustomerLocationPage";
import { DepotsPage } from "./pages/DepotsPage";
import { BorrowedMaterialsPage } from "./pages/BorrowedMaterialsPage";
import { UsersPage } from "./pages/UsersPage";
import { SpecialDayPage } from "./pages/SpecialDayPage";
import "./App.css";

function App() {
  const { t } = useTranslation();
  const {
    auth,
    token,
    isDashboardBootstrapping,
    isOverviewRefreshing,
    overviewLastUpdatedAt,
    user,
    summary,
    statuses,
    orders,
    customers,
    provinces,
    depots,
    producers,
    deliveryAgents,
    catalogs,
    items,
    customerItemPrices,
    depotItemPrices,
    borrowMaterials,
    customerBorrowedMaterials,
    borrowMaterialOrderLoans,
    borrowMaterialMonthlySchedules,
    paymentTotals,
    flash,
    dismissFlash,
    newProducer,
    newCustomer,
    newProvince,
    newDepot,
    newCatalog,
    newItem,
    newDelivery,
    newBorrowMaterial,
    newCustomerBorrow,
    newOrderLoan,
    setNewOrderLoan,
    newMonthlySchedule,
    setNewMonthlySchedule,
    setAuth,
    setNewProducer,
    setNewCustomer,
    setNewProvince,
    setNewDepot,
    setNewCatalog,
    setNewItem,
    setNewDelivery,
    setNewBorrowMaterial,
    setNewCustomerBorrow,
    login,
    submitCatalog,
    submitCatalogUpdate,
    submitCatalogDelete,
    submitItem,
    submitItemUpdate,
    submitItemDelete,
    submitCustomerItemPrice,
    submitCustomerItemPriceDelete,
    submitDepotItemPrice,
    submitDepotItemPriceDelete,
    submitProducer,
    submitProducerUpdate,
    submitProducerDelete,
    submitCustomer,
    submitCustomerUpdate,
    submitCustomerDelete,
    submitProvince,
    submitProvinceUpdate,
    submitProvinceDelete,
    submitDepot,
    submitDepotUpdate,
    submitDepotDelete,
    submitDelivery,
    submitDeliveryUpdate,
    submitDeliveryDelete,
    submitOrderDeliveryAssignment,
    submitSendOrderToFactory,
    submitOrderLossQty,
    submitManualPayment,
    loadUnpaidMasterOrders,
    submitBorrowMaterial,
    submitBorrowMaterialUpdate,
    submitBorrowMaterialDelete,
    submitCustomerBorrow,
    submitCustomerBorrowDelete,
    submitBorrowMaterialOrderLoan,
    submitBorrowMaterialOrderLoanDelete,
    submitBorrowMaterialMonthlySchedule,
    submitBorrowMaterialMonthlyScheduleDelete,
    loadBorrowMaterialMonthlyScheduleDetail,
    submitBorrowMaterialMonthlyInstallmentStatusUpdate,
    users,
    newUser,
    setNewUser,
    roles,
    submitUser,
    submitUserUpdate,
    submitUserDelete,
    submitUserResetPassword,
    logout,
    refresh,
  } = useAdminDashboard();
  const isAllowedAdminPanelRole = hasAdminPanelAccess(user);
  const isPortalRole = hasPortalAccess(user);

  if (!token) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <LoginForm
              auth={auth}
              setAuth={setAuth}
              onSubmit={login}
              message={flash?.text ?? ""}
              messageVariant={flash?.variant}
            />
          }
        />
      </Routes>
    );
  }

  if (isDashboardBootstrapping) {
    return <DashboardBootstrapScreen />;
  }

  if (user && isPortalRole) {
    if (shouldShowStorePrompt()) {
      return <GetAppPage user={user} onLogout={logout} />;
    }

    return (
      <PortalApp
        token={token}
        user={user}
        logout={logout}
        flash={flash}
        dismissFlash={dismissFlash}
      />
    );
  }

  if (user && !isAllowedAdminPanelRole) {
    return (
      <div className="auth-shell" style={{ position: "relative" }}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
            padding: 16,
          }}
        >
          <section
            className="panel"
            style={{
              width: "100%",
              maxWidth: 460,
              borderRadius: 16,
              boxShadow: "0 24px 48px rgba(15, 23, 42, 0.25)",
            }}
          >
            <div className="panel-header">
              <h3 style={{ margin: 0 }}>
                {t("accessDenied.title", { defaultValue: "Access Restricted" })}
              </h3>
            </div>
            <p style={{ margin: "0 0 16px", color: "var(--text-muted)" }}>
              {t("accessDenied.message", {
                defaultValue: "Only Admin and Owner accounts can access the admin panel.",
              })}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" onClick={() => logout()}>
                {t("accessDenied.ok", { defaultValue: "OK" })}
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const withLayout = (page) => (
    <AdminLayout user={user} onLogout={logout} flash={flash} onFlashDismiss={dismissFlash}>
      {page}
    </AdminLayout>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route
        path="/overview"
        element={withLayout(
          <OverviewPage
            summary={summary}
            statuses={statuses}
            isRefreshing={isOverviewRefreshing}
            lastUpdatedAt={overviewLastUpdatedAt}
            onRefresh={refresh}
          />,
        )}
      />
      <Route
        path="/catalogs"
        element={withLayout(
          <CatalogsPage
            newCatalog={newCatalog}
            setNewCatalog={setNewCatalog}
            onCreateCatalog={submitCatalog}
            onUpdateCatalog={submitCatalogUpdate}
            onDeleteCatalog={submitCatalogDelete}
            catalogs={catalogs}
          />,
        )}
      />
      <Route
        path="/items"
        element={withLayout(
          <ItemsPage
            catalogs={catalogs}
            items={items}
            newItem={newItem}
            setNewItem={setNewItem}
            onCreateItem={submitItem}
            onUpdateItem={submitItemUpdate}
            onDeleteItem={submitItemDelete}
          />,
        )}
      />
      <Route
        path="/customer-item-prices"
        element={withLayout(
          <CustomerItemPricesPage
              customers={customers}
              items={items}
              customerItemPrices={customerItemPrices}
              onSaveCustomerPrice={submitCustomerItemPrice}
              onDeleteCustomerPrice={submitCustomerItemPriceDelete}
            />
        )}
      />
      <Route
        path="/depot-item-prices"
        element={withLayout(
          <DepotItemPricesPage
              depots={depots}
              items={items}
              depotItemPrices={depotItemPrices}
              onSaveDepotPrice={submitDepotItemPrice}
              onDeleteDepotPrice={submitDepotItemPriceDelete}
            />
        )}
      />
      <Route
        path="/customers"
        element={withLayout(
          <CustomersPage
              customers={customers}
              depots={depots}
              provinces={provinces}
              newCustomer={newCustomer}
              setNewCustomer={setNewCustomer}
              onCreateCustomer={submitCustomer}
              onUpdateCustomer={submitCustomerUpdate}
              onDeleteCustomer={submitCustomerDelete}
            />
        )}
      />
      <Route
        path="/provinces"
        element={withLayout(
          <ProvincesPage
              provinces={provinces}
              newProvince={newProvince}
              setNewProvince={setNewProvince}
              onCreateProvince={submitProvince}
              onUpdateProvince={submitProvinceUpdate}
              onDeleteProvince={submitProvinceDelete}
            />
        )}
      />
      <Route
        path="/tracking-customer-location"
        element={withLayout(
          <TrackingCustomerLocationPage customers={customers} orders={orders} token={token} />
        )}
      />
      <Route
        path="/depots"
        element={withLayout(
          <DepotsPage
              depots={depots}
              user={user}
              newDepot={newDepot}
              setNewDepot={setNewDepot}
              onCreateDepot={submitDepot}
              onUpdateDepot={submitDepotUpdate}
              onDeleteDepot={submitDepotDelete}
            />
        )}
      />
      <Route
        path="/customers-by-depot"
        element={withLayout(
          <CustomersByDepotPage depots={depots} customers={customers} />
        )}
      />
      <Route
        path="/borrowed-materials"
        element={withLayout(
          <BorrowedMaterialsPage
              user={user}
              customers={customers}
              orders={orders}
              borrowMaterials={borrowMaterials}
              customerBorrowedMaterials={customerBorrowedMaterials}
              borrowMaterialOrderLoans={borrowMaterialOrderLoans}
              borrowMaterialMonthlySchedules={borrowMaterialMonthlySchedules}
              newBorrowMaterial={newBorrowMaterial}
              setNewBorrowMaterial={setNewBorrowMaterial}
              newCustomerBorrow={newCustomerBorrow}
              setNewCustomerBorrow={setNewCustomerBorrow}
              newOrderLoan={newOrderLoan}
              setNewOrderLoan={setNewOrderLoan}
              newMonthlySchedule={newMonthlySchedule}
              setNewMonthlySchedule={setNewMonthlySchedule}
              onCreateBorrowMaterial={submitBorrowMaterial}
              onUpdateBorrowMaterial={submitBorrowMaterialUpdate}
              onDeleteBorrowMaterial={submitBorrowMaterialDelete}
              onSubmitCustomerBorrow={submitCustomerBorrow}
              onDeleteCustomerBorrow={submitCustomerBorrowDelete}
              onSubmitBorrowMaterialOrderLoan={submitBorrowMaterialOrderLoan}
              onDeleteBorrowMaterialOrderLoan={submitBorrowMaterialOrderLoanDelete}
              onSubmitBorrowMaterialMonthlySchedule={submitBorrowMaterialMonthlySchedule}
              onDeleteBorrowMaterialMonthlySchedule={submitBorrowMaterialMonthlyScheduleDelete}
              onLoadBorrowMaterialMonthlyScheduleDetail={loadBorrowMaterialMonthlyScheduleDetail}
              onUpdateBorrowMaterialMonthlyInstallmentStatus={submitBorrowMaterialMonthlyInstallmentStatusUpdate}
            />
        )}
      />
      <Route
        path="/producers"
        element={withLayout(
          <ProducersPage
              producers={producers}
              newProducer={newProducer}
              setNewProducer={setNewProducer}
              onCreateProducer={submitProducer}
              onUpdateProducer={submitProducerUpdate}
              onDeleteProducer={submitProducerDelete}
            />
        )}
      />
      <Route
        path="/delivery-agents"
        element={withLayout(
          <DeliveryAgentsPage
              deliveryAgents={deliveryAgents}
              newDelivery={newDelivery}
              setNewDelivery={setNewDelivery}
              onCreateDelivery={submitDelivery}
              onUpdateDelivery={submitDeliveryUpdate}
              onDeleteDelivery={submitDeliveryDelete}
            />
        )}
      />
      <Route
        path="/users"
        element={withLayout(
          <UsersPage
              users={users}
              customers={customers}
              deliveryAgents={deliveryAgents}
              depots={depots}
              currentUser={user}
              newUser={newUser}
              setNewUser={setNewUser}
              onCreateUser={submitUser}
              onUpdateUser={submitUserUpdate}
              onDeleteUser={submitUserDelete}
              onResetUserPassword={submitUserResetPassword}
              roles={roles}
            />
        )}
      />
      <Route
        path="/special-day"
        element={withLayout(
          <SpecialDayPage token={token} items={items} deliveryAgents={deliveryAgents} />,
        )}
      />
      <Route
        path="/orders"
        element={withLayout(
          <OrdersAllPage
            orders={orders}
            statuses={statuses}
            onUpdateLoss={submitOrderLossQty}
          />
        )}
      />
      <Route
        path="/orders/by-province"
        element={withLayout(
          <OrdersByProvincePage orders={orders} />
        )}
      />
      <Route
        path="/orders/by-delivery"
        element={withLayout(
          <OrdersByDeliveryPage orders={orders} deliveryAgents={deliveryAgents} />
        )}
      />
      <Route
        path="/prepare-group-order"
        element={<Navigate to="/assign-orders" replace />}
      />
      <Route
        path="/assign-orders"
        element={withLayout(
          <AssignOrdersPage
              orders={orders}
              deliveryAgents={deliveryAgents}
              onAssignDelivery={submitOrderDeliveryAssignment}
              onSubmitToFactory={submitSendOrderToFactory}
            />
        )}
      />
      <Route
        path="/payments"
        element={withLayout(
          <PaymentsPage
            paymentTotals={paymentTotals}
            onRecordManualPayment={submitManualPayment}
            onLoadUnpaidOrders={loadUnpaidMasterOrders}
          />
        )}
      />
      <Route
        path="/customer-order-history"
        element={withLayout(
          <CustomerOrderHistoryPage customers={customers} orders={orders} />
        )}
      />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default App;
