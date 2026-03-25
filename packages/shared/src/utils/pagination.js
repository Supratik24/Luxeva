export const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 48);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

