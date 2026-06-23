export default function Topbar() {
  return (
    <header
      className="
      bg-white
      shadow-sm
      px-4
      sm:px-6
      py-4
      flex
      justify-between
      items-center
    "
    >
      <h2 className="text-xl font-bold sm:text-2xl">Admin Dashboard</h2>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <h3 className="font-semibold">Admin</h3>
          <p className="text-sm text-gray-500">Administrator</p>
        </div>
      </div>
    </header>
  );
}
