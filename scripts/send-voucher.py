#!/usr/bin/env python3
"""send-voucher.py — email each delegate their individual FORM Hotel accommodation
voucher (single-page PDF attached) via Resend.

The client provides a combined multi-page voucher PDF (one delegate per page).
Split it into single-page PDFs first, then build a CSV mapping each delegate to
their page. See [[Dubai Delegate Email Toolkit]] for the full flow.

Usage:
    # dry check: send ONE test email (first CSV row's voucher) to yourself
    RESEND_API_KEY=... FROM_EMAIL=noreply@programs.thecscd.org \
    INVITES_DIR=/path/to/vouchers \
    python3 scripts/send-voucher.py --test you@example.com voucher-send.csv

    # real run: send to every non-held row
    RESEND_API_KEY=... FROM_EMAIL=noreply@programs.thecscd.org \
    INVITES_DIR=/path/to/vouchers \
    python3 scripts/send-voucher.py voucher-send.csv

CSV header (at minimum): name,email,applicant_id,pdf_file[,hold]
Rows with hold=yes are skipped in the real run. Idempotent via dubai-voucher-sent.csv.
Requires: requests. Uses the Resend HTTP API directly.
"""
import argparse
import base64
import csv
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@programs.thecscd.org")
PORTAL_URL = os.environ.get("PORTAL_URL", "https://delegate.thecscd.org/")
SUBJECT = "YSF Dubai 2026 | Your Official Accommodation Voucher"

RESEND_ENDPOINT = "https://api.resend.com/emails"
TEMPLATE_PATH = Path(__file__).with_name("voucher-email.html")

INVITES_DIR = os.environ.get("INVITES_DIR", "")

SENT_LOG_PATH = Path(__file__).resolve().parents[1] / "dubai-voucher-sent.csv"
SENT_LOG_FIELDS = ["email", "applicant_id", "name", "sent_at", "status"]


def load_sent_emails() -> set:
    if not SENT_LOG_PATH.exists():
        return set()
    with SENT_LOG_PATH.open(newline="", encoding="utf-8") as f:
        return {
            row["email"].strip().lower()
            for row in csv.DictReader(f)
            if row.get("status") == "sent"
        }


def log_send(email: str, applicant_id: str, name: str, status: str) -> None:
    is_new = not SENT_LOG_PATH.exists()
    with SENT_LOG_PATH.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=SENT_LOG_FIELDS)
        if is_new:
            writer.writeheader()
        writer.writerow({
            "email": email,
            "applicant_id": applicant_id,
            "name": name,
            "sent_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "status": status,
        })


def build_html(name: str) -> str:
    html = TEMPLATE_PATH.read_text(encoding="utf-8")
    return html.replace("{{name}}", name or "Delegate").replace("{{portal_url}}", PORTAL_URL)


def build_text(name: str) -> str:
    return (
        f"Dear {name or 'Delegate'},\n\n"
        "We are pleased to share your official accommodation booking voucher for the "
        "Youth Strategic Forum (YSF) Dubai 2026.\n\n"
        "YOUR OFFICIAL ACCOMMODATION\n"
        "We are delighted to confirm that your accommodation for the Forum is "
        "FORM Hotel Al Jaddaf, Dubai, a member of Design Hotels.\n\n"
        "Why you'll love it:\n"
        "- Closest hotel to our venue\n"
        "- Right across from Al Jaddaf Metro Station, easy travel across the city\n"
        "- International breakfast included\n"
        "- Rooftop 25-metre temperature-controlled pool\n"
        "- 24-hour rooftop gym\n"
        "- Complimentary Wi-Fi\n"
        "- Close to Mohammed Bin Rashid Library, Jameel Arts Centre and historic dhow boatyards\n\n"
        "Your accommodation covers the three official nights of YSF Dubai 2026 on twin "
        "sharing basis. Your individual booking voucher is attached to this email.\n\n"
        "VOUCHER VALIDITY\n"
        "Check-in: 3 PM, 22 September 2026\n"
        "Check-out: 11 AM, 25 September 2026\n\n"
        "OPTIONAL UPGRADES AND EXTENSIONS\n"
        "- Single room upgrade available for 140 USD for three nights. Please write to us in advance to request.\n"
        "- Extra days booking (beyond official dates) can be arranged. Please inform us earlier. "
        "A confirmation option will also be available on the portal.\n\n"
        "Please review your voucher carefully and retain it for presentation at check-in to our team.\n\n"
        "We are very pleased to welcome you to Dubai and hope that your stay at FORM Hotel will add "
        "to your experience of the city, not only during the Forum, but also as you explore Dubai's "
        "cultural, creative and historic landscape.\n\n"
        "We look forward to welcoming you soon. This is a no-reply email. For questions, "
        "please contact us at contact@thecscd.org.\n\n"
        "Warm regards,\nYSF Dubai 2026 Programs Team\n"
        "Center for Strategy and Cultural Diplomacy (CSCD)"
    )


