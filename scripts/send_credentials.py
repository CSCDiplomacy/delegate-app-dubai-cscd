#!/usr/bin/env python3
"""send_credentials.py — email each delegate their login credentials via Resend.

Run LATER, once the participant emails are final and seed-delegates.js has
produced the credentials CSV.

Usage:
    RESEND_API_KEY=... APP_URL=https://delegateapp.thecscd.org \
    FROM_EMAIL=noreply@programs.thecscd.org \
    python3 scripts/send_credentials.py delegate-credentials.csv

The CSV is the output of seed-delegates.js with header: email,password,name
Requires: requests  (pip install requests)  — uses the Resend HTTP API directly,
no extra SDK needed.
"""
import csv
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@programs.thecscd.org")
APP_URL = os.environ.get("APP_URL", "https://delegate.thecscd.org/")
EVENT_NAME = os.environ.get("EVENT_NAME", "Youth Strategic Forum, Dubai 2026")
PORTAL_URL = os.environ.get("PORTAL_URL", "https://delegate.thecscd.org/")
# No confirmed interview deadline exists for Dubai yet (unlike Jakarta's fixed
# date) — set INTERVIEW_DEADLINE in the environment once the client confirms
# one. This default is a deliberate placeholder, not a real date.
INTERVIEW_DEADLINE = os.environ.get("INTERVIEW_DEADLINE", "TBD, check the Interview tab in your portal for the current date")

RESEND_ENDPOINT = "https://api.resend.com/emails"
TEMPLATE_PATH = Path(__file__).with_name("credential-email.html")

# Tracks who has actually been sent the credential email, so re-running a
# batch (e.g. after adding more rows to dubai-credentials.csv) doesn't
# re-email anyone. Not committed (contains applicant PII) — see .gitignore.
SENT_LOG_PATH = Path(__file__).resolve().parents[1] / "dubai-emails-sent.csv"
SENT_LOG_FIELDS = ["email", "applicant_id", "name", "sent_at", "status"]


def load_sent_emails() -> set[str]:
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


def render_template(name: str, email: str, password: str) -> str:
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    replacements = {
        "{{name}}": name or "Delegate",
        "{{email}}": email,
        "{{password}}": password,
        "{{portal_url}}": PORTAL_URL,
        "{{interview_deadline}}": INTERVIEW_DEADLINE,
    }
    for placeholder, value in replacements.items():
        template = template.replace(placeholder, value)
    return template


def build_html(name: str, email: str, password: str) -> str:
    return render_template(name, email, password)


def build_text(name: str, email: str, password: str) -> str:
    greeting = name or "Delegate"
    return (
        f"Welcome to {EVENT_NAME}: Complete Your Interview\n\n"
        f"Hi {greeting},\n\n"
        "Congratulations, you're part of the Youth Strategic Forum, Dubai 2026 community. Your delegate portal is now live, and your interview for scholarship consideration is ready to complete inside it.\n\n"
        "YOUR LOGIN\n"
        f"Portal:   {PORTAL_URL}\n"
        f"Email:    {email}\n"
        f"Password: {password}\n\n"
        "NEXT STEPS\n"
        f"1. Sign in at {PORTAL_URL}\n"
        f"2. Open the Interview tab and complete your interview. It takes a few minutes. Interview form submission deadline: {INTERVIEW_DEADLINE}\n"
        "3. Explore the program, hotel, and venue in your portal\n\n"
        "Missing the interview deadline affects scholarship eligibility. You'll still be considered for the self-financed option.\n\n"
        "YOUR PORTAL IS YOUR MAIN CHANNEL FROM HERE\n"
        "We'll use it for all further communication, including schedule updates and announcements, not just email. Sign in regularly and check it.\n\n"
        "ABOUT YOUR PORTAL\n"
        "Explore the portal to see full details of the program, hotel, venue, and the 4 day agenda. You can also star any session to save it for quick reference.\n\n"
        "This is a no-reply email. For questions, contact us at contact@thecscd.org.\n\n"
        "Welcome aboard,\nThe CSCD Team\nCenter for Strategy and Cultural Diplomacy"
    )


def send(to_email: str, name: str, password: str, applicant_id: str = "") -> bool:
    # A plain-text part is included alongside the HTML: HTML-only messages render
    # blank in clients that strip or block HTML, which is the "completely blank
    # email" symptom we hit before.
    payload = {
        "from": f"CSCD <{FROM_EMAIL}>",
        "to": [to_email],
        "subject": f"Welcome to {EVENT_NAME}: Complete Your Interview",
        "html": build_html(name, to_email, password),
        "text": build_text(name, to_email, password),
    }
    resp = requests.post(
        RESEND_ENDPOINT,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    ok = resp.status_code < 300
    if ok:
        print(f"  ✓ {to_email}")
    else:
        print(f"  ✗ {to_email}: {resp.status_code} {resp.text}")
    log_send(to_email, applicant_id, name, "sent" if ok else "failed")
    return ok


def main() -> None:
    if not RESEND_API_KEY:
        sys.exit("RESEND_API_KEY not set in environment.")
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 scripts/send_credentials.py <credentials.csv>")

    path = sys.argv[1]
    already_sent = load_sent_emails()
    sent = failed = skipped = 0
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            email = (row.get("email") or "").strip()
            if not email:
                continue
            if email.lower() in already_sent:
                print(f"  · {email} (already sent, skipping)")
                skipped += 1
                continue
            ok = send(
                email,
                (row.get("name") or "").strip(),
                (row.get("password") or "").strip(),
                (row.get("applicant_id") or "").strip(),
            )
            sent += ok
            failed += (not ok)
            time.sleep(0.6)  # gentle on the API rate limit

    print(f"\nDone. Sent {sent}, failed {failed}, skipped {skipped} already-sent. Log: {SENT_LOG_PATH}")


if __name__ == "__main__":
    main()
