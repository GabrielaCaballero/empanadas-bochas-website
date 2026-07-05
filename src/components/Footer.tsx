export default function Footer() {
  return (
    <footer className="border-t border-maroon/10 bg-maroon text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg">Empanadas Bochas</p>
          <p className="mt-1 text-sm text-cream/80">
            Homemade Argentine empanadas · NYC
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm text-cream/80 sm:text-right">
          <a
            href="https://www.instagram.com/empanadasbochas/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-background"
          >
            @empanadasbochas
          </a>
          <a href="mailto:empanadasbochas@gmail.com" className="hover:text-background">
            empanadasbochas@gmail.com
          </a>
          <a href="tel:+19178303570" className="hover:text-background">
            +1 (917) 830-3570
          </a>
        </div>
      </div>
    </footer>
  );
}