def pdf_b64(pdf_file: str) -> str:
    path = Path(INVITES_DIR) / pdf_file
    if not path.exists():
        raise FileNotFoundError(f"attachment not found: {path}")
    return base64.b64encode(path.read_bytes()).decode("ascii")


def send(to_email: str, name: str, pdf_file: str) -> bool:
    payload = {
        "from": f"CSCD <{FROM_EMAIL}>",
        "to": [to_email],
        "subject": SUBJECT,
        "html": build_html(name),
        "text": build_text(name),
        "attachments": [{
            "filename": "YSF-Dubai-2026-Accommodation-Voucher.pdf",
            "content": pdf_b64(pdf_file),
        }],
    }
    resp = requests.post(
        RESEND_ENDPOINT,
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    ok = resp.status_code < 300
    if ok:
        print(f"  ✓ {to_email}  ({name}, {pdf_file})")
    else:
        print(f"  ✗ {to_email}: {resp.status_code} {resp.text}")
    return ok


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", help="mapping CSV: name,email,applicant_id,pdf_file[,hold]")
    ap.add_argument("--test", metavar="EMAIL", help="send one test email (first row's voucher) to EMAIL and exit")
    ap.add_argument("--attach-dir", help="dir holding the per-delegate voucher PDFs (overrides INVITES_DIR)")
    args = ap.parse_args()

    if not RESEND_API_KEY:
        sys.exit("RESEND_API_KEY not set in environment.")

    global INVITES_DIR
    if args.attach_dir:
        INVITES_DIR = args.attach_dir
    if not INVITES_DIR:
        sys.exit("Set INVITES_DIR (or --attach-dir) to the folder holding the voucher PDFs.")

    with open(args.csv, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if args.test:
        first = rows[0]
        print(f"TEST -> {args.test} using {first['name']}'s voucher ({first['pdf_file']})")
        ok = send(args.test, first["name"], first["pdf_file"])
        print("Test", "sent." if ok else "FAILED.")
        return

    already = load_sent_emails()
    sent = failed = skipped = held = 0
    for row in rows:
        if (row.get("hold") or "").strip().lower() == "yes":
            print(f"  · {row.get('email')} (HELD, skipping)")
            held += 1
            continue
        email = (row.get("email") or "").strip()
        if not email:
            print(f"  ! row for {row.get('applicant_id') or row.get('voucher_name')} has no email, skipping")
            continue
        if email.lower() in already:
            print(f"  · {email} (already sent, skipping)")
            skipped += 1
            continue
        ok = send(email, (row.get("name") or "").strip(), row["pdf_file"])
        log_send(email, (row.get("applicant_id") or "").strip(), (row.get("name") or "").strip(), "sent" if ok else "failed")
        sent += ok
        failed += (not ok)
        time.sleep(0.6)

    print(f"\nDone. Sent {sent}, failed {failed}, skipped {skipped} already-sent, held {held}. Log: {SENT_LOG_PATH}")


if __name__ == "__main__":
    main()
