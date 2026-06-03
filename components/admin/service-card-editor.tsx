"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ServiceCardItem = {
  icon: string;
  title: string;
  description: string;
};

type ServiceCardEditorProps = {
  initialCards: ServiceCardItem[];
};

export default function ServiceCardEditor({ initialCards }: ServiceCardEditorProps) {
  const [cards, setCards] = useState<ServiceCardItem[]>(initialCards);

  const addCard = () => setCards((current) => [...current, { icon: "", title: "", description: "" }]);
  const removeCard = (index: number) => setCards((current) => current.filter((_, idx) => idx !== index));
  const updateCard = (index: number, field: keyof ServiceCardItem, value: string) =>
    setCards((current) =>
      current.map((card, idx) => (idx === index ? { ...card, [field]: value } : card))
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {cards.map((card, index) => (
          <div key={index} className="rounded-3xl border border-zinc-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Service {index + 1}</h3>
              {cards.length > 1 ? (
                <Button type="button" variant="outline" onClick={() => removeCard(index)}>
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`serviceIcon-${index}`}>Icon</Label>
                <Input
                  id={`serviceIcon-${index}`}
                  name={`serviceIcon-${index}`}
                  value={card.icon}
                  onChange={(event) => updateCard(index, "icon", event.target.value)}
                  placeholder="Emoji or icon"
                />
              </div>
              <div>
                <Label htmlFor={`serviceTitle-${index}`}>Title</Label>
                <Input
                  id={`serviceTitle-${index}`}
                  name={`serviceTitle-${index}`}
                  value={card.title}
                  onChange={(event) => updateCard(index, "title", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`serviceDescription-${index}`}>Description</Label>
                <Input
                  id={`serviceDescription-${index}`}
                  name={`serviceDescription-${index}`}
                  value={card.description}
                  onChange={(event) => updateCard(index, "description", event.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={addCard}>
          Add Service Card
        </Button>
        {cards.length > 1 ? (
          <span className="text-sm text-zinc-500">You can remove cards individually.</span>
        ) : (
          <span className="text-sm text-zinc-500">At least one service card is required.</span>
        )}
      </div>
      <input type="hidden" name="serviceCount" value={cards.length} />
    </div>
  );
}
