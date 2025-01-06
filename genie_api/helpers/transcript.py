import re
from typing import Union, List, Dict


def _validate_youtube_link(link: str) -> bool:
    if link.startswith("https://www.youtube/"):
        return True
    if link.startswith("https://youtu.be/"):
        return True
    return False


def _join_chunks(chunks: List[Dict], sep: str = "\t") -> str:
    return sep.join([chunk["text"] for chunk in chunks])


def extract_youtube_id(url: str) -> Union[str, ValueError]:
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if match:
        return match.group(1)
    else:
        raise ValueError("Invalid YouTube URL")
