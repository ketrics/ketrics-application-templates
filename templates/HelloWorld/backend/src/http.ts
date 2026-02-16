/**
 * HTTP Client Examples
 *
 * Demonstrates making external HTTP requests using ketrics.http.
 * The HTTP client supports GET, POST, PUT, and DELETE methods.
 */

/**
 * Fetch data from an external API.
 */
const fetchExternalApi = async (payload: { url?: string }) => {
  const url = payload?.url || "https://jsonplaceholder.typicode.com/posts/1";

  const response = await ketrics.http.get<{ id: number; title: string; body: string }>(url);

  return {
    data: response,
    fetchedAt: new Date().toISOString(),
  };
};

export { fetchExternalApi };
