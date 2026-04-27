import { useCallback, useEffect, useState } from "react";
import {
  confirmDelivery as confirmDeliveryRequest,
  createDeliveryAgent,
  createTruck,
  deleteDeliveryAgent,
  deleteTruck,
  deleteCatalog,
  createOrder,
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
  fetchUsers,
  fetchActivityLogs,
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
  fetchRoleMenus,
  updateRoleMenus,
} from "../services/adminApi";
import { getStoredToken, setStoredToken } from "../services/authStorage";
import i18n from "../i18n/config";

function getErrorMessage(error, errorKey) {
  return error?.response?.data?.message || i18n.t(errorKey);
}

export function useAdminDashboard() {
  const [auth, setAuth] = useState({ username: "admin", password: "admin123" });
  const [token, setTokenState] = useState(getStoredToken);
  const [message, setMessage] = useState("");

  const setToken = useCallback((next) => {
    setTokenState(next);
    setStoredToken(typeof next === "string" ? next : "");
  }, []);

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
  const [newItem, setNewItem] = useState({ catalogId: "", name: "", sku: "", defaultUnitPrice: 1 });
  const [newDelivery, setNewDelivery] = useState({ name: "", phone: "", vehicleType: "" });
  const [newTruck, setNewTruck] = useState({ code: "", plateNo: "", deliveryAgentId: "", capacityNote: "" });
  const [newPayment, setNewPayment] = useState({ orderId: "", amount: 1, method: "", note: "" });
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "Owner" });

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchDashboardData(token);
      setUser(data.user);
      setSummary(data.summary);
      setStatuses(Array.isArray(data.statuses) ? data.statuses : []);
      setOrders(data.orders);
      setCustomers(data.customers);
      setCustomerUsers(Array.isArray(data.customerUsers) ? data.customerUsers : []);
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      setProducers(data.producers);
      setDeliveryAgents(data.deliveryAgents);
      setTrucks(data.trucks || []);
      setCatalogs(data.catalogs);
      setItems(data.items);
      setPayments(data.payments);
      setPaymentMethods(Array.isArray(data.paymentMethods) ? data.paymentMethods : []);
      if (data.user?.role === "Admin") {
        const menusData = await fetchRoleMenus(token);
        setRoleMenusByRole(menusData && typeof menusData === "object" ? menusData : null);
        if (data.user?.allowedMenus?.includes("users")) {
          const usersData = await fetchUsers(token);
          setUsers(usersData);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
        setRoleMenusByRole(null);
      }
      if (data.user?.role === "Admin" && data.user?.allowedMenus?.includes("activityLogs")) {
        const logsData = await fetchActivityLogs(token, 300);
        setActivityLogs(Array.isArray(logsData) ? logsData : []);
      } else {
        setActivityLogs([]);
      }
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
        setMessage(i18n.t("errors.sessionExpired"));
        return;
      }
      setMessage(getErrorMessage(error, "errors.loadData"));
    }
  }, [token, setToken]);

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
      setMessage(i18n.t("success.welcome", { name: data.user.name }));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.login"));
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
      setMessage(i18n.t("success.orderCreated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createOrder"));
    }
  }

  async function submitCatalog(event) {
    event.preventDefault();
    try {
      const created = await createCatalog(token, newCatalog);
      setNewCatalog({ name: "", note: "" });
      setNewItem((prev) => ({ ...prev, catalogId: created.id }));
      await refresh();
      setMessage(i18n.t("success.catalogAdded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createCatalog"));
    }
  }

  async function submitCatalogUpdate(catalogId, payload) {
    try {
      await updateCatalog(token, catalogId, payload);
      await refresh();
      setMessage(i18n.t("success.catalogUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateCatalog"));
    }
  }

  async function submitCatalogDelete(catalogId) {
    try {
      await deleteCatalog(token, catalogId);
      if (newItem.catalogId === catalogId) {
        setNewItem((prev) => ({ ...prev, catalogId: "" }));
      }
      await refresh();
      setMessage(i18n.t("success.catalogDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteCatalog"));
    }
  }

  async function submitItem(event) {
    event.preventDefault();
    try {
      await createItem(token, {
        ...newItem,
        catalogId: newItem.catalogId,
        defaultUnitPrice: Number(newItem.defaultUnitPrice),
      });
      setNewItem((prev) => ({
        catalogId: prev.catalogId,
        name: "",
        sku: "",
        defaultUnitPrice: 1,
      }));
      await refresh();
      setMessage(i18n.t("success.itemAdded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createItem"));
    }
  }

  async function submitItemUpdate(itemId, payload) {
    try {
      await updateItem(token, itemId, payload);
      await refresh();
      setMessage(i18n.t("success.itemUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateItem"));
    }
  }

  async function submitItemDelete(itemId) {
    try {
      await deleteItem(token, itemId);
      if (newOrder.itemId === itemId) {
        setNewOrder((prev) => ({ ...prev, itemId: "" }));
      }
      await refresh();
      setMessage(i18n.t("success.itemDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteItem"));
    }
  }

  async function submitCustomer(event) {
    event.preventDefault();
    try {
      await createCustomer(token, newCustomer);
      setNewCustomer({ name: "", phone: "", address: "", userId: "", subAddress: "" });
      await refresh();
      setMessage(i18n.t("success.customerAdded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createCustomer"));
    }
  }

  async function submitCustomerUpdate(customerId, payload) {
    try {
      await updateCustomer(token, customerId, payload);
      await refresh();
      setMessage(i18n.t("success.customerUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateCustomer"));
    }
  }

  async function submitCustomerDelete(customerId) {
    try {
      await deleteCustomer(token, customerId);
      if (newOrder.customerId === customerId) {
        setNewOrder((prev) => ({ ...prev, customerId: "" }));
      }
      await refresh();
      setMessage(i18n.t("success.customerDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteCustomer"));
    }
  }

  async function submitProducer(event) {
    event.preventDefault();
    try {
      await createProducer(token, newProducer);
      setNewProducer({ name: "", phone: "", capacityNote: "" });
      await refresh();
      setMessage(i18n.t("success.producerAdded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createProducer"));
    }
  }

  async function submitProducerUpdate(producerId, payload) {
    try {
      await updateProducer(token, producerId, payload);
      await refresh();
      setMessage(i18n.t("success.producerUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateProducer"));
    }
  }

  async function submitProducerDelete(producerId) {
    try {
      await deleteProducer(token, producerId);
      await refresh();
      setMessage(i18n.t("success.producerDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteProducer"));
    }
  }

  async function submitDelivery(event) {
    event.preventDefault();
    try {
      await createDeliveryAgent(token, newDelivery);
      setNewDelivery({ name: "", phone: "", vehicleType: "" });
      await refresh();
      setMessage(i18n.t("success.deliveryAdded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createDelivery"));
    }
  }

  async function submitDeliveryUpdate(deliveryAgentId, payload) {
    try {
      await updateDeliveryAgent(token, deliveryAgentId, payload);
      await refresh();
      setMessage(i18n.t("success.deliveryUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateDelivery"));
    }
  }

  async function submitDeliveryDelete(deliveryAgentId) {
    try {
      await deleteDeliveryAgent(token, deliveryAgentId);
      await refresh();
      setMessage(i18n.t("success.deliveryDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteDelivery"));
    }
  }

  async function submitTruck(event) {
    event.preventDefault();
    try {
      await createTruck(token, newTruck);
      setNewTruck({ code: "", plateNo: "", deliveryAgentId: "", capacityNote: "" });
      await refresh();
      setMessage(i18n.t("success.truckAdded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createTruck"));
    }
  }

  async function submitTruckUpdate(truckId, payload) {
    try {
      await updateTruck(token, truckId, payload);
      await refresh();
      setMessage(i18n.t("success.truckUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateTruck"));
    }
  }

  async function submitTruckDelete(truckId) {
    try {
      await deleteTruck(token, truckId);
      if (newOrder.truckId === truckId) {
        setNewOrder((prev) => ({ ...prev, truckId: "" }));
      }
      await refresh();
      setMessage(i18n.t("success.truckDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteTruck"));
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
      setMessage(i18n.t("success.deliveryConfirmed"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.confirmDelivery"));
    }
  }

  async function submitOrderStatus(orderId, status) {
    try {
      await updateOrderStatus(token, orderId, { status });
      await refresh();
      setMessage(i18n.t("success.statusUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateStatus"));
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
      setMessage(i18n.t("success.paymentRecorded"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createPayment"));
    }
  }

  async function submitUser(event) {
    event.preventDefault();
    try {
      await createUser(token, newUser);
      setNewUser({ name: "", username: "", password: "", role: "Owner" });
      await refresh();
      setMessage(i18n.t("success.userAdded"));
      return true;
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.createUser"));
      return false;
    }
  }

  async function submitUserUpdate(userId, payload) {
    try {
      await updateUser(token, userId, payload);
      await refresh();
      setMessage(i18n.t("success.userUpdated"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateUser"));
    }
  }

  async function submitUserDelete(userId) {
    try {
      await deleteUser(token, userId);
      await refresh();
      setMessage(i18n.t("success.userDeleted"));
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.deleteUser"));
    }
  }

  async function submitRoleMenus(roleName, menuKeys) {
    try {
      await updateRoleMenus(token, roleName, menuKeys);
      await refresh();
      setMessage(i18n.t("users.roleMenusSaved"));
      return true;
    } catch (error) {
      setMessage(getErrorMessage(error, "errors.updateRoleMenus"));
      return false;
    }
  }

  function logout() {
    setToken("");
    setUser(null);
    setMessage("");
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
    message,
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
    submitPayment,
    submitUser,
    submitUserUpdate,
    submitUserDelete,
    submitRoleMenus,
    logout,
  };
}
