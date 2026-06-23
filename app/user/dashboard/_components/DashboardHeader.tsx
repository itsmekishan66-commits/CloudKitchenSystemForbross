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
    <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome Back, {name.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Track your orders and favorite meals</p>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
          <p className="text-xs text-gray-400">{email}</p>
        </div>
      </div>
    </header>
  );
}
