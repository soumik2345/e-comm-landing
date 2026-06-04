export default function FloatingContactButtons() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <a
        href="https://wa.me/message/OQTQLIGEWR4PI1"
        target="_blank"
        rel="noreferrer"
        className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:px-4 sm:py-3"
      >
        <img src="./whatsapp-brands-solid.svg" alt="WhatsApp" width={30} height={30} />
      </a>
      <a
        href="https://m.me/61584977369606"
        target="_blank"
        rel="noreferrer"
        className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 sm:px-4 sm:py-3"
      >
       <img src="./facebook-messenger-brands-solid.svg" alt="Messenger" width={30} height={30} />
        {/* <span className="hidden sm:inline">Messenger</span> */}
      </a>
    </div>
  );
}
