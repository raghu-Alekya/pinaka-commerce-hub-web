import StoreTaxonomy from "./StoreTaxonomy";
import "../styles/store-categories.css";

export default function StoreCategories(props) {
  return <StoreTaxonomy {...props} initialTab="categories" />;
}
