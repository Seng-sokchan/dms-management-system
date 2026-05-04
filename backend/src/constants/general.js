const ORDER_STATUS = [
  "New_Order",
  "Owner Preparing",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

const ROLES = ["Admin", "Owner", "Logistics", "Delivery", "Customer", "Depot"];

const NEXT_STATUS = {
  "New_Order": ["Owner Preparing"],
  "Owner Preparing": ["Ready_For_Delivery"],
  Ready_For_Delivery: ["Recieve_By_Customer"],
  Recieve_By_Customer: [],
};

module.exports = {
  ORDER_STATUS,
  ROLES,
  NEXT_STATUS,
};
