const ORDER_STATUS = [
  "Owner_Preparing",
  "Sent_To_Factory",
  "Ready_For_Delivery",
  "Recieve_By_Customer",
];

const ROLES = ["Admin", "Owner", "Logistics", "Delivery", "Customer", "Depot"];

const NEXT_STATUS = {
  Owner_Preparing: ["Sent_To_Factory"],
  Sent_To_Factory: ["Ready_For_Delivery"],
  Ready_For_Delivery: ["Recieve_By_Customer"],
  Recieve_By_Customer: [],
};

module.exports = {
  ORDER_STATUS,
  ROLES,
  NEXT_STATUS,
};
