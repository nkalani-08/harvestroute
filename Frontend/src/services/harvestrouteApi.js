
const API_BASE_URL = "http://127.0.0.1:8000";

export async function getRecommendations({
  farmer_lat,
  farmer_lon,
  quantity_tonnes,
  crop = "Tomato",
  state,
  top_n = 5,
}) {
  const response = await fetch(
    `${API_BASE_URL}/recommendations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        farmer_lat,
        farmer_lon,
        quantity_tonnes,
        crop,
        state,
        top_n,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to fetch recommendations"
    );
  }

  return data;
}
