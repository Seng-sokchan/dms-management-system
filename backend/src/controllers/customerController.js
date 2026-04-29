const { z } = require("zod");
const {
  listCustomers: listCustomersDb,
  createCustomer: createCustomerDb,
  updateCustomer: updateCustomerDb,
  deleteCustomer: deleteCustomerDb,
  listUsers: listUsersDb,
  getUserById,
} = require("../repositories");

async function listCustomers(_req, res) {
  const customers = await listCustomersDb();
  res.json(customers);
}

async function listCustomerUsers(_req, res) {
  const users = await listUsersDb();
  const customerUsers = users.filter((user) => user.role === "Customer" && user.isActive);
  res.json(customerUsers);
}

async function validateCustomerUserOrRespond(userId, res) {
  const user = await getUserById(userId);
  if (!user || !user.isActive) {
    res.status(400).json({ message: "Customer user not found" });
    return false;
  }
  if (user.role !== "Customer") {
    res.status(400).json({ message: "Selected user must have Customer role" });
    return false;
  }
  return true;
}

async function createCustomer(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    phone: z.string().optional().default(""),
    address: z.string().min(1),
    userId: z.string().min(1),
    subAddress: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid customer payload" });
  }
  const isUserValid = await validateCustomerUserOrRespond(parsed.data.userId, res);
  if (!isUserValid) return;
  const customer = await createCustomerDb(parsed.data);
  return res.status(201).json(customer);
}

async function updateCustomer(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    phone: z.string().optional().default(""),
    address: z.string().min(1),
    userId: z.string().min(1),
    subAddress: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid customer payload" });
  }
  const isUserValid = await validateCustomerUserOrRespond(parsed.data.userId, res);
  if (!isUserValid) return;
  const customer = await updateCustomerDb(req.params.id, parsed.data);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  return res.json(customer);
}

async function deleteCustomer(req, res) {
  const deleted = await deleteCustomerDb(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Customer not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
