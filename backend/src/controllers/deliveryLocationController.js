const deliveryLocationService = require("../services/deliveryLocationService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const mobileGetOrderDeliveryLocation = asyncHandler(async (req, res) => {
  const data = await deliveryLocationService.getOrderDeliveryLocation(req.params.id, {
    user: req.user,
    redisClient: null,
  });
  return success(res, data);
});

module.exports = {
  mobileGetOrderDeliveryLocation,
};
