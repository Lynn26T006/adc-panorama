import ClientOnly from "@/components/ClientOnly";
import FormulationClient from "./FormulationClient";

export default function FormulationPage() {
  return (
    <ClientOnly>
      <FormulationClient />
    </ClientOnly>
  );
}
