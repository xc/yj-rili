function buildMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];

  const offset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  return {
    label: date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    today: date.getDate(),
    cells,
  };
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const month = buildMonth(new Date());

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule px-10 py-8">
        <p className="text-[11px] tracking-[0.28em] uppercase text-cinnabar">
          Calendar
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none">{month.label}</h1>
      </header>

      <div className="px-10 py-10">
        <div className="grid grid-cols-7 gap-px border border-rule bg-rule">
          {weekdays.map((day) => (
            <div
              key={day}
              className="bg-paper px-3 py-3 text-[11px] tracking-[0.16em] uppercase text-ink/45"
            >
              {day}
            </div>
          ))}
          {month.cells.map((day, index) => (
            <div
              key={`${day ?? "empty"}-${index}`}
              className="min-h-24 bg-paper px-3 py-3"
            >
              {day ? (
                <span
                  className={
                    day === month.today
                      ? "inline-flex size-8 items-center justify-center rounded-full bg-cinnabar font-display text-paper"
                      : "font-display text-lg text-ink/80"
                  }
                >
                  {day}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
