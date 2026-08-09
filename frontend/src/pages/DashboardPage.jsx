import { useAuthStore } from "../store/useAuthStore";

const DashboardPage = () => {
  const { authUser, logout } = useAuthStore();

  return (
    <div className="min-h-screen p-10 text-white bg-slate-950">
      <h1 className="mb-8 text-4xl font-bold">
        Welcome {authUser?.fullName}
      </h1>

      <div className="space-y-3">

        <p>Email: {authUser?.email}</p>

        <p>
          Personal Room:
          {" "}
          {authUser?.personalRoomId}
        </p>

        <button
          onClick={logout}
          className="px-5 py-2 bg-red-600 rounded-lg"
        >
          Logout
        </button>

      </div>
    </div>
  );
};

export default DashboardPage;
