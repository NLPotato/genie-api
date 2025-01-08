interface Episode {
  title: string;
  releaseDate: string;
  streamUrl: string;
}

function parsePodcastData(data: string): Episode[] {
  const episodes: Episode[] = [];
  const regex = /"streamUrl":\"(.*?\.m4a)\",\"releaseDate\":\"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\",\"title\":\"(.*?)\"/g;

  // Loop through all matches using the global flag 'g' in the regex
  let match;
  while ((match = regex.exec(data)) !== null) {
    const [, streamUrl, releaseDate, title] = match; // Destructuring assignment to extract captured groups
    episodes.push({ title, releaseDate, streamUrl });
  }

  return episodes;
}

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "URL parameter is required" });
    return;
  }

  try {
    const response = await fetch(url);
    const data = await response.text(); // Use `.text()` for XML or raw text
	const episodes = parsePodcastData(data);
    res.status(200).json(episodes); // Send raw response back to the client
  } catch (error) {
    console.error("Error fetching podcast feed:", error);
    res.status(500).json({ error: "Failed to fetch the podcast feed." });
  }
}
