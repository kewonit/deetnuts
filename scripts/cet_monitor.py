from __future__ import annotations

import json
import os
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup


WEBSITE = "https://fe2026.mahacet.org/StaticPages/HomePage"
CHECK_INTERVAL = 10 * 60
STATE_FILE = Path(
    os.environ.get(
        "CET_MONITOR_STATE_FILE",
        Path(__file__).with_name("cet_monitor_old.json"),
    )
)

IGNORED = [
    "Vacant Seats",
    "Institute Wise Allotment",
    "AI Cut Off",
    "AI Cutoff",
    "Diploma Cut off",
    "List of Institutes Affiliated to Dr. BATU",
    "User Manual",
    "Cut off List for A.Y. 2025-26",
    "Cut off List for A.Y. 2026-27",
]


def send_discord(webhook: str, message: str) -> None:
    response = requests.post(
        webhook,
        json={"content": message},
        timeout=20,
    )
    response.raise_for_status()


def fetch_updates() -> list[dict[str, str]]:
    response = requests.get(
        WEBSITE,
        headers={"User-Agent": "CET-Update-Monitor/1.0"},
        timeout=20,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    menu_group = soup.find("div", id="MenuGroup_15")
    if not menu_group:
        raise RuntimeError("MenuGroup_15 was not found; the CET page may have changed")

    menu_links = menu_group.find("div", class_="MenuLinks")
    if not menu_links:
        raise RuntimeError("MenuLinks was not found; the CET page may have changed")

    updates = []
    for anchor in menu_links.find_all("a"):
        title = anchor.get_text(" ", strip=True)
        if any(ignored.lower() in title.lower() for ignored in IGNORED):
            continue

        link = anchor.get("href")
        if title and link:
            updates.append({"title": title, "link": urljoin(WEBSITE, link)})

    if not updates:
        raise RuntimeError("No monitored links were found; keeping the previous state")

    return updates


def load_old() -> list[dict[str, str]] | None:
    try:
        with STATE_FILE.open("r", encoding="utf-8") as state_file:
            return json.load(state_file)
    except FileNotFoundError:
        return None
    except (json.JSONDecodeError, OSError) as error:
        raise RuntimeError(f"Could not read state file {STATE_FILE}: {error}") from error


def save_old(data: list[dict[str, str]]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = STATE_FILE.with_suffix(f"{STATE_FILE.suffix}.tmp")
    with temporary_file.open("w", encoding="utf-8") as state_file:
        json.dump(data, state_file, indent=2)
        state_file.write("\n")
    temporary_file.replace(STATE_FILE)


def check_once(webhook: str) -> None:
    current = fetch_updates()
    old = load_old()

    if old is None:
        save_old(current)
        print(f"Baseline initialized with {len(current)} updates; no alerts sent")
        return

    known_items = {item["link"]: item for item in old}
    new_items = [item for item in current if item["link"] not in known_items]

    for item in new_items:
        timestamp = datetime.now(ZoneInfo("Asia/Kolkata")).strftime(
            "%d/%m/%Y | %H:%M"
        )
        message = (
            "<@&1514697833415053352>\n\n"
            f"**{item['title']}**\n"
            f"> <{item['link']}>\n"
            f"> -# {timestamp}"
        )
        send_discord(webhook, message)
        known_items[item["link"]] = item
        save_old(list(known_items.values()))
        print("New:", item["title"])

    if not new_items:
        print("No new updates")


def main() -> None:
    webhook = os.environ.get("DISCORD_WEBHOOK")
    if not webhook:
        raise RuntimeError("DISCORD_WEBHOOK environment variable is required")

    print("CET Monitor Started (checking every 10 minutes)")
    while True:
        try:
            check_once(webhook)
        except Exception as error:
            print("Error:", error)

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
