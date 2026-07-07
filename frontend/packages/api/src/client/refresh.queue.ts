let isRefreshing = false;

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let queue: QueueItem[] = [];

export const refreshQueue = {
  isRefreshing() {
    return isRefreshing;
  },

  start() {
    isRefreshing = true;
  },

  stop() {
    isRefreshing = false;
  },

  push(
    resolve: QueueItem["resolve"],
    reject: QueueItem["reject"]
  ) {
    queue.push({ resolve, reject });
  },

  resolve(token: string) {
    queue.forEach((item) => item.resolve(token));
    queue = [];
  },

  reject(error: unknown) {
    queue.forEach((item) => item.reject(error));
    queue = [];
  },
};