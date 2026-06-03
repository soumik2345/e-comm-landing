import { getServiceCards } from "@/lib/actions/site-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ServiceCards() {
  const serviceItems = await getServiceCards();

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {serviceItems.map((service) => (
        <Card key={service.title} className="overflow-hidden border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <CardHeader className="space-y-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-100 text-3xl">
              {service.icon || "⭐"}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-900">{service.title}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-zinc-600">{service.description}</CardDescription>
            </div>
          </CardHeader>
         
        </Card>
      ))}
    </div>
  );
}
