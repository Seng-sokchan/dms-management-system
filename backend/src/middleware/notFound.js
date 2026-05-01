function notFound(_req, res) {
  res.status(400).json({
    success: false,
    error: {
      code: "BAD_REQUEST",
      message: "Route not found",
    },
  });
}

module.exports = {
  notFound,
};
