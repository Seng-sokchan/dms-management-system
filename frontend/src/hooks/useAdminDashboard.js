import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  confirmDelivery as confirmDeliveryRequest,
  updateOrderLossQty as updateOrderLossQtyRequest,
  createManualPayment as createManualPaymentRequest,
  fetchUnpaidMasterOrders,
  createDeliveryAgent,
  deleteDeliveryAgent,
  deleteCatalog,
  deleteOrder as deleteOrderRequest,
  createUser,
  createItem,
  deleteItem,
  deleteUser,
  resetUserPassword,
  createCatalog,
  createCustomer,
  createProvince,
  createDepot,
  deleteCustomer,
  deleteProvince,
  deleteDepot,
  deleteProducer,
  createProducer,
  fetchDashboardData,
  login as loginRequest,
  updateCatalog,
  updateCustomer,
  updateProvince,
  updateDepot,
  updateDeliveryAgent,
  updateItem,
  updateOrderAssignment,
  updateOrderStatus,
  moveOrderStatus as moveOrderStatusRequest,
  updateProducer,
  updateUser,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
  upsertCustomerBorrowedMaterial,
  deleteCustomerBorrowedMaterial,
  createBorrowMaterialOrderLoan,
  deleteBorrowMaterialOrderLoan,
  createBorrowMaterialMonthlySchedule,
  fetchBorrowMaterialMonthlyScheduleDetail,
  updateBorrowMaterialMonthlyInstallmentStatus,
  deleteBorrowMaterialMonthlySchedule,
  upsertCustomerItemPrice,
  deleteCustomerItemPrice,
  upsertDepotItemPrice,
  deleteDepotItemPrice,
} from "../services/adminApi";
import {
  getStoredToken,
  setStoredToken,
} from "../services/authStorage";
import i18n from "../i18n/config";
import { useConfirm } from "../components/ui/ConfirmProvider";
import { getApiErrorMessage as getApiErrorMessageFromResponse, unwrapApiData } from "../services/apiClient";
import { isAutoCredentialRole } from "../utils/userCredentials";

function getErrorMessage(error, errorKey) {
  return getApiErrorMessageFromResponse(error, i18n.t(errorKey));
}

