import ClientOnly from "@/components/ClientOnly";
import ProductsClient from "./ProductsClient";

export default function ProductsPage() {
  return (
    <ClientOnly>
      <ProductsClient />
    </ClientOnly>
  );
}
