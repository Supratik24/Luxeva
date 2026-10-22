import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const SOCKET_URL = import.meta.env.VITE_ORDER_SOCKET_URL || import.meta.env.VITE_API_URL || "https://luxeva-alx6.onrender.com";

export const useOrderSocket = ({ orderId = null, onUpdate = null, onNotification = null } = {}) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;

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
      if (typeof onUpdateRef.current === "function") {
        onUpdateRef.current(data);
      }
      if (data?.notification && typeof onNotificationRef.current === "function") {
        onNotificationRef.current(data.notification);
      }
    });

    socket.on("notification:new", (notif) => {
      if (typeof onNotificationRef.current === "function") {
        onNotificationRef.current(notif);
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

