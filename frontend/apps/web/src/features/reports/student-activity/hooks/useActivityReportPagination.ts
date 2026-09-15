import { useState } from "react";

export const useActivityReportPagination = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const resetPage = () => setPage(1);
  const changeLimit = (nextLimit: number) => {
    setLimit(nextLimit);
    resetPage();
  };
  return { changeLimit, limit, page, resetPage, setPage };
};
