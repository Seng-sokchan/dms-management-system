import { Routes, Route, Navigate } from "react-router-dom";
import { canAccessPath } from "./constants/menus";
import { AdminLayout } from "./components/AdminLayout";
import { LoginForm } from "./components/LoginForm";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { CreateOrderPage } from "./pages/CreateOrderPage";
import { DeliveryAgentsPage } from "./pages/DeliveryAgentsPage";
import { TrucksPage } from "./pages/TrucksPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import { ItemsPage } from "./pages/ItemsPage";
import { ProducersPage } from "./pages/ProducersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { UsersPage } from "./pages/UsersPage";
import { UserActivityLogsPage } from "./pages/UserActivityLogsPage";
import { ConfirmOrdersPage } from "./pages/ConfirmOrdersPage";
import { OwnerPreparingPage } from "./pages/OwnerPreparingPage";
import { CustomerOrdersPage } from "./pages/CustomerOrdersPage";
import "./App.css";

function App() {
  const {
    auth,
    token,
    user,
    summary,
    statuses,
    orders,
    customers,
    customerUsers,
    addresses,
    producers,
    deliveryAgents,
    trucks,
    catalogs,
    items,
    payments,
    paymentMethods,
    orderGroups,
    flash,
    dismissFlash,
    newOrder,
    newProducer,
    newCustomer,
    newCatalog,
    newItem,
    newDelivery,
    newTruck,
    newPayment,
    setAuth,
    setNewOrder,
    setNewProducer,
    setNewCustomer,
    setNewCatalog,
    setNewItem,
    setNewDelivery,
    setNewTruck,
    setNewPayment,
    login,
    submitOrder,
    submitCatalog,
    submitCatalogUpdate,
    submitCatalogDelete,
    submitItem,
    submitItemUpdate,
    submitItemDelete,
    submitProducer,
    submitProducerUpdate,
    submitProducerDelete,
    submitCustomer,
    submitCustomerUpdate,
    submitCustomerDelete,
    submitDelivery,
    submitDeliveryUpdate,
    submitDeliveryDelete,
    submitTruck,
    submitTruckUpdate,
    submitTruckDelete,
    submitDeliveryConfirmation,
    submitOrderStatus,
    submitOrderGroupAssignment,
    submitOrderDelete,
    submitPayment,
    users,
    activityLogs,
    newUser,
    setNewUser,
    roleMenusByRole,
    submitUser,
    submitUserUpdate,
    submitUserDelete,
    submitRoleMenus,
    logout,
  } = useAdminDashboard();

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

  const withLayout = (page) => (
    <AdminLayout user={user} onLogout={logout} flash={flash} onFlashDismiss={dismissFlash}>
      {page}
    </AdminLayout>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={withLayout(<OverviewPage summary={summary} statuses={statuses} />)} />
      <Route
        path="/create-order"
        element={withLayout(
          canAccessPath(user, "/create-order") ? (
            <CreateOrderPage
              user={user}
              customers={customers}
              customerUsers={customerUsers}
              addresses={addresses}
              producers={producers}
              trucks={trucks}
              items={items}
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              onCreateOrder={submitOrder}
            />
          ) : (
            <Navigate to="/overview" replace />
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
            <Navigate to="/overview" replace />
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
            <Navigate to="/overview" replace />
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
              newCustomer={newCustomer}
              setNewCustomer={setNewCustomer}
              onCreateCustomer={submitCustomer}
              onUpdateCustomer={submitCustomerUpdate}
              onDeleteCustomer={submitCustomerDelete}
            />
          ) : (
            <Navigate to="/overview" replace />
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
            <Navigate to="/overview" replace />
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
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/trucks"
        element={withLayout(
          canAccessPath(user, "/trucks") ? (
            <TrucksPage
              trucks={trucks}
              deliveryAgents={deliveryAgents}
              newTruck={newTruck}
              setNewTruck={setNewTruck}
              onCreateTruck={submitTruck}
              onUpdateTruck={submitTruckUpdate}
              onDeleteTruck={submitTruckDelete}
            />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/users"
        element={withLayout(
          user?.role === "Admin" && canAccessPath(user, "/users") ? (
            <UsersPage
              token={token}
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
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/activity-logs"
        element={withLayout(
          user?.role === "Admin" && canAccessPath(user, "/activity-logs") ? (
            <UserActivityLogsPage activityLogs={activityLogs} />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/orders"
        element={withLayout(
          user?.role === "Logistics" || user?.role === "Delivery" ? (
            <Navigate to="/confirm-orders" replace />
          ) : canAccessPath(user, "/orders") ? (
            <OrdersPage
              orders={orders}
              statuses={statuses}
              onUpdateStatus={submitOrderStatus}
              onConfirmDelivery={submitDeliveryConfirmation}
            />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/customer-orders"
        element={withLayout(
          (user?.role === "Owner" || user?.role === "Admin") && canAccessPath(user, "/customer-orders") ? (
            <CustomerOrdersPage
              orders={orders}
              onDeleteOrder={submitOrderDelete}
              onConfirmOrder={(orderId) => submitOrderStatus(orderId, "OWNER_PREPARING")}
            />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/owner-preparing"
        element={withLayout(
          (user?.role === "Owner" || user?.role === "Admin") && canAccessPath(user, "/owner-preparing") ? (
            <OwnerPreparingPage
              orders={orders}
              orderGroups={orderGroups}
              onAssignOrderGroup={submitOrderGroupAssignment}
              onConfirmToLogistics={(orderId) => submitOrderStatus(orderId, "SENT_TO_LOGISTICS_SUPPLIER")}
            />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/confirm-orders"
        element={withLayout(
          canAccessPath(user, "/confirm-orders") ? (
            <ConfirmOrdersPage
              orders={orders}
              statuses={statuses}
              onUpdateStatus={submitOrderStatus}
              onConfirmDelivery={submitDeliveryConfirmation}
            />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route
        path="/payments"
        element={withLayout(
          canAccessPath(user, "/payments") ? (
            <PaymentsPage
              token={token}
              user={user}
              orders={orders}
              payments={payments}
              paymentMethods={paymentMethods}
              newPayment={newPayment}
              setNewPayment={setNewPayment}
              onSubmitPayment={submitPayment}
            />
          ) : (
            <Navigate to="/overview" replace />
          ),
        )}
      />
      <Route path="/create" element={<Navigate to="/create-order" replace />} />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default App;
