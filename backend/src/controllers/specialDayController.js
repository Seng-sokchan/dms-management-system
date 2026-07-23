const specialDayService = require("../services/specialDayService");
const { success, created } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listSpecialDays = asyncHandler(async (req, res) => {
  const data = await specialDayService.list(req.user);
  return success(res, data);
});

const listOpenSpecialDays = asyncHandler(async (req, res) => {
  const data = await specialDayService.listOpenForOptIn(req.user);
  return success(res, data);
});

const getSpecialDay = asyncHandler(async (req, res) => {
  const data = await specialDayService.getById(req.user, req.params.id);
  return success(res, data);
});

const createSpecialDay = asyncHandler(async (req, res) => {
  const data = await specialDayService.create(req.user, req.body);
  return created(res, data);
});

const updateSpecialDay = asyncHandler(async (req, res) => {
  const data = await specialDayService.update(req.user, req.params.id, req.body);
  return success(res, data);
});

const listRegistrations = asyncHandler(async (req, res) => {
  const data = await specialDayService.listRegistrations(req.user, req.params.id, req.query);
  return success(res, data);
});

const listMyRegistrations = asyncHandler(async (req, res) => {
  const data = await specialDayService.listMyRegistrations(req.user);
  return success(res, data);
});

const registerForSpecialDay = asyncHandler(async (req, res) => {
  const data = await specialDayService.register(req.user, req.params.id);
  return created(res, data);
});

const cancelRegistration = asyncHandler(async (req, res) => {
  const data = await specialDayService.cancelMyRegistration(
    req.user,
    req.params.id,
    req.params.registrationId,
  );
  return success(res, data);
});

const upsertAssignment = asyncHandler(async (req, res) => {
  const data = await specialDayService.upsertAssignment(req.user, req.params.id, req.body);
  return success(res, data);
});

const listDriverAssignments = asyncHandler(async (req, res) => {
  const data = await specialDayService.listDriverAssignments(req.user);
  return success(res, data);
});

const acceptAssignment = asyncHandler(async (req, res) => {
  const data = await specialDayService.acceptAssignment(req.user, req.params.registrationId);
  return success(res, data);
});

const getProgress = asyncHandler(async (req, res) => {
  const data = await specialDayService.getProgress(req.user, req.params.id);
  return success(res, data);
});

const createDelivery = asyncHandler(async (req, res) => {
  const data = await specialDayService.fulfill(req.user, req.body);
  return created(res, data);
});

module.exports = {
  listSpecialDays,
  listOpenSpecialDays,
  getSpecialDay,
  createSpecialDay,
  updateSpecialDay,
  listRegistrations,
  listMyRegistrations,
  registerForSpecialDay,
  cancelRegistration,
  upsertAssignment,
  listDriverAssignments,
  acceptAssignment,
  getProgress,
  createDelivery,
};
