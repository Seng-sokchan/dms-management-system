import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  confirmDelivery as confirmDeliveryRequest,
  createDeliveryAgent,
  createTruck,
  deleteDeliveryAgent,
  deleteTruck,
  deleteCatalog,
  createOrder,
  deleteOrder as deleteOrderRequest,
  createPayment,
  createUser,
  createItem,
  deleteItem,
  deleteUser,
  createCatalog,
  createCustomer,
  deleteCustomer,
  deleteProducer,
  createProducer,
  fetchDashboardData,
  login as loginRequest,
  updateCatalog,
  updateCustomer,
  updateDeliveryAgent,
  updateTruck,
  updateItem,
  updateOrderAssignment,
  updateOrderStatus,
  updateProducer,
  updateUser,
  updateRoleMenus,
} from "../services/adminApi";
import {
  getStoredToken,
  setStoredToken,
} from "../services/authStorage";
import i18n from "../i18n/config";
import { useConfirm } from "../components/ConfirmProvider";

function getErrorMessage(error, errorKey) {
  return error?.response?.data?.message || i18n.t(errorKey);
}

export function useAdminDashboard() {
  const location = useLocation();
  const { alert } = useConfirm();
  const [auth, setAuth] = useState({ username: "admin", password: "admin123" });
  const [token, setTokenState] = useState(getStoredToken);
  const [flash, setFlash] = useState(null);

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
  const [activityLogs, setActivityLogs] = useState([]);
  const [roleMenusByRole, setRoleMenusByRole] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerUsers, setCustomerUsers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [producers, setProducers] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [orderGroups, setOrderGroups] = useState([]);

  const [newOrder, setNewOrder] = useState({
    customerId: "",
    itemId: "",
    orderedQty: 1,
    producerId: "",
    truckId: "",
  });
  const [newProducer, setNewProducer] = useState({ name: "", phone: "", capacityNote: "" });
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    userId: "",
    subAddress: "",
  });
  const [newCatalog, setNewCatalog] = useState({ name: "", note: "" });
  const [newItem, setNewItem] = useState({
    catalogId: "",
    name: "",
    sku: "",
    defaultUnitPriceUsd: 1,
    defaultUnitPriceKhr: 4100,
  });
  const [newDelivery, setNewDelivery] = useState({ name: "", phone: "", vehicleType: "" });
  const [newTruck, setNewTruck] = useState({ code: "", plateNo: "", deliveryAgentId: "", capacityNote: "" });
  const [newPayment, setNewPayment] = useState({ orderId: "", amount: 1, method: "", note: "" });
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "Owner" });

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchDashboardData(token, location.pathname);
      setUser(data.user);
      setSummary(data.summary);
      setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
      setOrders(data.orders);
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setCustomerUsers(Array.isArray(data.customerUsers) ? data.customerUsers : []);
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      setProducers(Array.isArray(data.producers) ? data.producers : []);
      setDeliveryAgents(Array.isArray(data.deliveryAgents) ? data.deliveryAgents : []);
      setTrucks(Array.isArray(data.trucks) ? data.trucks : []);
      setCatalogs(Array.isArray(data.catalogs) ? data.catalogs : []);
      setItems(Array.isArray(data.items) ? data.items : []);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setPaymentMethods(Array.isArray(data.paymentMethods) ? data.paymentMethods : []);
      setOrderGroups(Array.isArray(data.orderGroups) ? data.orderGroups : []);
      setUsers(Array.isArray(data.users) ? data.users : []);
      setRoleMenusByRole(data.roleMenusByRole && typeof data.roleMenusByRole === "object" ? data.roleMenusByRole : null);
      setActivityLogs(Array.isArray(data.activityLogs) ? data.activityLogs : []);
    } catch (error) {
      if (error?.response?.status === 401) {
        setToken("");
        setUser(null);
        setSummary(null);
        setStatuses([]);
        setOrders([]);
        setUsers([]);
        setActivityLogs([]);
        setRoleMenusByRole(null);
        setCustomers([]);
        setCustomerUsers([]);
        setAddresses([]);
        setProducers([]);
        setDeliveryAgents([]);
        setTrucks([]);
        setCatalogs([]);
        setItems([]);
        setPayments([]);
        setPaymentMethods([]);
        setOrderGroups([]);
        showError(i18n.t("errors.sessionExpired"));
        return;
      }
      showError(getErrorMessage(error, "errors.loadData"));
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
      const data = await loginRequest(auth);
      setToken(data.token);
      showSuccess(i18n.t("success.welcome", { name: data.user.name }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.login"));
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    try {
      const body = {
        ...newOrder,
        orderedQty: Number(newOrder.orderedQty),
      };
      if (!body.itemId) {
        delete body.itemId;
      }
      await createOrder(token, body);
      setNewOrder({
        customerId: "",
        itemId: "",
        orderedQty: 1,
        producerId: "",
        truckId: "",
      });
      await refresh();
      await showSuccessPopup(i18n.t("success.orderCreated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createOrder"));
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
        defaultUnitPriceUsd: Number(newItem.defaultUnitPriceUsd),
        defaultUnitPriceKhr: Number(newItem.defaultUnitPriceKhr),
      });
      setNewItem((prev) => ({
        catalogId: prev.catalogId,
        name: "",
        sku: "",
        defaultUnitPriceUsd: 1,
        defaultUnitPriceKhr: 4100,
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
      if (newOrder.itemId === itemId) {
        setNewOrder((prev) => ({ ...prev, itemId: "" }));
      }
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
      setNewCustomer({ name: "", phone: "", address: "", userId: "", subAddress: "" });
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
      if (newOrder.customerId === customerId) {
        setNewOrder((prev) => ({ ...prev, customerId: "" }));
      }
      await refresh();
      showSuccess(i18n.t("success.customerDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteCustomer"));
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

  async function submitTruck(event) {
    event.preventDefault();
    try {
      await createTruck(token, newTruck);
      setNewTruck({ code: "", plateNo: "", deliveryAgentId: "", capacityNote: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.truckAdded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createTruck"));
    }
  }

  async function submitTruckUpdate(truckId, payload) {
    try {
      await updateTruck(token, truckId, payload);
      await refresh();
      await showSuccessPopup(i18n.t("success.truckUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateTruck"));
    }
  }

  async function submitTruckDelete(truckId) {
    try {
      await deleteTruck(token, truckId);
      if (newOrder.truckId === truckId) {
        setNewOrder((prev) => ({ ...prev, truckId: "" }));
      }
      await refresh();
      showSuccess(i18n.t("success.truckDeleted"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.deleteTruck"));
    }
  }

  async function submitDeliveryConfirmation(
    orderId,
    deliveredQty,
    lossQty = 0,
    remainingQty = 0,
    deliveryProofType = "OTP",
    deliveryProofValue = "",
  ) {
    try {
      await confirmDeliveryRequest(token, orderId, {
        deliveredQty: Number(deliveredQty),
        lossQty: Number(lossQty),
        remainingQty: Number(remainingQty),
        deliveryProofType,
        deliveryProofValue,
      });
      await refresh();
      await showSuccessPopup(i18n.t("success.deliveryConfirmed"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.confirmDelivery"));
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

  async function submitOrderGroupAssignment(orderId, orderGroupId) {
    try {
      await updateOrderAssignment(token, orderId, { orderGroupId: orderGroupId || null });
      await refresh();
      await showSuccessPopup(i18n.t("success.orderGroupAssigned", { defaultValue: "Order group assigned" }));
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateOrderGroup"));
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

  async function submitPayment(event) {
    event.preventDefault();
    try {
      await createPayment(token, {
        ...newPayment,
        amount: Number(newPayment.amount),
        method: Number(newPayment.method),
      });
      setNewPayment({ orderId: "", amount: 1, method: "", note: "" });
      await refresh();
      await showSuccessPopup(i18n.t("success.paymentRecorded"));
    } catch (error) {
      showError(getErrorMessage(error, "errors.createPayment"));
    }
  }

  async function submitUser(event) {
    event.preventDefault();
    try {
      await createUser(token, newUser);
      setNewUser({ name: "", username: "", password: "", role: "Owner" });
      await refresh();
      await showSuccessPopup(i18n.t("success.userAdded"));
      return true;
    } catch (error) {
      showError(getErrorMessage(error, "errors.createUser"));
      return false;
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

  async function submitRoleMenus(roleName, menuKeys) {
    try {
      await updateRoleMenus(token, roleName, menuKeys);
      await refresh();
      await showSuccessPopup(i18n.t("users.roleMenusSaved"));
      return true;
    } catch (error) {
      showError(getErrorMessage(error, "errors.updateRoleMenus"));
      return false;
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    dismissFlash();
  }

  return {
    auth,
    token,
    user,
    summary,
    statuses,
    orders,
    users,
    roleMenusByRole,
    activityLogs,
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
    newUser,
    setAuth,
    setNewOrder,
    setNewProducer,
    setNewCustomer,
    setNewCatalog,
    setNewItem,
    setNewDelivery,
    setNewTruck,
    setNewPayment,
    setNewUser,
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
    submitUser,
    submitUserUpdate,
    submitUserDelete,
    submitRoleMenus,
    refresh,
    logout,
  };
}
