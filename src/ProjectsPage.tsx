import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useFormWithValidation } from "./hooks/useFormWithValidation";
import ValidationError from "./ValidationError";

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
  const [userId, setUserId] = useState<string | null>(null);

  // Pagination + search state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  // ✅ Unified form for both create + edit
  const projectForm = useFormWithValidation(
    { title: "", description: "" },
    ["title", "description"]
  );

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
    if (!projectForm.validate()) return false;
    if (!userId) {
      alert("Login required to create projects.");
      return false;
    }

    const { error } = await supabase.from("projects").insert([
      {
        title: projectForm.values.title.trim(),
        description: projectForm.values.description.trim(),
        created_by: userId,
      },
    ]);

    if (error) {
      console.error(error.message);
      return false;
    }

    projectForm.reset();
    fetchProjects();
    return true;
  }

  function startEdit(project: Project) {
    setEditingProject(project);
    projectForm.reset({
      title: project.title ?? "",
      description: project.description ?? "",
    });
    setShowModal(true);
  }

  async function saveEdit() {
    if (!editingProject) return false;
    if (!projectForm.validate()) return false;

    const { error } = await supabase
      .from("projects")
      .update({
        title: projectForm.values.title.trim(),
        description: projectForm.values.description.trim(),
      })
      .eq("id", editingProject.id);

    if (error) {
      console.error(error.message);
      return false;
    }

    setEditingProject(null);
    projectForm.reset();
    fetchProjects();
    return true;
  }

  async function deleteProject(id: number) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) console.error(error.message);
    else fetchProjects();
  }

  // pagination
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

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

      {/* Mobile layout */}
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
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this project?")) {
                        deleteProject(p.id);
                      }
                    }}
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

      {/* Desktop layout */}
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
                <td className="px-4 py-3">
                  {p.profiles?.username ?? "Unknown"}
                </td>
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
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this project?")) {
                            deleteProject(p.id);
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

      {/* pagination buttons */}
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

      {/* New Project Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingProject(null); // new project
            projectForm.reset();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Project
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal">
            <h2 className="text-xl font-semibold mb-4">
              {editingProject ? "Edit Project" : "Create New Project"}
            </h2>

            <input
              className="form-input mb-1"
              value={projectForm.values.title}
              onChange={(e) => projectForm.handleChange("title", e.target.value)}
              placeholder="Title"
            />
            <ValidationError message={projectForm.errors.title} />

            <textarea
              className="form-input mb-1"
              value={projectForm.values.description}
              onChange={(e) =>
                projectForm.handleChange("description", e.target.value)
              }
              placeholder="Description"
            />
            <ValidationError message={projectForm.errors.description} />

            <div className="flex justify-end space-x-2">
              <button
                onClick={async () => {
                  const ok = editingProject
                    ? await saveEdit()
                    : await addProject();
                  if (ok) setShowModal(false);
                }}
                className="btn-primary"
              >
                {editingProject ? "Save" : "Add Project"}
              </button>
              <button
                onClick={() => {
                  projectForm.reset();
                  setEditingProject(null);
                  setShowModal(false);
                }}
                className="btn-secondary"
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
