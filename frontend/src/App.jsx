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
import { OverviewPage } from "./pages/OverviewPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import { ItemsPage } from "./pages/ItemsPage";
import { CustomerItemPricesPage } from "./pages/CustomerItemPricesPage";
import { AddressesPage } from "./pages/AddressesPage";
import { ProducersPage } from "./pages/ProducersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomersByDepotPage } from "./pages/CustomersByDepotPage";
import { DepotsPage } from "./pages/DepotsPage";
import { BorrowedMaterialsPage } from "./pages/BorrowedMaterialsPage";
import { UsersPage } from "./pages/UsersPage";
import { OrderGroupsPage } from "./pages/OrderGroupsPage";
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
    depots,
    customerUsers,
    addresses,
    producers,
    deliveryAgents,
    orderGroups,
    catalogs,
    items,
    customerItemPrices,
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
    newDepot,
    newCatalog,
    newOrderGroup,
    newAddress,
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
    setNewDepot,
    setNewCatalog,
    setNewOrderGroup,
    setNewAddress,
    setNewItem,
    setNewDelivery,
    setNewBorrowMaterial,
    setNewCustomerBorrow,
    login,
    submitOrder,
    submitCatalog,
    submitCatalogUpdate,
    submitCatalogDelete,
    submitOrderGroupCreate,
    submitOrderGroupUpdate,
    submitOrderGroupDelete,
    submitAddress,
    submitAddressUpdate,
    submitAddressDelete,
    submitItem,
    submitItemUpdate,
    submitItemDelete,
    submitCustomerItemPrice,
    submitCustomerItemPriceDelete,
    submitProducer,
    submitProducerUpdate,
    submitProducerDelete,
    submitCustomer,
    submitCustomerUpdate,
    submitCustomerDelete,
    submitDepot,
    submitDepotUpdate,
    submitDepotDelete,
    submitDelivery,
    submitDeliveryUpdate,
    submitDeliveryDelete,
    submitDeliveryConfirmation,
    submitOrderStatus,
    submitOrderMovement,
    submitOrderDeliveryAssignment,
    submitOrderGroupAssignment,
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
  const isAllowedAdminPanelRole = user?.role === "Admin" || user?.role === "Owner" || user?.role === "Depot";

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
                defaultValue: "Your account role cannot access the Admin Panel. Please sign in with an Admin, Owner, or Depot account.",
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
            defaultValue: "Your account role cannot access the Admin Panel. Please sign in with an Admin, Owner, or Depot account.",
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
              customerUsers={customerUsers}
              addresses={addresses}
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
              items={items}
              customerItemPrices={customerItemPrices}
              onSave={submitCustomerItemPrice}
              onDelete={submitCustomerItemPriceDelete}
            />
          ) : (
            renderDeniedRoute()
          ),
        )}
      />
      <Route
        path="/addresses"
        element={withLayout(
          canAccessPath(user, "/addresses") ? (
            <AddressesPage
              addresses={addresses}
              newAddress={newAddress}
              setNewAddress={setNewAddress}
              onCreateAddress={submitAddress}
              onUpdateAddress={submitAddressUpdate}
              onDeleteAddress={submitAddressDelete}
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
              customerUsers={customerUsers}
              addresses={addresses}
              depots={depots}
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
        path="/order-groups"
        element={withLayout(
          canAccessPath(user, "/order-groups") ? (
            <OrderGroupsPage
              orderGroups={orderGroups}
              newOrderGroup={newOrderGroup}
              setNewOrderGroup={setNewOrderGroup}
              onCreateOrderGroup={submitOrderGroupCreate}
              onUpdateOrderGroup={submitOrderGroupUpdate}
              onDeleteOrderGroup={submitOrderGroupDelete}
            />
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
              orderGroups={orderGroups}
              onAssignDelivery={submitOrderDeliveryAssignment}
              onAssignOrderGroup={submitOrderGroupAssignment}
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
      <Route path="/create" element={<Navigate to="/create-order" replace />} />
      <Route path="*" element={<Navigate to={firstAllowedPath || "/overview"} replace />} />
    </Routes>
  );
}

export default App;