export function useAdminDashboard() {
  const location = useLocation();
  const { alert } = useConfirm();
  const [auth, setAuth] = useState({ username: "", password: "" });
  const [token, setTokenState] = useState(getStoredToken);
  const [flash, setFlash] = useState(null);
  const dashboardBootstrapDoneRef = useRef(false);
  const [isDashboardBootstrapping, setIsDashboardBootstrapping] = useState(() => !!getStoredToken());
  const [isOverviewRefreshing, setIsOverviewRefreshing] = useState(false);
  const [overviewLastUpdatedAt, setOverviewLastUpdatedAt] = useState(null);

  const setToken = useCallback((next) => {
    setTokenState(next);
    setStoredToken(typeof next === "string" ? next : "");
  }, []);

  const dismissFlash = useCallback(() => {
    setFlash(null);
  }, []);

  const showSuccess = useCallback((text) => {
    setFlash({ text, variant: "success" });
  }, []);

  const showError = useCallback((text) => {
    setFlash({ text, variant: "error" });
  }, []);

  const showSuccessPopup = useCallback(
    async (text) => {
      showSuccess(text);
      await alert({
        title: i18n.t("confirm.successTitle"),
        message: text,
        tone: "primary",
      });
    },
    [alert, showSuccess],
  );

  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [depots, setDepots] = useState([]);
  const [producers, setProducers] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [items, setItems] = useState([]);
  const [borrowMaterials, setBorrowMaterials] = useState([]);
  const [customerBorrowedMaterials, setCustomerBorrowedMaterials] = useState([]);
  const [borrowMaterialOrderLoans, setBorrowMaterialOrderLoans] = useState([]);
  const [borrowMaterialMonthlySchedules, setBorrowMaterialMonthlySchedules] = useState([]);
  const [customerItemPrices, setCustomerItemPrices] = useState([]);
  const [depotItemPrices, setDepotItemPrices] = useState([]);
  const [paymentTotals, setPaymentTotals] = useState({ byCustomer: [], byDepot: [] });

  const [newProducer, setNewProducer] = useState({ name: "", phone: "", capacityNote: "" });
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    latitude: "",
    longitude: "",
    depotId: "",
    provinceId: "",
  });
  const [newProvince, setNewProvince] = useState({ name: "" });
  const [newDepot, setNewDepot] = useState({
    name: "",
    phone: "",
    address: "",
    depotUserId: "",
  });
  const [newCatalog, setNewCatalog] = useState({ name: "", note: "" });
  const [newItem, setNewItem] = useState({
    catalogId: "",
    name: "",
    sku: "",
  });
  const [newDelivery, setNewDelivery] = useState({ name: "", phone: "", vehicleType: "" });
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "Customer",
    customerId: "",
    deliveryAgentId: "",
    depotId: "",
  });
  const [newBorrowMaterial, setNewBorrowMaterial] = useState({ name: "", unit: "", note: "" });
  const [newCustomerBorrow, setNewCustomerBorrow] = useState({ customerId: "", materialId: "", qty: 1, note: "" });
  const [newOrderLoan, setNewOrderLoan] = useState({
    customerId: "",
    materialId: "",
    orderId: "",
    fixedUnitPrice: "",
    note: "",
  });
  const [newMonthlySchedule, setNewMonthlySchedule] = useState({
    customerId: "",
    materialId: "",
    totalAmount: "",
    currency: "KHR",
    totalPeriod: 6,
    startDueDate: "",
    note: "",
  });

  const refresh = useCallback(async () => {
    if (!token) return;
    const isInitialSessionLoad = !dashboardBootstrapDoneRef.current;
    const shouldShowInlineRefresh = dashboardBootstrapDoneRef.current;
    if (isInitialSessionLoad) setIsDashboardBootstrapping(true);
    if (shouldShowInlineRefresh) setIsOverviewRefreshing(true);
    try {
      const data = await fetchDashboardData(token, location.pathname);
      setUser(data.user);
      setSummary(data.summary);
      setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
      setOrders(data.orders);
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setProvinces(Array.isArray(data.provinces) ? data.provinces : []);
      setDepots(Array.isArray(data.depots) ? data.depots : []);
      setProducers(Array.isArray(data.producers) ? data.producers : []);
      setDeliveryAgents(Array.isArray(data.deliveryAgents) ? data.deliveryAgents : []);
      setCatalogs(Array.isArray(data.catalogs) ? data.catalogs : []);
      setItems(Array.isArray(data.items) ? data.items : []);
      setUsers(Array.isArray(data.users) ? data.users : []);
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      setBorrowMaterials(Array.isArray(data.borrowMaterials) ? data.borrowMaterials : []);
      setCustomerBorrowedMaterials(Array.isArray(data.customerBorrowedMaterials) ? data.customerBorrowedMaterials : []);
      setBorrowMaterialOrderLoans(
        Array.isArray(data.borrowMaterialOrderLoans) ? data.borrowMaterialOrderLoans : [],
      );
      setBorrowMaterialMonthlySchedules(
        Array.isArray(data.borrowMaterialMonthlySchedules) ? data.borrowMaterialMonthlySchedules : [],
      );
      setCustomerItemPrices(Array.isArray(data.customerItemPrices) ? data.customerItemPrices : []);
      setDepotItemPrices(Array.isArray(data.depotItemPrices) ? data.depotItemPrices : []);
      setPaymentTotals(
        data.paymentTotals && typeof data.paymentTotals === "object"
          ? {
              byCustomer: Array.isArray(data.paymentTotals.byCustomer) ? data.paymentTotals.byCustomer : [],
              byDepot: Array.isArray(data.paymentTotals.byDepot) ? data.paymentTotals.byDepot : [],
            }
          : { byCustomer: [], byDepot: [] },
      );
      setOverviewLastUpdatedAt(new Date().toISOString());
      dashboardBootstrapDoneRef.current = true;
    } catch (error) {
      if (error?.response?.status === 401) {
        dashboardBootstrapDoneRef.current = false;
        setOverviewLastUpdatedAt(null);
        setToken("");
        setUser(null);
        setSummary(null);
        setStatuses([]);
        setOrders([]);
        setUsers([]);
        setRoles([]);
        setCustomers([]);
        setProvinces([]);
        setDepots([]);
        setProducers([]);
        setDeliveryAgents([]);
        setCatalogs([]);
        setItems([]);
        setBorrowMaterials([]);
        setCustomerBorrowedMaterials([]);
        setBorrowMaterialOrderLoans([]);
        setBorrowMaterialMonthlySchedules([]);
        setCustomerItemPrices([]);
        setDepotItemPrices([]);
        setPaymentTotals({ byCustomer: [], byDepot: [] });
        showError(i18n.t("errors.sessionExpired"));
        return;
      }
      dashboardBootstrapDoneRef.current = true;
      showError(getErrorMessage(error, "errors.loadData"));
    } finally {
      if (isInitialSessionLoad) setIsDashboardBootstrapping(false);
      if (shouldShowInlineRefresh) setIsOverviewRefreshing(false);
    }
  }, [token, location.pathname, setToken, showError]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  async function login(event) {
    event.preventDefault();
    try {
      const data = await loginRequest({ ...auth, client: "admin" });
      dashboardBootstrapDoneRef.current = false;
      setIsDashboardBootstrapping(true);
      setToken(data.token);
      showSuccess(i18n.t("success.welcome", { name: data.user.name }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.login"));
    }
  }

  async function submitCatalog(event) {
    event.preventDefault();
    try {
      const created = await createCatalog(token, newCatalog);
      setNewCatalog({ name: "", note: "" });
      setNewItem((prev) => ({ ...prev, catalogId: created.id }));
      await refresh();
      await showSuccessPopup(i18n.t("success.catalogAdded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createCatalog"));
    }
  }

  async function submitCatalogUpdate(catalogId, payload) {
    try {
      await updateCatalog(token, catalogId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.catalogUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateCatalog"));
    }
  }

  async function submitCatalogDelete(catalogId) {
    try {
      await deleteCatalog(token, catalogId);
      if (newItem.catalogId === catalogId) {
        setNewItem((prev) => ({ ...prev, catalogId: "" }));
      }
      await refresh();
      showSuccess(i18n.t("success.catalogDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteCatalog"));
    }
  }

  async function submitItem(event) {
    event.preventDefault();
    try {
      await createItem(token, {
        ...newItem,
        catalogId: newItem.catalogId,
      });
      setNewItem((prev) => ({
        catalogId: prev.catalogId,
        name: "",
        sku: "",
      }));
      await refresh();
      await showSuccessPopup(i18n.t("success.itemAdded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createItem"));
    }
  }

  async function submitItemUpdate(itemId, payload) {
    try {
      await updateItem(token, itemId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.itemUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateItem"));
    }
  }

  async function submitItemDelete(itemId) {
    try {
      await deleteItem(token, itemId);
      await refresh();
      showSuccess(i18n.t("success.itemDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteItem"));
    }
  }

  async function submitCustomer(event) {
    event.preventDefault();
    try {
      await createCustomer(token, newCustomer);
      setNewCustomer({ name: "", phone: "", latitude: "", longitude: "", depotId: "", provinceId: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.customerAdded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createCustomer"));
    }
  }

  async function submitCustomerUpdate(customerId, payload) {
    try {
      await updateCustomer(token, customerId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.customerUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateCustomer"));
    }
  }

  async function submitCustomerDelete(customerId) {
    try {
      await deleteCustomer(token, customerId);
      await refresh();
      showSuccess(i18n.t("success.customerDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteCustomer"));
    }
  }

  async function submitProvince(event) {
    event.preventDefault();
    try {
      await createProvince(token, newProvince);
      setNewProvince({ name: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.provinceAdded", { defaultValue: "Province added" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createProvince"));
    }
  }

  async function submitProvinceUpdate(provinceId, payload) {
    try {
      await updateProvince(token, provinceId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.provinceUpdated", { defaultValue: "Province updated" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateProvince"));
    }
  }

  async function submitProvinceDelete(provinceId) {
    try {
      await deleteProvince(token, provinceId);
      await refresh();
      showSuccess(i18n.t("success.provinceDeleted", { defaultValue: "Province deleted" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteProvince"));
    }
  }

  async function submitDepot(event) {
    event.preventDefault();
    try {
      await createDepot(token, {
        ...newDepot,
        depotUserId: newDepot.depotUserId.trim() === "" ? null : newDepot.depotUserId.trim(),
      });
      setNewDepot({ name: "", phone: "", address: "", depotUserId: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.depotAdded", { defaultValue: "Depot added" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createDepot"));
    }
  }

  async function submitDepotUpdate(depotId, payload) {
    try {
      await updateDepot(token, depotId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.depotUpdated", { defaultValue: "Depot updated" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateDepot"));
    }
  }

  async function submitDepotDelete(depotId) {
    try {
      await deleteDepot(token, depotId);
      await refresh();
      showSuccess(i18n.t("success.depotDeleted", { defaultValue: "Depot deleted" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteDepot"));
    }
  }

  async function submitProducer(event) {
    event.preventDefault();
    try {
      await createProducer(token, newProducer);
      setNewProducer({ name: "", phone: "", capacityNote: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.producerAdded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createProducer"));
    }
  }

  async function submitProducerUpdate(producerId, payload) {
    try {
      await updateProducer(token, producerId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.producerUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateProducer"));
    }
  }

  async function submitProducerDelete(producerId) {
    try {
      await deleteProducer(token, producerId);
      await refresh();
      showSuccess(i18n.t("success.producerDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteProducer"));
    }
  }

  async function submitDelivery(event) {
    event.preventDefault();
    try {
      await createDeliveryAgent(token, newDelivery);
      setNewDelivery({ name: "", phone: "", vehicleType: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.deliveryAdded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createDelivery"));
    }
  }

  async function submitDeliveryUpdate(deliveryAgentId, payload) {
    try {
      await updateDeliveryAgent(token, deliveryAgentId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.deliveryUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateDelivery"));
    }
  }

  async function submitDeliveryDelete(deliveryAgentId) {
    try {
      await deleteDeliveryAgent(token, deliveryAgentId);
      await refresh();
      showSuccess(i18n.t("success.deliveryDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteDelivery"));
    }
  }

  async function submitDeliveryConfirmation(orderId, payload = { lossQty: 0 }) {
    try {
      await confirmDeliveryRequest(token, orderId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.deliveryConfirmed"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.confirmDelivery"));
    }
  }

  async function submitOrderLossQty(orderId, payload = { lossQty: 0 }) {
    try {
      await updateOrderLossQtyRequest(token, orderId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.lossQtyUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateLossQty"));
    }
  }

  async function submitManualPayment(payload) {
    try {
      await createManualPaymentRequest(token, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.manualPaymentRecorded"));
      return true;
    } catch (error) {
      showError(getErrorMessage(error, "errors.createManualPayment"));
      return false;
    }
  }

  async function loadUnpaidMasterOrders() {
    try {
      return await fetchUnpaidMasterOrders(token);
    } catch (error) {
      showError(getErrorMessage(error, "errors.loadUnpaidOrders"));
      return [];
    }
  }

  async function submitOrderStatus(orderId, status) {
    try {
      await updateOrderStatus(token, orderId, { status });
      await refresh();
      await showSuccessPopup(i18n.t("success.statusUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateStatus"));
    }
  }

  async function submitOrderDeliveryAssignment(orderIds, deliveryAgentId) {
    const ids = (Array.isArray(orderIds) ? orderIds : [orderIds])
      .map((id) => String(id || "").trim())
      .filter(Boolean);
    if (ids.length === 0) return;
    try {
      for (const orderId of ids) {
        await updateOrderAssignment(token, orderId, { deliveryAgentId: deliveryAgentId || null });
      }
      await refresh();
      await showSuccessPopup(
        i18n.t("success.deliveryAssigned", {
          count: ids.length,
          defaultValue: "Delivery assignment saved",
        }),
      );
    } catch (error) {
      await refresh();
      showError(getErrorMessage(error, "errors.updateDeliveryAssignment"));
      throw error;
    }
  }

  async function submitSendOrderToFactory(orderId) {
    try {
      await moveOrderStatusRequest(token, orderId, { status: "Sent_To_Factory" });
      await refresh();
      await showSuccessPopup(
        i18n.t("success.sentToFactory", { defaultValue: "Order sent to factory" }),
      );
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateStatus"));
    }
  }

  async function submitOrderDelete(orderId) {
    try {
      await deleteOrderRequest(token, orderId);
      await refresh();
      showSuccess(i18n.t("success.orderDeleted", { defaultValue: "Order deleted" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteOrder"));
    }
  }

  async function submitUser(event) {
    event.preventDefault();
    const raw = newUser || {};
    const customerIdToLink = String(raw.customerId || "").trim();
    const createPayload = {
      name: raw.name,
      role: raw.role,
    };
    if (!isAutoCredentialRole(raw.role)) {
      createPayload.username = raw.username;
      createPayload.password = raw.password;
    }
    const deliveryAgentIdToLink = String(raw.deliveryAgentId || "").trim();
    if (raw.role === "Delivery" && deliveryAgentIdToLink) {
      createPayload.deliveryAgentId = deliveryAgentIdToLink;
    }
    const depotIdToLink = String(raw.depotId || "").trim();
    if (raw.role === "Depot" && depotIdToLink) {
      createPayload.depotId = depotIdToLink;
    }
    try {
      const res = await createUser(token, createPayload);
      const created = unwrapApiData(res.data);
      const newId = created?.id;
      if (newId && createPayload.role === "Customer" && customerIdToLink) {
        await updateUser(token, newId, { customerId: customerIdToLink });
      }
      setNewUser({
        name: "",
        username: "",
        password: "",
        role: "Customer",
        customerId: "",
        deliveryAgentId: "",
        depotId: "",
      });
      await refresh();
      return {
        ok: true,
        generatedUsername: created?.username || null,
        generatedPassword: created?.generatedPassword || null,
      };
    } catch (error) {
      showError(getErrorMessage(error, "errors.createUser"));
      return { ok: false };
    }
  }

  async function submitUserUpdate(userId, payload) {
    try {
      await updateUser(token, userId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.userUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateUser"));
    }
  }

  async function submitUserDelete(userId) {
    try {
      await deleteUser(token, userId);
      await refresh();
      showSuccess(i18n.t("success.userDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteUser"));
    }
  }

  async function submitUserResetPassword(userId) {
    try {
      const res = await resetUserPassword(token, userId);
      const updated = unwrapApiData(res.data);
      return {
        ok: true,
        generatedUsername: updated?.username || null,
        generatedPassword: updated?.generatedPassword || null,
      };
    } catch (error) {
      showError(getErrorMessage(error, "errors.resetUserPassword"));
      return { ok: false };
    }
  }

  async function submitBorrowMaterial(event) {
    event.preventDefault();
    try {
      await createBorrowMaterial(token, newBorrowMaterial);
      setNewBorrowMaterial({ name: "", unit: "", note: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.borrowMaterialAdded", { defaultValue: "Borrow material added" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createBorrowMaterial"));
    }
  }

  async function submitBorrowMaterialUpdate(materialId, payload) {
    try {
      await updateBorrowMaterial(token, materialId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.borrowMaterialUpdated", { defaultValue: "Borrow material updated" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateBorrowMaterial"));
    }
  }

  async function submitBorrowMaterialDelete(materialId) {
    try {
      await deleteBorrowMaterial(token, materialId);
      await refresh();
      showSuccess(i18n.t("success.borrowMaterialDeleted", { defaultValue: "Borrow material deleted" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteBorrowMaterial"));
    }
  }

  async function submitCustomerBorrow(eventOrOverride) {
    const isEvent = eventOrOverride && typeof eventOrOverride.preventDefault === "function";
    if (isEvent) eventOrOverride.preventDefault();
    const override = !isEvent && eventOrOverride && typeof eventOrOverride === "object" ? eventOrOverride : null;
    const source = override || newCustomerBorrow;
    try {
      const payload = {
        materialId: String(source.materialId || ""),
        qty: Math.max(0, Number(source.qty || 0)),
        note: source.note || "",
      };
      await upsertCustomerBorrowedMaterial(token, source.customerId, payload);
      if (!override) {
        setNewCustomerBorrow({ customerId: "", materialId: "", qty: 1, note: "" });
      }
      await refresh();
      await showSuccessPopup(i18n.t("success.customerBorrowSaved", { defaultValue: "Borrowing saved" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.saveCustomerBorrow"));
    }
  }

  async function submitCustomerBorrowDelete(customerId, materialId) {
    try {
      await deleteCustomerBorrowedMaterial(token, customerId, materialId);
      await refresh();
      showSuccess(i18n.t("success.customerBorrowDeleted", { defaultValue: "Borrowing removed" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteCustomerBorrow"));
    }
  }

  async function submitBorrowMaterialOrderLoan(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    try {
      await createBorrowMaterialOrderLoan(token, newOrderLoan.customerId, {
        materialId: String(newOrderLoan.materialId || ""),
        orderId: String(newOrderLoan.orderId || ""),
        fixedUnitPrice: Number(newOrderLoan.fixedUnitPrice),
        note: newOrderLoan.note || "",
      });
      setNewOrderLoan({ customerId: "", materialId: "", orderId: "", fixedUnitPrice: "", note: "" });
      await refresh();
      await showSuccessPopup(
        i18n.t("success.borrowOrderLoanSaved", { defaultValue: "Order loan saved" }),
      );
    } catch (error) {
      showError(getErrorMessage(error, "errors.saveBorrowOrderLoan"));
      throw error;
    }
  }

  async function submitBorrowMaterialOrderLoanDelete(customerId, id) {
    try {
      await deleteBorrowMaterialOrderLoan(token, customerId, id);
      await refresh();
      showSuccess(i18n.t("success.borrowOrderLoanDeleted", { defaultValue: "Order loan removed" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteBorrowOrderLoan"));
    }
  }

  async function submitBorrowMaterialMonthlySchedule(event) {
    if (event && typeof event.preventDefault === "function") event.preventDefault();
    try {
      await createBorrowMaterialMonthlySchedule(token, newMonthlySchedule.customerId, {
        materialId: String(newMonthlySchedule.materialId || ""),
        totalAmount: Number(newMonthlySchedule.totalAmount),
        currency: newMonthlySchedule.currency || "KHR",
        totalPeriod: Math.max(1, Math.floor(Number(newMonthlySchedule.totalPeriod || 1))),
        startDueDate: String(newMonthlySchedule.startDueDate || "").trim(),
        note: newMonthlySchedule.note || "",
      });
      setNewMonthlySchedule({
        customerId: "",
        materialId: "",
        totalAmount: "",
        currency: "KHR",
        totalPeriod: 6,
        startDueDate: "",
        note: "",
      });
      await refresh();
      await showSuccessPopup(
        i18n.t("success.borrowMonthlyScheduleSaved", { defaultValue: "Monthly schedule created" }),
      );
    } catch (error) {
      showError(getErrorMessage(error, "errors.saveBorrowMonthlySchedule"));
      throw error;
    }
  }

  async function submitBorrowMaterialMonthlyScheduleDelete(customerId, id) {
    try {
      await deleteBorrowMaterialMonthlySchedule(token, customerId, id);
      await refresh();
      showSuccess(i18n.t("success.borrowMonthlyScheduleDeleted", { defaultValue: "Schedule removed" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteBorrowMonthlySchedule"));
    }
  }

  async function loadBorrowMaterialMonthlyScheduleDetail(customerId, scheduleId) {
    const res = await fetchBorrowMaterialMonthlyScheduleDetail(token, customerId, scheduleId);
    return unwrapApiData(res.data);
  }

  async function submitBorrowMaterialMonthlyInstallmentStatusUpdate(customerId, scheduleId, installmentId, status) {
    try {
      await updateBorrowMaterialMonthlyInstallmentStatus(token, customerId, scheduleId, installmentId, {
        status,
      });
      const res = await fetchBorrowMaterialMonthlyScheduleDetail(token, customerId, scheduleId);
      return unwrapApiData(res.data);
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateBorrowMonthlyInstallmentStatus"));
      return null;
    }
  }

  async function submitCustomerItemPrice(eventOrPayload) {
    const isEvent = eventOrPayload && typeof eventOrPayload.preventDefault === "function";
    if (isEvent) eventOrPayload.preventDefault();
    const payload = !isEvent && eventOrPayload && typeof eventOrPayload === "object" ? eventOrPayload : null;
    if (!payload) return;
    try {
      await upsertCustomerItemPrice(token, payload);
      await refresh();
      await showSuccessPopup(
        i18n.t("success.customerItemPriceSaved", { defaultValue: "Customer item price saved" }),
      );
    } catch (error) {
      showError(getErrorMessage(error, "errors.saveCustomerItemPrice"));
    }
  }

  async function submitCustomerItemPriceDelete(id) {
    try {
      await deleteCustomerItemPrice(token, id);
      await refresh();
      showSuccess(i18n.t("success.customerItemPriceDeleted", { defaultValue: "Customer item price deleted" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteCustomerItemPrice"));
    }
  }

  async function submitDepotItemPrice(eventOrPayload) {
    const isEvent = eventOrPayload && typeof eventOrPayload.preventDefault === "function";
    if (isEvent) eventOrPayload.preventDefault();
    const payload = !isEvent && eventOrPayload && typeof eventOrPayload === "object" ? eventOrPayload : null;
    if (!payload) return;
    try {
      await upsertDepotItemPrice(token, payload);
      await refresh();
      await showSuccessPopup(
        i18n.t("success.depotItemPriceSaved", { defaultValue: "Depot item price saved" }),
      );
    } catch (error) {
      showError(getErrorMessage(error, "errors.saveDepotItemPrice"));
    }
  }

  async function submitDepotItemPriceDelete(id) {
    try {
      await deleteDepotItemPrice(token, id);
      await refresh();
      showSuccess(i18n.t("success.depotItemPriceDeleted", { defaultValue: "Depot item price deleted" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteDepotItemPrice"));
    }
  }

  function logout() {
    dashboardBootstrapDoneRef.current = false;
    setIsDashboardBootstrapping(false);
    setToken("");
    setUser(null);
    dismissFlash();
  }

  return {
    auth,
    token,
    isDashboardBootstrapping,
    isOverviewRefreshing,
    overviewLastUpdatedAt,
    user,
    summary,
    statuses,
    orders,
    users,
    roles,
    customers,
    provinces,
    depots,
    producers,
    deliveryAgents,
    catalogs,
    items,
    borrowMaterials,
    customerBorrowedMaterials,
    borrowMaterialOrderLoans,
    borrowMaterialMonthlySchedules,
    customerItemPrices,
    depotItemPrices,
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
    newUser,
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
    setNewUser,
    setNewBorrowMaterial,
    setNewCustomerBorrow,
    login,
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
    submitProvince,
    submitProvinceUpdate,
    submitProvinceDelete,
    submitDepot,
    submitDepotUpdate,
    submitDepotDelete,
    submitDelivery,
    submitDeliveryUpdate,
    submitDeliveryDelete,
    submitDeliveryConfirmation,
    submitOrderLossQty,
    submitManualPayment,
    loadUnpaidMasterOrders,
    submitOrderStatus,
    submitOrderDeliveryAssignment,
    submitSendOrderToFactory,
    submitOrderDelete,
    submitUser,
    submitUserUpdate,
    submitUserDelete,
    submitUserResetPassword,
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
    submitCustomerItemPrice,
    submitCustomerItemPriceDelete,
    submitDepotItemPrice,
    submitDepotItemPriceDelete,
    refresh,
    logout,
  };
}
