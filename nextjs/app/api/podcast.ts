import * as xml2js from 'xml2js';

interface Episode {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  enclosure: {
    url: string;
    length: number;
    type: string;
  };
}

function extractRssFeedUrl(input: string): string | null {
  const regex = /"feedUrl":"(https?:\/\/[^"]+\/rss)"/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

// function parsePodcastData(data: string): Episode[] {
//   const episodes: Episode[] = [];
//   const regex = /"streamUrl":\"(.*?\.m4a)\",\"releaseDate\":\"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\",\"title\":\"(.*?)\"/g;

//   // Loop through all matches using the global flag 'g' in the regex
//   let match;
//   while ((match = regex.exec(data)) !== null) {
//     const [, streamUrl, releaseDate, title] = match; // Destructuring assignment to extract captured groups
//     episodes.push({ title, releaseDate, streamUrl });
//   }

//   return episodes;
// }



async function parsePodcastData(xmlData: Promise<string>){
  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    const episodes: Episode[] = result.rss.channel[0].item.map((item: any) => ({
      title: item.title[0],
      description: item.description[0],
      link: item.link[0],
      pubDate: new Date(item.pubDate[0]),
      enclosure: {
        url: item.enclosure[0].$.url,
        length: parseInt(item.enclosure[0].$.length),
        type: item.enclosure[0].$.type,
      },
    }));

    return episodes;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
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
	  const rss_url = extractRssFeedUrl(data);
    if (!rss_url) {
      res.status(400).json({ error: "RSS feed URL not found" });
      return;
    }
    const rss_data_text = (await fetch(rss_url)).text();
	  const episodes = await parsePodcastData(rss_data_text);
    res.status(200).json(episodes); // Send raw response back to the client
  } catch (error) {
    console.error("Error fetching podcast feed:", error);
    res.status(500).json({ error: "Failed to fetch the podcast feed." });
  }
}
