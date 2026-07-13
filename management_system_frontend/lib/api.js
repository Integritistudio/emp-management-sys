const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const inflightGets = new Map();

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || "GET").toUpperCase();

  if (method === "GET" && inflightGets.has(url)) {
    return inflightGets.get(url);
  }

  const run = async () => {
    const config = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    let response;

    try {
      response = await fetch(url, config);
    } catch {
      throw new ApiError(
        "Cannot reach the server. Make sure the backend is running on port 5000.",
        0,
        null
      );
    }

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const fallbackMessage =
        response.status === 429
          ? "Too many requests, please try again later."
          : "Something went wrong";
      throw new ApiError(
        data?.message || fallbackMessage,
        response.status,
        data
      );
    }

    return data;
  };

  if (method === "GET") {
    const promise = run();
    inflightGets.set(url, promise);
    promise.finally(() => inflightGets.delete(url));
    return promise;
  }

  return run();
}

async function downloadPost(endpoint, body, filename) {
  const url = `${API_BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Make sure the backend is running on port 5000.",
      0,
      null
    );
  }

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    throw new ApiError(
      data?.message || "Download failed",
      response.status,
      data
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export const api = {
  get: (endpoint, params) =>
    request(`${endpoint}${buildQuery(params)}`, { method: "GET" }),
  post: (endpoint, body) =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body) =>
    request(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
  downloadPost,
};

export { ApiError, buildQuery };
