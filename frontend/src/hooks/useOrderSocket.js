import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const SOCKET_URL = import.meta.env.VITE_ORDER_SOCKET_URL || "http://localhost:4003";

export const useOrderSocket = ({ orderId = null, onUpdate = null } = {}) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: {
        userId: user?.id || user?._id || "",
        role: user?.role || "user"
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (orderId) {
        socket.emit("join:order", orderId);
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("order:updated", (data) => {
      setLastUpdate(data);
      if (typeof onUpdate === "function") {
        onUpdate(data);
      }
    });

    return () => {
      if (orderId) {
        socket.emit("leave:order", orderId);
      }
      socket.disconnect();
    };
  }, [user?.id, user?._id, orderId]);

  return {
    socket: socketRef.current,
    connected,
    lastUpdate
  };
};

export default useOrderSocket;
