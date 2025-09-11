import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useSession } from "./SessionContext";
import { useFormWithValidation } from "./hooks/useFormWithValidation";
import ValidationError from "./ValidationError";
import { useLocation } from "react-router";

interface Task {
	id: number;
	title: string | null;
	description: string | null;
	due_date: string | null;
	priority: string | null;
	status: string | null;
	created_by: string | null;
	created_at: string;
	project_id: number | null;
	projects?: { title: string | null };
	profiles?: { username: string | null }; // creator
	tasks_assigned_users?: { profiles?: { username: string | null; id: string } }[];
}

interface Project {
	id: number;
	title: string | null;
}

interface UserProfile {
		id: string;
		username: string | null;
}

export default function TasksPage() {
	const { session } = useSession();

	const [tasks, setTasks] = useState<Task[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);

	// Pagination + filters
	const [page, setPage] = useState(1);
	const [pageSize] = useState(5);
	const [totalCount, setTotalCount] = useState(0);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [priorityFilter, setPriorityFilter] = useState<string>("");
	const [assignedFilter, setAssignedFilter] = useState<string>("");

	const location = useLocation();
	const params = new URLSearchParams(location.search);
	const initialProject = params.get("project") ?? "";
	const [projectFilter, setProjectFilter] = useState<string>(initialProject);

	// Single combined modal
	const [showModal, setShowModal] = useState(false);

	// ✅ Unified form for both Create + Edit
	const taskForm = useFormWithValidation(
		{
			title: "",
			description: "",
			due_date: "",
			priority: "MEDIUM",
			status: "TO DO",
			project_id: "",
			assigned_user: "",
		},
		["title", "description", "project_id", "due_date"]
	);

  // Load user, projects, users
  useEffect(() => {
    getUser();
    fetchProjects();
    fetchUsers();
  }, []);

  // Track session user id when available
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
			fetchRole(session.user.id);
    }
  }, [session]);

