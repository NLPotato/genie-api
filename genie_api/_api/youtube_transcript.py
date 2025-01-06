from helpers.transcript import extract_youtube_id, _validate_youtube_link, _join_chunks
from typing import Union, List, Dict

from youtube_transcript_api import YouTubeTranscriptApi


def get_available_languages(url: str) -> List[str]:
    if not _validate_youtube_link(url):
        raise ValueError("Invalid YouTube URL")

    video_id = extract_youtube_id(url)
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        return [t.language for t in transcript_list]
    except Exception as e:
        print(f"Error: {e}")
        raise e


def get_transcript(
    url: str, languages: list[str] = [], *, return_chunks: bool = True
) -> List[Dict]:
    if not _validate_youtube_link(url):
        raise ValueError("Invalid YouTube URL")

    video_id = extract_youtube_id(url)
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        if not return_chunks:
            return _join_chunks(transcript)
        return transcript
    except Exception as e:
        print(f"Error: {e}")
        raise e
