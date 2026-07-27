import { Navigate, Route, Routes } from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext";
import { DepotBatchCartProvider, useDepotBatchCart } from "./context/DepotBatchCartContext";
import { PortalLayout } from "./components/PortalLayout";
import { portalHomePath } from "./constants/menus";
import { CustomerItemsPage } from "./pages/CustomerItemsPage";
import { CustomerCartPage } from "./pages/CustomerCartPage";
import { CustomerOrdersPage } from "./pages/CustomerOrdersPage";
import { DepotPrepareBatchPage } from "./pages/DepotPrepareBatchPage";
import { DepotCartPage } from "./pages/DepotCartPage";
import { DepotOrdersPage } from "./pages/DepotOrdersPage";
import { OrderPaymentPage } from "./pages/OrderPaymentPage";
import { BatchOrderPaymentPage } from "./pages/BatchOrderPaymentPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { ProfilePage } from "./pages/ProfilePage";

function PortalLayoutWithBadge({ user, flash, onFlashDismiss }) {
  const isDepot = user?.role === "Depot";
  const customerCart = useCart();
  const depotCart = useDepotBatchCart();
  const cartBadge = isDepot ? depotCart.totalLines : customerCart.totalItems;

  return (
    <PortalLayout
      user={user}
      flash={flash}
      onFlashDismiss={onFlashDismiss}
      cartBadge={cartBadge}
    />
  );
}

function PortalRoutes({ token, user, logout, flash, dismissFlash }) {
  const isDepot = user?.role === "Depot";

  return (
    <Routes>
      <Route
        element={
          <PortalLayoutWithBadge
            user={user}
            flash={flash}
            onFlashDismiss={dismissFlash}
          />
        }
      >
        {isDepot ? (
          <>
            <Route index element={<Navigate to="prepare-batch" replace />} />
            <Route path="prepare-batch" element={<DepotPrepareBatchPage token={token} user={user} />} />
            <Route path="depot-cart" element={<DepotCartPage token={token} />} />
            <Route path="depot-orders" element={<DepotOrdersPage token={token} />} />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="items" replace />} />
            <Route path="items" element={<CustomerItemsPage token={token} />} />
            <Route path="cart" element={<CustomerCartPage token={token} user={user} />} />
            <Route path="orders" element={<CustomerOrdersPage token={token} />} />
          </>
        )}
        <Route path="profile" element={<ProfilePage user={user} onLogout={logout} />} />
        <Route path="pay/:orderId" element={<OrderPaymentPage token={token} />} />
        <Route path="pay-batch/:masterOrderId" element={<BatchOrderPaymentPage token={token} />} />
        <Route
          path="payment-result/:paymentId"
          element={<PaymentResultPage token={token} user={user} />}
        />
        <Route
          path="*"
          element={<Navigate to={isDepot ? "prepare-batch" : "items"} replace />}
        />
      </Route>
    </Routes>
  );
}

/**
 * Temporary Customer/Depot web portal — UI/menu mirrored from mobile-app.
 */
export function PortalApp({ token, user, logout, flash, dismissFlash }) {
  const home = portalHomePath(user);

  return (
    <CartProvider>
      <DepotBatchCartProvider>
        <Routes>
          <Route
            path="/portal/*"
            element={
              <PortalRoutes
                token={token}
                user={user}
                logout={logout}
                flash={flash}
                dismissFlash={dismissFlash}
              />
            }
          />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </DepotBatchCartProvider>
    </CartProvider>
  );
}
