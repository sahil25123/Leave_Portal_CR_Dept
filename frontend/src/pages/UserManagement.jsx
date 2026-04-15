import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import UserTable from "../components/UserTable";
import UserForm from "../components/forms/UserForm";
import {
  createUserRequest,
  getUsersRequest,
  updateUserRequest,
} from "../services/admin.service";
import { getApiErrorMessage } from "../services/api";

const INITIAL_CREATE_FORM = {
  name: "",
  email: "",
  password: "",
  role: "staff",
  designation: "",
};

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "staff",
    designation: "",
  });

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) || null,
    [editingUserId, users],
  );

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const allUsers = await getUsersRequest();
      setUsers(allUsers);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Failed to load users"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function updateCreateField(field, value) {
    setCreateForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(user) {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      role: user.role,
      designation: user.designation,
    });
    setError("");
    setSuccess("");
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditForm({
      name: "",
      role: "staff",
      designation: "",
    });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsCreateSubmitting(true);

    try {
      const createdUser = await createUserRequest(createForm);
      setUsers((current) => [createdUser, ...current]);
      setCreateForm(INITIAL_CREATE_FORM);
      setSuccess("User created successfully.");
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Failed to create user"));
    } finally {
      setIsCreateSubmitting(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (!editingUserId) {
      return;
    }

    setError("");
    setSuccess("");
    setIsUpdateSubmitting(true);

    try {
      const updatedUser = await updateUserRequest(editingUserId, editForm);
      setUsers((current) =>
        current.map((user) =>
          user.id === updatedUser.id ? updatedUser : user,
        ),
      );
      setSuccess("User updated successfully.");
      cancelEdit();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Failed to update user"));
    } finally {
      setIsUpdateSubmitting(false);
    }
  }

  return (
    <AppShell
      title="User Management"
      subtitle="Create users and update role/designation assignments."
    >
      <ErrorAlert message={error} />
      {success ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <UserForm
          mode="create"
          values={createForm}
          onChange={updateCreateField}
          onSubmit={handleCreate}
          isSubmitting={isCreateSubmitting}
        />

        {editingUser ? (
          <UserForm
            mode="edit"
            values={editForm}
            onChange={updateEditField}
            onSubmit={handleUpdate}
            onCancel={cancelEdit}
            isSubmitting={isUpdateSubmitting}
          />
        ) : (
          <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Select a user from the table to edit details.
          </section>
        )}
      </section>

      <section className="mt-5">
        {isLoading ? (
          <LoadingState label="Loading users..." />
        ) : (
          <UserTable users={users} onEdit={startEdit} />
        )}
      </section>
    </AppShell>
  );
}

export default UserManagement;
