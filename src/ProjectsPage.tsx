import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Project {
  id: number;
  title: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  profiles?: {
    username: string | null;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [userId, setUserId] = useState<string | null>(null);

  // Pagination + search state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [page, search]);

  async function getUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  }

  async function fetchProjects() {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("projects")
      .select(
        `
        id,
        title,
        description,
        created_at,
        created_by,
        profiles ( username )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search.trim() !== "") {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) console.error(error.message);
    else {
      setProjects(data as Project[]);
      setTotalCount(count ?? 0);
    }
  }

  async function addProject() {
    if (!userId) {
      alert("Login required to create projects.");
      return;
    }
    const { error } = await supabase.from("projects").insert([
      {
        title: newProject.title,
        description: newProject.description,
        created_by: userId,
      },
    ]);
    if (error) console.error(error.message);
    else {
      setNewProject({ title: "", description: "" });
      fetchProjects();
    }
  }

  function startEdit(project: Project) {
    setEditingProject(project);
    setForm({
      title: project.title ?? "",
      description: project.description ?? "",
    });
  }

  async function saveEdit() {
    if (!editingProject) return;
    const { error } = await supabase
      .from("projects")
      .update({ title: form.title, description: form.description })
      .eq("id", editingProject.id);
    if (error) console.error(error.message);
    else {
      setEditingProject(null);
      fetchProjects();
    }
  }

  async function deleteProject(id: number) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) console.error(error.message);
    else fetchProjects();
  }

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      {/* Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <input
          className="form-input w-64"
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by title or description"
        />
        <span className="text-sm text-gray-500">
          Showing {projects.length} of {totalCount} projects
        </span>
      </div>

{/* Mobile: Card layout */}
<div className="grid gap-4 sm:hidden">
  {projects.map((p) => (
    <div key={p.id} className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold">{p.title}</h3>
      <p className="text-gray-600">{p.description}</p>
      <p className="text-sm text-gray-500">
        Created by {p.profiles?.username ?? "Unknown"}
      </p>
      <p className="text-sm text-gray-500">
        Created at {new Date(p.created_at).toLocaleDateString()}
      </p>

      <div className="mt-3 flex space-x-2">
        {userId === p.created_by && (
          <>
            <button
              onClick={() => startEdit(p)}
              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={() => deleteProject(p.id)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  ))}

  {projects.length === 0 && (
    <p className="text-center text-gray-500">No projects found.</p>
  )}
</div>

    {/* Desktop/Tablet: Table layout */}
    <div className="hidden sm:block overflow-x-auto shadow rounded-lg">
      <table className="min-w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Created By</th>
            <th className="px-4 py-3">Created At</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{p.title}</td>
              <td className="px-4 py-3">{p.description}</td>
              <td className="px-4 py-3">{p.profiles?.username ?? "Unknown"}</td>
              <td className="px-4 py-3">
                {new Date(p.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 space-x-2">
                {userId === p.created_by && (
                  <>
                    <button
                      onClick={() => startEdit(p)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                No projects found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-muted"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="btn-muted"
        >
          Next
        </button>
      </div>

      {/* Create New Project Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Project
        </button>
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            <input
              className="form-input mb-3"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
            />
            <textarea
              className="form-input mb-3"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={saveEdit} className="btn-primary">
                Save
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <input
              className="w-full border rounded-md p-2 mb-3"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              placeholder="Project title"
            />
            <textarea
              className="w-full border rounded-md p-2 mb-3"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              placeholder="Project description"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={async () => {
                  await addProject();
                  setShowCreateModal(false);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Project
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
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
