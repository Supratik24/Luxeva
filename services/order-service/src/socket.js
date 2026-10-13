import { Server } from "socket.io";

let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    },
    transports: ["websocket", "polling"]
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.handshake.auth || {};

    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role === "admin") {
      socket.join("admin:orders");
    }

    socket.on("join:order", (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on("leave:order", (orderId) => {
      if (orderId) {
        socket.leave(`order:${orderId}`);
      }
    });

    socket.on("disconnect", () => {
      // client disconnected
    });
  });

  console.log("Socket.IO initialized on order-service");
  return io;
};

export const emitOrderUpdate = (order) => {
  if (!io) return;

  const payload = {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    userId: String(order.userId),
    status: order.status,
    shipping: order.shipping,
    timeline: order.timeline,
    updatedAt: order.updatedAt,
    order
  };

  // Emit to the specific user's room
  if (order.userId) {
    io.to(`user:${order.userId}`).emit("order:updated", payload);
  }

  // Emit to the specific order's tracking room
  io.to(`order:${order._id}`).emit("order:updated", payload);

  // Emit to admin orders room
  io.to("admin:orders").emit("order:updated", payload);
};

export const getIO = () => io;
