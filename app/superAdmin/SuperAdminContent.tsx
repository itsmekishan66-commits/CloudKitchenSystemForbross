"use client";

import {
  Users,
  Briefcase,
  ClipboardList,
  CheckCircle,
  Clock,
  Settings,
  Bell,
  TrendingUp,
  Activity,
  UserCheck,
} from "lucide-react";

export default function SuperAdminContent() {
  const stats = [
    {
      title: "Total Employees",
      value: 128,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Active Teams",
      value: 12,
      icon: Briefcase,
      color: "bg-green-500",
    },
    {
      title: "Tasks In Progress",
      value: 45,
      icon: ClipboardList,
      color: "bg-orange-500",
    },
    {
      title: "Completed Tasks",
      value: 893,
      icon: CheckCircle,
      color: "bg-purple-500",
    },
  ];

  const workers = [
    {
      name: "John Doe",
      department: "Development",
      task: "Build Payment API",
      status: "Working",
    },
    {
      name: "Sarah Smith",
      department: "HR",
      task: "Employee Onboarding",
      status: "Completed",
    },
    {
      name: "Michael Lee",
      department: "Marketing",
      task: "Campaign Design",
      status: "Review",
    },
    {
      name: "Emma Brown",
      department: "Finance",
      task: "Invoice Verification",
      status: "Working",
    },
  ];

  const activities = [
    "John completed Task #204",
    "Finance Team approved payroll",
    "Marketing Team started Campaign X",
    "New employee joined Development Team",
    "System backup completed successfully",
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Super Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            System Configuration • Team Overview • Worker Monitoring
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-3 bg-white rounded-xl shadow">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              4
            </span>
          </button>

          <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-xl">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl shadow-md p-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-sm">{item.title}</p>
                <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
              </div>
              <div className={`${item.color} p-4 rounded-xl text-white`}>
                <item.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck className="text-blue-600" />
            <h2 className="text-xl font-bold">
              Workers & Task Progress
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Worker</th>
                  <th className="text-left py-3">Department</th>
                  <th className="text-left py-3">Current Task</th>
                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="py-4 font-medium">{worker.name}</td>
                    <td>{worker.department}</td>
                    <td>{worker.task}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          worker.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : worker.status === "Review"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {worker.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-green-600" />
            <h2 className="text-xl font-bold">Recent Activities</h2>
          </div>

          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <p className="text-sm text-slate-700">{activity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-600" />
            <h3 className="font-bold text-lg">Productivity Rate</h3>
          </div>
          <p className="text-5xl font-bold text-green-600">92%</p>
          <p className="text-slate-500 mt-2">
            Overall office productivity this month.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-orange-600" />
            <h3 className="font-bold text-lg">Pending Approvals</h3>
          </div>
          <p className="text-5xl font-bold text-orange-500">14</p>
          <p className="text-slate-500 mt-2">
            Tasks waiting for manager review.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-purple-600" />
            <h3 className="font-bold text-lg">System Health</h3>
          </div>
          <p className="text-5xl font-bold text-purple-600">99%</p>
          <p className="text-slate-500 mt-2">
            Servers and services running normally.
          </p>
        </div>
      </div>
    </>
  );
}
