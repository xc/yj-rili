import { WelcomeLine } from "@/components/WelcomeLine";

const agenda = [
  {
    time: "08:30",
    title: "Open the ledger",
    note: "Review yesterday's open threads.",
  },
  {
    time: "11:00",
    title: "Studio walk",
    note: "Collect materials for the afternoon block.",
  },
  {
    time: "15:40",
    title: "Quiet hour",
    note: "No meetings. Write the weekly note.",
  },
  {
    time: "19:00",
    title: "Close the day",
    note: "Mark what moved, leave the rest.",
  },
] as const;

function formatHeading(date: Date) {
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "long" }),
    rest: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export default function TodayPage() {
  const heading = formatHeading(new Date());

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-end justify-between border-b border-rule px-10 py-8">
        <div>
          <p className="text-[11px] tracking-[0.28em] uppercase text-cinnabar">
            Today
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none">
            {heading.weekday}
          </h1>
          <p className="mt-2 text-sm text-ink/50">{heading.rest}</p>
        </div>
        <WelcomeLine />
      </header>

      <div className="grid flex-1 gap-8 px-10 py-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <p className="mb-5 text-[11px] tracking-[0.22em] uppercase text-ink/40">
            Agenda
          </p>
          <ol className="divide-y divide-rule border-y border-rule">
            {agenda.map((item) => (
              <li
                key={item.time}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-6 py-5"
              >
                <span className="font-display text-xl text-cinnabar">
                  {item.time}
                </span>
                <div>
                  <p className="text-base">{item.title}</p>
                  <p className="mt-1 text-sm text-ink/50">{item.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="h-fit border border-rule bg-paper-deep/60 p-6">
          <p className="text-[11px] tracking-[0.22em] uppercase text-ink/40">
            Margin note
          </p>
          <p className="mt-4 font-display text-2xl leading-snug">
            Keep the day narrow.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink/55">
            Four marks on the page. Everything else can wait until tomorrow&apos;s
            paper.
          </p>
        </aside>
      </div>
    </div>
  );
}