// Fetch tasks when filters/pagination change
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, projectFilter, statusFilter, priorityFilter, assignedFilter]);

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  }

	async function fetchRole(userId: string) {
		const { data, error } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", userId)
			.single();

		if (error) {
			console.error("Error fetching role:", error.message);
		} else {
			setRole(data.role);
		}
	}

  async function fetchProjects() {
    const { data, error } = await supabase.from("projects").select("id, title");
    if (error) console.error("Error fetching projects:", error.message);
    else setProjects(data as Project[]);
  }

  async function fetchUsers() {
    const { data, error } = await supabase.from("profiles").select("id, username");
    if (error) console.error("Error fetching users:", error.message);
    else setUsers(data as UserProfile[]);
  }

  async function fetchTasks() {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // - When assignedFilter is set, use an inner join to require an assignee match.
    // - Otherwise, allow tasks with or without an assignee.
    const selectNoAssignee = `
      id,
      title,
      description,
      due_date,
      priority,
      status,
      created_by,
      created_at,
      project_id,
      projects ( title ),
      profiles ( username ),
      tasks_assigned_users (
        user_id,
        profiles ( id, username )
      )
    `;

    const selectWithAssignee = `
      id,
      title,
      description,
      due_date,
      priority,
      status,
      created_by,
      created_at,
      project_id,
      projects ( title ),
      profiles ( username ),
      tasks_assigned_users!inner (
        user_id,
        profiles ( id, username )
      )
    `;

    const select = assignedFilter ? selectWithAssignee : selectNoAssignee;

    let query = supabase
      .from("tasks")
      .select(select, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search.trim() !== "") {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (projectFilter) query = query.eq("project_id", Number(projectFilter));
    if (statusFilter) query = query.eq("status", statusFilter);
    if (priorityFilter) query = query.eq("priority", priorityFilter);
    if (assignedFilter) {
      query = query.eq("tasks_assigned_users.user_id", assignedFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error(error.message);
    } else {
      setTasks(data as Task[]);
      setTotalCount(count ?? 0);
    }
  }

  // Create
  async function addTask() {
    if (!taskForm.validate()) return false;
    if (!userId) {
      alert("Login required to create tasks.");
      return false;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title: taskForm.values.title.trim(),
          description: taskForm.values.description.trim(),
          due_date: taskForm.values.due_date || null,
          priority: taskForm.values.priority,
          status: taskForm.values.status,
          project_id: taskForm.values.project_id
            ? Number(taskForm.values.project_id)
            : null,
          created_by: userId,
        },
      ])
      .select();

    if (error) {
      console.error(error.message);
      return false;
    }

    const taskId = data?.[0]?.id;
    if (taskId) {
      await supabase.from("tasks_assigned_users").delete().eq("task_id", taskId);
      if (taskForm.values.assigned_user) {
        await supabase.from("tasks_assigned_users").insert([
          { task_id: taskId, user_id: taskForm.values.assigned_user },
        ]);
      }
    }

    taskForm.reset();
    fetchTasks();
    return true;
  }

  function startEdit(task: Task) {
    setEditingTask(task);
    taskForm.reset({
      title: task.title ?? "",
      description: task.description ?? "",
      due_date: task.due_date ?? "",
      priority: task.priority ?? "MEDIUM",
      status: task.status ?? "TO DO",
      project_id: task.project_id ? String(task.project_id) : "",
      assigned_user: task.tasks_assigned_users?.[0]?.profiles?.id ?? "",
    });
    setShowModal(true);
  }

  async function saveEdit() {
    if (!editingTask) return false;
    if (!taskForm.validate()) return false;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: taskForm.values.title.trim(),
        description: taskForm.values.description.trim(),
        due_date: taskForm.values.due_date || null,
        priority: taskForm.values.priority,
        status: taskForm.values.status,
        project_id: taskForm.values.project_id
          ? Number(taskForm.values.project_id)
          : null,
      })
      .eq("id", editingTask.id);

    if (error) {
      console.error(error.message);
      return false;
    }

    await supabase.from("tasks_assigned_users").delete().eq("task_id", editingTask.id);
    if (taskForm.values.assigned_user) {
      await supabase.from("tasks_assigned_users").insert([
        { task_id: editingTask.id, user_id: taskForm.values.assigned_user },
      ]);
    }

    setEditingTask(null);
    taskForm.reset();
    fetchTasks();
    return true;
  }

    async function deleteTask(id: number) {
    // Step 1: delete related assignments
    const { error: assignError } = await supabase
        .from("tasks_assigned_users")
        .delete()
        .eq("task_id", id);

    if (assignError) {
        console.error("Error deleting task assignments:", assignError.message);
        return;
    }

    // Step 2: delete the task itself
    const { error: taskError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (taskError) {
        console.error("Error deleting task:", taskError.message);
        return;
    }

    // Step 3: refresh list
    fetchTasks();
    }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tasks</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="form-input w-64"
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by title or description..."
          />

          <select
            className="form-input w-64"
            value={projectFilter}
            onChange={(e) => {
              setPage(1);
              setProjectFilter(e.target.value);
            }}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            className="form-input w-32"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">All Statuses</option>
            <option value="TO DO">To Do</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>

          <select
            className="form-input w-32"
            value={priorityFilter}
            onChange={(e) => {
              setPage(1);
              setPriorityFilter(e.target.value);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <select
            className="form-input w-32"
            value={assignedFilter}
            onChange={(e) => {
              setPage(1);
              setAssignedFilter(e.target.value);
            }}
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username ?? u.id}
              </option>
            ))}
          </select>
        </div>

        <span className="text-sm text-gray-500">
          Showing {tasks.length} of {totalCount} tasks
        </span>
      </div>

      {/* Mobile layout */}
      <div className="grid gap-4 sm:hidden">
        {tasks.map((t) => (
          <div key={t.id} className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold">
              <button
                onClick={() => startEdit(t)}
                className="cursor-pointer hover:text-blue-700"
              >
                {t.title}
              </button>
            </h3>
            <p className="text-gray-600 mb-2">{t.description}</p>

            <div className="text-sm text-gray-500 space-y-1">
              <p>
                <span className="font-medium">Project:</span>{" "}
                {t.projects?.title ?? "—"}
              </p>
              <p>
                <span className="font-medium">Assigned To:</span>{" "}
                {t.tasks_assigned_users?.[0]?.profiles?.username ?? "Unassigned"}
              </p>
              <p>
                <span className="font-medium">Due Date:</span>{" "}
                {t.due_date ?? "—"}
              </p>
              <p>
                <span className="font-medium">Priority:</span> {t.priority}
              </p>
              <p>
                <span className="font-medium">Status:</span> {t.status}
              </p>
              <p>
                <span className="font-medium">Created By:</span>{" "}
                {t.profiles?.username ?? "Unknown"}
              </p>
            </div>

            {(userId === t.created_by || role === "Project manager" || role === "Administrator") && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => startEdit(t)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                            deleteTask(t.id);
                        }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                    Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <p className="text-center text-gray-500">No tasks found.</p>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:block overflow-x-auto shadow rounded-lg">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <button
                    onClick={() => startEdit(t)}
                    className="cursor-pointer hover:text-blue-700"
                  >
                    {t.title}
                  </button>
                </td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3">{t.projects?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  {t.tasks_assigned_users?.[0]?.profiles?.username ?? "Unassigned"}
                </td>
                <td className="px-4 py-3">{t.due_date ?? "—"}</td>
                <td className="px-4 py-3">{t.priority}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">{t.profiles?.username ?? "Unknown"}</td>
                <td className="px-4 py-3 space-x-2">
                  {(userId === t.created_by || role === "Project manager" || role === "Administrator") && (
                    <>
                      <button
                        onClick={() => startEdit(t)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                    <button
                    onClick={() => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                        deleteTask(t.id);
                        }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                    Delete
                    </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-3 text-center text-gray-500">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">Page {page} of {totalPages || 1}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Create New Task Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingTask(null); // create mode
            taskForm.reset({
              title: "",
              description: "",
              due_date: "",
              priority: "MEDIUM",
              status: "TO DO",
              project_id: "",
              assigned_user: "",
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>

            {/* Title */}
            <input
              className="form-input mb-1"
              value={taskForm.values.title}
              onChange={(e) => taskForm.handleChange("title", e.target.value)}
              placeholder="Title"
            />
            <ValidationError message={taskForm.errors.title} />

            {/* Description */}
            <textarea
              className="form-input mb-1"
              value={taskForm.values.description}
              onChange={(e) => taskForm.handleChange("description", e.target.value)}
              placeholder="Description"
            />
            <ValidationError message={taskForm.errors.description} />

            {/* Due Date */}
            <input
              type="date"
              className="form-input mb-3"
              value={taskForm.values.due_date}
              onChange={(e) => taskForm.handleChange("due_date", e.target.value)}
            />
            <ValidationError message={taskForm.errors.due_date} />

            {/* Priority */}
            <select
              className="form-input mb-3"
              value={taskForm.values.priority}
              onChange={(e) => taskForm.handleChange("priority", e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* Status */}
            <select
              className="form-input mb-3"
              value={taskForm.values.status}
              onChange={(e) => taskForm.handleChange("status", e.target.value)}
            >
              <option value="TO DO">To Do</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>

            {/* Project */}
            <select
              className="form-input mb-3"
              value={taskForm.values.project_id}
              onChange={(e) => taskForm.handleChange("project_id", e.target.value)}
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ValidationError message={taskForm.errors.project_id} />

            {/* Assignee */}
            <select
              className="form-input mb-3"
              value={taskForm.values.assigned_user}
              onChange={(e) => taskForm.handleChange("assigned_user", e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username ?? u.id}
                </option>
              ))}
            </select>

            <div className="flex justify-end space-x-2">
              <button
                onClick={async () => {
                  const ok = editingTask ? await saveEdit() : await addTask();
                  if (ok) setShowModal(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingTask ? "Save" : "Add Task"}
              </button>
              <button
                onClick={() => {
                  taskForm.reset();       // ✅ clears values + errors
                  setEditingTask(null);
                  setShowModal(false);
                }}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
