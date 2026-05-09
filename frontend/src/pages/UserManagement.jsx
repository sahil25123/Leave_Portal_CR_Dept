import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import ErrorAlert from "../components/ErrorAlert";
import LoadingState from "../components/LoadingState";
import ResetPasswordModal from "../components/ResetPasswordModal";
import UserTable from "../components/UserTable";
import UserForm from "../components/forms/UserForm";
import {
  createUserRequest,
  getUsersRequest,
  resetUserPasswordRequest,
  updateUserRequest,
} from "../services/admin.service";
import { getApiErrorMessage } from "../services/api";
import { getEmailValidationMessage } from "../utils/emailValidation";
import { getPasswordValidationMessage } from "../utils/passwordValidation";

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
  const [toast, setToast] = useState(null);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [editingUserId, setEditingUserId] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
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

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

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
      email: user.email,
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
      email: "",
      role: "staff",
      designation: "",
    });
  }

  function openResetPassword(user) {
    setResetUser(user);
    setError("");
    setSuccess("");
  }

  function closeResetPassword() {
    setResetUser(null);
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  async function handleCreate(event) {
    event.preventDefault();

    const emailValidationMessage = getEmailValidationMessage(createForm.email);
    const passwordValidationMessage = getPasswordValidationMessage(
      createForm.password,
    );

    if (emailValidationMessage) {
      setError(emailValidationMessage);
      setSuccess("");
      return;
    }

    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      setSuccess("");
      return;
    }

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

    const emailValidationMessage = getEmailValidationMessage(editForm.email);

    if (emailValidationMessage) {
      setError(emailValidationMessage);
      setSuccess("");
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
      cancelEdit();
      showToast("success", "User updated successfully.");
    } catch (updateError) {
      const message = getApiErrorMessage(updateError, "Failed to update user");
      setError(message);
      showToast("error", message);
    } finally {
      setIsUpdateSubmitting(false);
    }
  }

  async function handleResetPassword(userId, payload) {
    await resetUserPasswordRequest(userId, payload);
    await loadUsers();
  }

  return (
    <AppShell
      title="User Management"
      subtitle="Create users and update role/designation assignments."
    >
      {toast ? (
        <div
          className={
            "fixed right-4 top-20 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg " +
            (toast.type === "error"
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-green-200 bg-green-50 text-green-700")
          }
        >
          {toast.message}
        </div>
      ) : null}

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
          <UserTable
            users={users}
            onEdit={startEdit}
            onResetPassword={openResetPassword}
          />
        )}
      </section>

      <ResetPasswordModal
        isOpen={Boolean(resetUser)}
        user={resetUser}
        onClose={closeResetPassword}
        onSubmit={handleResetPassword}
        onSuccess={(message, type = "success") => showToast(type, message)}
      />
    </AppShell>
  );
}

export default UserManagement;
