const notes = [
  {
    title: "Paper weight",
    body: "Use the heavier stock for the monthly spread. It holds ink without feathering.",
  },
  {
    title: "Red seal",
    body: "Mark only the days that changed the week. The rest stay quiet.",
  },
  {
    title: "Evening close",
    body: "One sentence is enough. Tomorrow will arrive whether we over-write it or not.",
  },
] as const;

export default function NotesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule px-10 py-8">
        <p className="text-[11px] tracking-[0.28em] uppercase text-cinnabar">
          Notes
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none">Margin</h1>
      </header>

      <div className="grid gap-5 px-10 py-10 md:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => (
          <article
            key={note.title}
            className="border border-rule bg-paper-deep/50 p-6"
          >
            <h2 className="font-display text-2xl">{note.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">{note.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
