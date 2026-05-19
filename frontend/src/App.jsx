import { Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { canAccessMenuKey, canAccessPath, MENU_ITEMS } from "./constants/menus";
import { AdminLayout } from "./components/layout/AdminLayout";
import { Button } from "./components/ui/Button";
import { LoginForm } from "./features/auth/LoginForm";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { CreateOrderPage } from "./pages/CreateOrderPage";
import { DeliveryAgentsPage } from "./pages/DeliveryAgentsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { AssignOrdersPage } from "./pages/AssignOrdersPage";
import { OrderMovementPage } from "./pages/OrderMovementPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { CustomerOrderHistoryPage } from "./pages/CustomerOrderHistoryPage";
import { OverviewPage } from "./pages/OverviewPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import { ItemsPage } from "./pages/ItemsPage";
import { CustomerItemPricesPage } from "./pages/CustomerItemPricesPage";
import { ProducersPage } from "./pages/ProducersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ProvincesPage } from "./pages/ProvincesPage";
import { CustomersByDepotPage } from "./pages/CustomersByDepotPage";
import { TrackingCustomerLocationPage } from "./pages/TrackingCustomerLocationPage";
import { DepotsPage } from "./pages/DepotsPage";
import { BorrowedMaterialsPage } from "./pages/BorrowedMaterialsPage";
import { UsersPage } from "./pages/UsersPage";
import "./App.css";

function App() {
  const { t } = useTranslation();
  const {
    auth,
    token,
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
    newOrder,
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
    setNewOrder,
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
    submitOrder,
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
    submitOrderMovement,
    submitOrderDeliveryAssignment,
    submitSendOrderToFactory,
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
    roleMenusByRole,
    submitUser,
    submitUserUpdate,
    submitUserDelete,
    submitRoleMenus,
    logout,
  } = useAdminDashboard();
  const isAllowedAdminPanelRole = user?.role === "Admin" || user?.role === "Owner";

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
                defaultValue: "Only Admin or Owner accounts can access the Admin Panel. Depot users, please use the mobile app.",
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

  const firstAllowedPath = (() => {
    const first = MENU_ITEMS.find((item) => canAccessMenuKey(user, item.key));
    return first?.path || null;
  })();

  const renderDeniedRoute = () => {
    if (firstAllowedPath) return <Navigate to={firstAllowedPath} replace />;
    return (
      <section className="panel">
        <div className="panel-header">
          <h3 style={{ margin: 0 }}>
            {t("accessDenied.title", { defaultValue: "Access Restricted" })}
          </h3>
        </div>
        <p style={{ margin: "0 0 16px", color: "var(--text-muted)" }}>
          {t("accessDenied.message", {
            defaultValue: "Only Admin or Owner accounts can access the Admin Panel. Depot users, please use the mobile app.",
          })}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" onClick={() => logout()}>
            {t("accessDenied.ok", { defaultValue: "OK" })}
          </Button>
        </div>
      </section>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={firstAllowedPath || "/overview"} replace />} />
      <Route
        path="/overview"
        element={withLayout(
          canAccessPath(user, "/overview") ? (
            <OverviewPage summary={summary} statuses={statuses} />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/create-order"
        element={withLayout(
          canAccessPath(user, "/create-order") ? (
            <CreateOrderPage
              user={user}
              customers={customers}
              items={items}
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              onCreateOrder={submitOrder}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/catalogs"
        element={withLayout(
          canAccessPath(user, "/catalogs") ? (
            <CatalogsPage
              newCatalog={newCatalog}
              setNewCatalog={setNewCatalog}
              onCreateCatalog={submitCatalog}
              onUpdateCatalog={submitCatalogUpdate}
              onDeleteCatalog={submitCatalogDelete}
              catalogs={catalogs}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/items"
        element={withLayout(
          canAccessPath(user, "/items") ? (
            <ItemsPage
              catalogs={catalogs}
              items={items}
              newItem={newItem}
              setNewItem={setNewItem}
              onCreateItem={submitItem}
              onUpdateItem={submitItemUpdate}
              onDeleteItem={submitItemDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/customer-item-prices"
        element={withLayout(
          canAccessPath(user, "/customer-item-prices") ? (
            <CustomerItemPricesPage
              customers={customers}
              depots={depots}
              items={items}
              customerItemPrices={customerItemPrices}
              depotItemPrices={depotItemPrices}
              onSaveCustomerPrice={submitCustomerItemPrice}
              onDeleteCustomerPrice={submitCustomerItemPriceDelete}
              onSaveDepotPrice={submitDepotItemPrice}
              onDeleteDepotPrice={submitDepotItemPriceDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/customers"
        element={withLayout(
          canAccessPath(user, "/customers") ? (
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
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/provinces"
        element={withLayout(
          canAccessPath(user, "/provinces") ? (
            <ProvincesPage
              provinces={provinces}
              newProvince={newProvince}
              setNewProvince={setNewProvince}
              onCreateProvince={submitProvince}
              onUpdateProvince={submitProvinceUpdate}
              onDeleteProvince={submitProvinceDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/tracking-customer-location"
        element={withLayout(
          canAccessPath(user, "/tracking-customer-location") ? (
            <TrackingCustomerLocationPage customers={customers} token={token} userRole={user?.role || ""} />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/depots"
        element={withLayout(
          canAccessPath(user, "/depots") ? (
            <DepotsPage
              depots={depots}
              users={users}
              user={user}
              newDepot={newDepot}
              setNewDepot={setNewDepot}
              onCreateDepot={submitDepot}
              onUpdateDepot={submitDepotUpdate}
              onDeleteDepot={submitDepotDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/customers-by-depot"
        element={withLayout(
          canAccessPath(user, "/customers-by-depot") ? (
            <CustomersByDepotPage depots={depots} customers={customers} />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/borrowed-materials"
        element={withLayout(
          canAccessPath(user, "/borrowed-materials") ? (
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
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/producers"
        element={withLayout(
          canAccessPath(user, "/producers") ? (
            <ProducersPage
              producers={producers}
              newProducer={newProducer}
              setNewProducer={setNewProducer}
              onCreateProducer={submitProducer}
              onUpdateProducer={submitProducerUpdate}
              onDeleteProducer={submitProducerDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/delivery-agents"
        element={withLayout(
          canAccessPath(user, "/delivery-agents") ? (
            <DeliveryAgentsPage
              deliveryAgents={deliveryAgents}
              newDelivery={newDelivery}
              setNewDelivery={setNewDelivery}
              onCreateDelivery={submitDelivery}
              onUpdateDelivery={submitDeliveryUpdate}
              onDeleteDelivery={submitDeliveryDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/users"
        element={withLayout(
          user?.role === "Admin" && canAccessPath(user, "/users") ? (
            <UsersPage
              users={users}
              customers={customers}
              deliveryAgents={deliveryAgents}
              currentUser={user}
              newUser={newUser}
              setNewUser={setNewUser}
              onCreateUser={submitUser}
              onUpdateUser={submitUserUpdate}
              onDeleteUser={submitUserDelete}
              roleMenusByRole={roleMenusByRole}
              onSaveRoleMenus={submitRoleMenus}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/orders"
        element={withLayout(
          canAccessPath(user, "/orders") ? (
            <OrdersPage orders={orders} deliveryAgents={deliveryAgents} />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/assign-orders"
        element={withLayout(
          (user?.role === "Admin" || user?.role === "Owner") && canAccessPath(user, "/assign-orders") ? (
            <AssignOrdersPage
              orders={orders}
              deliveryAgents={deliveryAgents}
              onAssignDelivery={submitOrderDeliveryAssignment}
              onSubmitToFactory={submitSendOrderToFactory}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/order-movement"
        element={withLayout(
          canAccessPath(user, "/order-movement") ? (
            <OrderMovementPage
              orders={orders}
              statuses={statuses}
              onMoveStatus={submitOrderMovement}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/payments"
        element={withLayout(
          canAccessPath(user, "/payments") ? (
            <PaymentsPage paymentTotals={paymentTotals} />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/customer-order-history"
        element={withLayout(
          canAccessPath(user, "/customer-order-history") ? (
            <CustomerOrderHistoryPage customers={customers} orders={orders} />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route path="/create" element={<Navigate to="/create-order" replace />} />
      <Route path="*" element={<Navigate to={firstAllowedPath || "/overview"} replace />} />
    </Routes>
  );
}

export default App;
