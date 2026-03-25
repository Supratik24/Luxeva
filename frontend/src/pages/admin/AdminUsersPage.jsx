import { useEffect, useState } from "react";
import api, { endpoints } from "../../services/api";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);

  const load = () => api.get(endpoints.auth.users).then(({ data }) => setUsers(data.users || []));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <div className="mt-6 space-y-4">
        {users.map((user) => (
          <div key={user._id} className="rounded-[1.8rem] border border-ink/10 p-5 dark:border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-ink/50 dark:text-white/50">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={user.role}
                  onChange={async (e) => {
                    await api.patch(`${endpoints.auth.users}/${user._id}`, { role: e.target.value, isActive: user.isActive, name: user.name, phone: user.phone });
                    await load();
                  }}
                  className="rounded-full border border-ink/10 bg-transparent px-4 py-2 text-sm outline-none dark:border-white/10"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    await api.patch(`${endpoints.auth.users}/${user._id}`, { role: user.role, isActive: !user.isActive, name: user.name, phone: user.phone });
                    await load();
                  }}
                  className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  {user.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsersPage;

