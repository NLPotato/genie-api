export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "URL parameter is required" });
    return;
  }

  try {
    const response = await fetch(url);
    const data = await response.text(); // Use `.text()` for XML or raw text
    res.status(200).send(data); // Send raw response back to the client
  } catch (error) {
    console.error("Error fetching podcast feed:", error);
    res.status(500).json({ error: "Failed to fetch the podcast feed." });
  }
}
