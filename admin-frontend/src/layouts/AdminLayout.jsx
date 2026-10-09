import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center px-6">
          <h1 className="text-xl font-semibold text-gray-800">Hệ thống quản trị</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
