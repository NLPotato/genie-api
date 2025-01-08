import * as xml2js from 'xml2js';
import { NextResponse } from 'next/server';

 // Start of Selection
interface RSSItem {
  title: string;
  description: string;
  link: string;
  guid: string;
  creator: string;
  pubDate: string;
  enclosure: {
    url: string;
    length: string;
    type: string;
  };
  itunes: {
    summary: string;
    explicit: string;
    duration: string;
    image: {
      href: string;
    };
    season: number;
    episode: number;
    episodeType: string;
  };
}
  
interface Episode {
  title: string;
  link: string;
  pubDate: string;
  enclosure: {
    url: string;
    length: string;
    type: string;
  };
}

function extractRSSFeedUrl(input: string): string | null {
  const regex = /"feedUrl":"(https?:\/\/[^"]+\/rss)"/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

async function parsePodcastData(xmlData: string){
  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);

    const episodes: Episode[] = result.rss.channel[0].item.map((item: RSSItem) => ({
      title: item.title[0],
      link: item.link[0],
      pubDate: item.pubDate[0],
      enclosure: {
        url: item.enclosure.url,
        length: item.enclosure.length,
        type: item.enclosure.type,
      },
    }));

    return episodes;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
}

export default async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const urlDecoded = decodeURIComponent(url as string);

  if (!urlDecoded) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }
  console.log(`fetching: ${urlDecoded}`);
  try {
    const response = await fetch(urlDecoded);
    const data = await response.text(); // Use `.text()` for XML or raw text
    const rss_url = extractRSSFeedUrl(data);
    if (!rss_url) {
      return NextResponse.json({ error: "RSS feed URL not found" }, { status: 400 });
    }
    const rss_data_text = await (await fetch(rss_url)).text();
    const episodes = await parsePodcastData(rss_data_text);
    return NextResponse.json(episodes); // Send raw response back to the client
  } catch (error) {
    console.error("Error fetching podcast feed:", error);
    return NextResponse.json({ error: "Failed to fetch the podcast feed." }, { status: 500 });
  }
}
