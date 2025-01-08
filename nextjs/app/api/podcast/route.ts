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
    $: { 
      url: string; 
      length: string; 
      type: string; 
    };
  }[]; 
  "itunes:summary"?: string;
  "itunes:explicit"?: string;
  "itunes:duration"?: string;
  "itunes:image"?: {
    $: {
      href: string;
    };
  };
  "itunes:season"?: number;
  "itunes:episode"?: number;
}

interface ChannelInfo {
  title: string;
  description: string;
  link: string;
  image: string;
  language: string;
  category: string;
}

interface Episode {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  audioUrl: string;
  playTime: string;
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

    const channelInfo: ChannelInfo = {
      title: result.rss.channel[0].title[0],
      description: result.rss.channel[0].description[0],
      link: result.rss.channel[0].link[0],
      image: result.rss.channel[0].image[0].url[0],
      language: result.rss.channel[0].language[0],
      category: result.rss.channel[0].category[0],
    };

    const episodes: Episode[] = result.rss.channel[0].item.map((item: RSSItem) => ({
      title: item.title[0],
      link: item.link[0],
      pubDate: item.pubDate[0],
      audioUrl: item.enclosure[0].$.url, 
      playTime: item["itunes:duration"] ? item["itunes:duration"]: "",
    }));
    return NextResponse.json({ "channelInfo": channelInfo, "episodes": episodes });
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
}

export async function GET(req: Request) {
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
