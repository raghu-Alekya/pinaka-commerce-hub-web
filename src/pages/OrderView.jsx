import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ordersSeed } from "../data/data";
import { orderFields } from "../data/orderFields";
import ReadOnlyDetails from "../components/ReadOnlyDetails";
import "../styles/view-details-modal.css";

export default function OrderView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const order = (ordersSeed || []).find((item) => String(item.id) === orderId);
  const section = (title, keys) => ({
    title,
    fields: keys.map((key) => {
      const field = orderFields.find((item) => item.key === key);
      return {
        ...field,
        render: (value, data) => {
          if (
            value == null ||
            (typeof value === "string" && (!value.trim() || value.trim() === "—")) ||
            (Array.isArray(value) && value.length === 0)
          ) {
            return "Not provided";
          }
          const rendered = field.render ? field.render(value, data) : value;
          return rendered === "—" ? "Not provided" : rendered;
        },
      };
    }),
  });
  return <ReadOnlyDetails title="View Order"
    subtitle="View order information, customer details, payment details, and transaction information."
    listLabel="Orders" onBack={() => navigate(location.state?.backTo || "/orders")}
    data={order} message={!order ? "Order not found." : ""}
    sections={[
      section("Order Information", ["wooOrderId", "offlineOrderId", "date", "time", "status", "author", "salesChannel", "storeName", "storeId"]),
      section("Customer Information", ["customer", "customerName", "customerEmail"]),
      section("Payment and Transaction Information", ["paymentMethod", "subtotal", "discount", "tax", "total", "totalValue", "items"]),
    ]} />;
}
