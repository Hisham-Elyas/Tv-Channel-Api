const errorHandler = (code, message) => {
  return {
    status: code,
    error: message,
  };
};

module.exports = { errorHandler };
