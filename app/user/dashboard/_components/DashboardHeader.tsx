interface DashboardHeaderProps {
  name: string;
  email: string | null;
}

export default function DashboardHeader({ name, email }: DashboardHeaderProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome Back, {name.split(" ")[0]} 👋
        </h1>
        <p className="text-zinc-400 mt-1">Track your orders and favorite meals</p>
      </div>

      <div className="flex items-center gap-3 bg-zinc-800 px-4 py-2.5 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        <div>
          <h4 className="font-semibold text-white text-sm">{name}</h4>
          <p className="text-xs text-zinc-500">{email}</p>
        </div>
      </div>
    </header>
  );
}
