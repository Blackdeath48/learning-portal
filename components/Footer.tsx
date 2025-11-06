export default function Footer() {
  return (
    <footer className="border-t border-secondary/20 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-6 text-sm text-secondary md:flex-row md:items-center md:px-8">
        <p>&copy; {new Date().getFullYear()} EthixLearn. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
          <a href="#" className="hover:underline">
            Accessibility
          </a>
          <a href="#" className="hover:underline">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
