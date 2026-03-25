import { getRedisSubscriber } from "@luxeva/shared";
import Notification from "./models/Notification.js";

export const startOrderSubscriber = async () => {
  const subscriber = getRedisSubscriber();

  await subscriber.subscribe("orders.events");
  subscriber.on("message", async (channel, message) => {
    if (channel !== "orders.events") {
      return;
    }

    const event = JSON.parse(message);

    if (event.type === "order.created") {
      await Notification.create({
        userId: event.userId,
        type: "order",
        title: "Order confirmed",
        message: `Your order ${event.orderNumber} was placed successfully.`,
        link: `/dashboard/orders/${event.orderId}`
      });
    }

    if (event.type === "order.updated") {
      await Notification.create({
        userId: event.userId,
        type: "order",
        title: "Order update",
        message: `Order ${event.orderNumber} is now ${event.status}.`,
        link: `/dashboard/orders/${event.orderId}`
      });
    }
  });
};

