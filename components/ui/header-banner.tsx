import Image from "next/image";
import { getHeaderBanner } from "@/lib/actions/site-actions";

export default async function HeaderBanner() {
  const { image } = await getHeaderBanner();
  if (!image) {
    return null;
  }

  return (
    <div className="relative overflow-hidden">
      <div className="relative h-44 sm:h-120">
        <Image src={image} alt="Header banner image" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
    </div>
  );
}
