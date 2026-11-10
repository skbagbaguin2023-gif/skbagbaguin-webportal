#!/usr/bin/env python3
"""Read-only KK workbook parser and explicit non-production staging importer."""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"a": MAIN_NS, "r": REL_NS}
DATE_STYLE_IDS = {
    14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47
}
HEADER_MAP = {
    "Timestamp": "original_timestamp",
    "EMAIL ACCOUNT": "email_account",
    "FIRST NAME": "first_name",
    "MIDDLE NAME": "middle_name",
    "LAST NAME": "last_name",
    "SEX/GENDER IDENTITY": "gender_identity",
    "AGE": "age",
    "BIRTHDAY": "birthday",
    "BIRTHPLACE": "birthplace",
    "CONTACT NUMBER": "contact_number",
    "CIVIL STATUS": "civil_status",
    "STREET/SITIO ADDRESS": "sitio_address",
    "COMPLETE ADDRESS": "complete_address",
    "ARE YOU REGISTERED VOTER IN BARANGAY BAGBAGUIN OR RESIDENT ONLY?": "voter_status",
    "DID YOU VOTE LAST SK ELECTION?": "voted_last_sk_election",
    "HOW MANY TIMES DID YOU VOTE FOR SK ELECTIONS?": "sk_election_vote_count",
    "ARE YOU REGISTERED NATIONAL VOTER?": "national_voter",
    "IF YES, WHAT IS YOUR PRECINT NUMBER?": "precinct_number",
    "YOUTH CLASSIFICATION": "youth_classifications",
    "WORK STATUS": "work_status",
    "EDUCATIONAL BACKGROUND": "educational_background",
}
EMAIL_HEADERS = {
    "Email Address": "email_address",
    "EMAIL ACCOUNT": "email_account",
}
NULL_LIKE = {"none", "null", "n/a", "na", "-", "--", "not applicable"}
PHONE_RE = re.compile(r"^(09\d{9}|\+639\d{9})$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
DATE_FORMATS = ("%m/%d/%Y", "%m-%d-%Y", "%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y")
ALLOWED_CLASSIFICATIONS = {
    "In School Youth",
    "Out of School Youth",
    "Working Youth",
    "Youth w/ Special Needs (PWD)",
    "Single/Solo Parent Youth",
}


class ImportErrorSafe(Exception):
    """An error message that is safe to show without workbook values."""


def _column_index(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference)
    if not letters:
        raise ImportErrorSafe("Workbook contains an invalid cell reference.")
    value = 0
    for character in letters.group(0):
        value = value * 26 + ord(character) - 64
    return value - 1


def _date_style_indices(archive: zipfile.ZipFile) -> set[int]:
    try:
        styles_root = ET.fromstring(archive.read("xl/styles.xml"))
    except KeyError:
        return set()

    custom_formats: dict[int, str] = {}
    num_formats = styles_root.find("a:numFmts", NS)
    if num_formats is not None:
        custom_formats = {
            int(item.attrib["numFmtId"]): item.attrib["formatCode"]
            for item in num_formats.findall("a:numFmt", NS)
        }

    cell_formats = styles_root.find("a:cellXfs", NS)
    if cell_formats is None:
        return set()

    date_styles: set[int] = set()
    for index, cell_format in enumerate(cell_formats):
        format_id = int(cell_format.attrib.get("numFmtId", "0"))
        custom_format = custom_formats.get(format_id, "")
        if format_id in DATE_STYLE_IDS or re.search(r"(?<!\\)[ymd]", custom_format, re.IGNORECASE):
            date_styles.add(index)
    return date_styles


def _cell_value(cell: ET.Element, shared_strings: list[str], date_styles: set[int]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(text.text or "" for text in cell.findall(".//a:t", NS))
    value_element = cell.find("a:v", NS)
    if value_element is None:
        return ""
    raw_value = value_element.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(raw_value)]
        except (ValueError, IndexError) as error:
            raise ImportErrorSafe("Workbook contains an invalid shared string reference.") from error
    if cell_type == "d":
        return raw_value
    if cell_type in (None, "n") and int(cell.attrib.get("s", "0")) in date_styles:
        try:
            serial = float(raw_value)
            date_value = dt.datetime(1899, 12, 30) + dt.timedelta(days=serial)
            return date_value.isoformat()
        except (ValueError, OverflowError) as error:
            raise ImportErrorSafe("Workbook contains an invalid date cell.") from error
    return raw_value


def read_response_rows(path: Path) -> tuple[list[str], list[tuple[int, dict[str, str]]]]:
    try:
        archive = zipfile.ZipFile(path, "r")
    except (OSError, zipfile.BadZipFile) as error:
        raise ImportErrorSafe("The workbook could not be opened as an XLSX file.") from error

    with archive:
        try:
            workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
            relation_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        except (KeyError, ET.ParseError) as error:
            raise ImportErrorSafe("The workbook structure is incomplete or invalid.") from error

        relations = {
            relation.attrib["Id"]: relation.attrib["Target"]
            for relation in relation_root.findall(f"{{{PKG_REL_NS}}}Relationship")
        }
        response_target = None
        for sheet in workbook_root.findall("a:sheets/a:sheet", NS):
            if sheet.attrib.get("name") != "Form Responses 1":
                continue
            target = relations.get(sheet.attrib.get(f"{{{REL_NS}}}id", ""))
            if target:
                response_target = target.lstrip("/")
                if not response_target.startswith("xl/"):
                    response_target = "xl/" + response_target
            break
        if not response_target or response_target not in archive.namelist():
            raise ImportErrorSafe('The required "Form Responses 1" sheet was not found.')

        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            try:
                shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
                shared_strings = [
                    "".join(text.text or "" for text in item.findall(".//a:t", NS))
                    for item in shared_root.findall("a:si", NS)
                ]
            except ET.ParseError as error:
                raise ImportErrorSafe("The workbook shared-string table is invalid.") from error

        try:
            worksheet_root = ET.fromstring(archive.read(response_target))
        except ET.ParseError as error:
            raise ImportErrorSafe("The response sheet is invalid.") from error
        rows = worksheet_root.findall(".//a:sheetData/a:row", NS)
        if not rows:
            raise ImportErrorSafe("The response sheet has no header row.")
        date_styles = _date_style_indices(archive)

        header_cells = rows[0].findall("a:c", NS)
        headers: dict[int, str] = {}
        for cell in header_cells:
            headers[_column_index(cell.attrib["r"])] = _cell_value(cell, shared_strings, date_styles).strip()
        if not headers or max(headers) > 200:
            raise ImportErrorSafe("The response sheet header is invalid.")

        expected_headers = {header.casefold() for header in HEADER_MAP} | {
            header.casefold() for header in EMAIL_HEADERS
        }
        actual_headers = {header.casefold() for header in headers.values()}
        missing_headers = expected_headers - actual_headers
        if missing_headers:
            raise ImportErrorSafe("The response sheet is missing one or more required columns.")

        response_rows: list[tuple[int, dict[str, str]]] = []
        for row in rows[1:]:
            values = {index: "" for index in headers}
            for cell in row.findall("a:c", NS):
                index = _column_index(cell.attrib["r"])
                if index in values:
                    values[index] = _cell_value(cell, shared_strings, date_styles)
            if not any(value.strip() for value in values.values()):
                continue
            raw = {headers[index]: values[index] for index in headers}
            response_rows.append((int(row.attrib.get("r", "0")), raw))
        return list(headers.values()), response_rows


def _normalise_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def _parse_date(value: str) -> dt.date | None:
    value = value.strip()
    if not value:
        return None
    try:
        parsed_date = dt.datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        return parsed_date if parsed_date.year >= 1900 else None
    except ValueError:
        pass
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        try:
            parsed_date = dt.date.fromisoformat(value)
            return parsed_date if parsed_date.year >= 1900 else None
        except ValueError:
            return None
    if re.fullmatch(r"\d+(?:\.\d+)?", value):
        try:
            return (dt.datetime(1899, 12, 30) + dt.timedelta(days=float(value))).date()
        except (ValueError, OverflowError):
            return None
    for date_format in DATE_FORMATS:
        try:
            parsed_date = dt.datetime.strptime(value, date_format).date()
            return parsed_date if parsed_date.year >= 1900 else None
        except ValueError:
            continue
    return None


def _parse_timestamp(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.isoformat() if parsed.tzinfo is not None else None
    except ValueError:
        return None


def _timestamp_date(value: str) -> dt.date | None:
    value = value.strip()
    if not value:
        return None
    try:
        return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return _parse_date(value)


def _field(raw: dict[str, str], header: str) -> str:
    for original_header, value in raw.items():
        if original_header.casefold() == header.casefold():
            return value
    return ""


def map_response_row(raw: dict[str, str], row_number: int) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    for source_header, target_field in HEADER_MAP.items():
        value = _field(raw, source_header)
        normalized[target_field] = _normalise_text(value) if value else ""

    normalized["email_address"] = _normalise_text(_field(raw, "Email Address"))
    normalized["email_account"] = _normalise_text(_field(raw, "EMAIL ACCOUNT"))
    normalized["email"] = None
    normalized["youth_classifications"] = []

    age = normalized.get("age", "")
    try:
        parsed_age = float(age)
        if parsed_age.is_integer():
            parsed_integer = int(parsed_age)
            normalized["age"] = str(parsed_integer) if 0 <= parsed_integer <= 120 else ""
    except ValueError:
        pass
    birthday = _parse_date(_field(raw, "BIRTHDAY"))
    normalized["birthday"] = birthday.isoformat() if birthday else ""
    normalized["original_timestamp"] = _parse_timestamp(_field(raw, "Timestamp")) or ""
    normalized["original_timestamp_raw"] = _field(raw, "Timestamp")
    normalized["source_row_number"] = row_number
    return normalized


def _age_at(birthday: dt.date, timestamp: dt.datetime) -> int:
    return timestamp.year - birthday.year - (
        (timestamp.month, timestamp.day) < (birthday.month, birthday.day)
    )


def analyse_rows(rows: list[tuple[int, dict[str, str]]]) -> tuple[dict[str, int], list[dict[str, Any]]]:
    metrics: collections.Counter[str] = collections.Counter()
    staged_rows: list[dict[str, Any]] = []
    email_counts: collections.Counter[str] = collections.Counter()
    email_account_counts: collections.Counter[str] = collections.Counter()
    phone_counts: collections.Counter[str] = collections.Counter()
    exact_row_counts: collections.Counter[str] = collections.Counter()
    name_birthday_counts: collections.Counter[tuple[str, str, str]] = collections.Counter()
    distinct_categories: dict[str, set[str]] = collections.defaultdict(set)
    today = dt.date.today()

    for row_number, raw in rows:
        normalized = map_response_row(raw, row_number)
        reasons = ["email_mapping_unresolved", "manual_identity_verification_required"]
        metrics["rows"] += 1
        metrics["outer_whitespace_cells"] += sum(
            1 for value in raw.values() if value and value != value.strip()
        )
        metrics["null_like_cells"] += sum(
            1 for value in raw.values() if value.strip().casefold() in NULL_LIKE
        )

        birthday_text = _field(raw, "BIRTHDAY").strip()
        birthday = _parse_date(birthday_text)
        if birthday_text and birthday is None:
            metrics["unparseable_birthdays"] += 1
            reasons.append("birthday_unparseable")
        elif birthday and birthday > today:
            metrics["future_birthdays"] += 1
            reasons.append("birthday_in_future")
        if re.search(r"(?:\d{1,2}/\d{1,2}/\d{2}|\d{1,2}-\d{1,2}-\d{2})$", birthday_text):
            metrics["ambiguous_two_digit_years"] += 1
            reasons.append("birthday_two_digit_year")

        age_text = _field(raw, "AGE").strip()
        age_value: int | None = None
        if age_text:
            try:
                parsed_age = float(age_text)
                if parsed_age.is_integer():
                    age_value = int(parsed_age)
                else:
                    raise ValueError
            except ValueError:
                metrics["age_unparseable"] += 1
                reasons.append("age_unparseable")
        if age_value is not None and not 15 <= age_value <= 30:
            metrics["age_outside_15_30"] += 1
            reasons.append("age_outside_15_30")

        timestamp_text = _parse_timestamp(_field(raw, "Timestamp"))
        timestamp_date = _timestamp_date(_field(raw, "Timestamp"))
        if _field(raw, "Timestamp") and not timestamp_text:
            metrics["timestamp_timezone_unconfirmed"] += 1
            reasons.append("timestamp_timezone_unconfirmed")
        if birthday and age_value is not None and timestamp_date:
            timestamp_for_age = dt.datetime.combine(timestamp_date, dt.time())
            if _age_at(birthday, timestamp_for_age) != age_value:
                metrics["age_birthday_mismatch"] += 1
                reasons.append("age_birthday_mismatch")
            if birthday > timestamp_date:
                metrics["birthday_after_submission"] += 1
                reasons.append("birthday_after_submission")

        for header, counter_name in (
            ("Email Address", email_counts),
            ("EMAIL ACCOUNT", email_account_counts),
        ):
            email = _field(raw, header).strip()
            if email:
                counter_name[email.casefold()] += 1
                if not EMAIL_RE.fullmatch(email):
                    metrics[f"{header.casefold().replace(' ', '_')}_invalid"] += 1
                    reasons.append(f"{header.casefold().replace(' ', '_')}_invalid")

        phone = re.sub(r"[\s-]", "", _field(raw, "CONTACT NUMBER"))
        if phone:
            phone_counts[re.sub(r"\D", "", phone)] += 1
            if not PHONE_RE.fullmatch(phone):
                metrics["phone_invalid"] += 1
                reasons.append("phone_invalid")
            if re.fullmatch(r"9\d{9}", re.sub(r"\D", "", phone)):
                metrics["phone_possible_missing_zero"] += 1
                reasons.append("phone_possible_missing_zero")

        vote_count = _field(raw, "How many times did you vote for SK Elections?").strip()
        if vote_count and not re.fullmatch(r"\d+(?:\.0+)?", vote_count):
            metrics["vote_count_non_numeric_text"] += 1
            reasons.append("vote_count_text")
        for field_name in (
            "SEX/GENDER IDENTITY",
            "CIVIL STATUS",
            "ARE YOU REGISTERED VOTER IN BARANGAY BAGBAGUIN OR RESIDENT ONLY?",
            "DID YOU VOTE LAST SK ELECTION?",
            "HOW MANY TIMES DID YOU VOTE FOR SK ELECTIONS?",
            "ARE YOU REGISTERED NATIONAL VOTER?",
            "YOUTH CLASSIFICATION",
            "WORK STATUS",
            "EDUCATIONAL BACKGROUND",
        ):
            category_value = _field(raw, field_name).strip()
            if category_value:
                distinct_categories[field_name].add(_normalise_text(category_value).casefold())

        precinct = _field(raw, "IF YES, WHAT IS YOUR PRECINT NUMBER?").strip()
        if re.fullmatch(r"[+-]?\d+(?:\.\d+)?[eE][+-]?\d+", precinct):
            metrics["precinct_scientific_notation"] += 1
            reasons.append("precinct_scientific_notation")

        classification = _field(raw, "YOUTH CLASSIFICATION").strip()
        if classification:
            reasons.append("classification_mapping_review")

        exact_key = json.dumps(
            {key: _normalise_text(value).casefold() for key, value in raw.items()},
            sort_keys=True,
            ensure_ascii=False,
        )
        exact_row_counts[exact_key] += 1
        if birthday:
            name_birthday_counts[
                (
                    normalized["first_name"].casefold(),
                    normalized["last_name"].casefold(),
                    birthday.isoformat(),
                )
            ] += 1

        staged_rows.append({
            "source_row_number": row_number,
            "source_response_id": None,
            "raw_data": raw,
            "normalized_data": normalized,
            "review_reasons": sorted(set(reasons)),
        })

    metrics["duplicate_email_extra_rows"] = sum(count - 1 for count in email_counts.values() if count > 1)
    metrics["email_values_repeated"] = sum(count > 1 for count in email_counts.values())
    metrics["duplicate_email_account_extra_rows"] = sum(
        count - 1 for count in email_account_counts.values() if count > 1
    )
    metrics["email_account_values_repeated"] = sum(
        count > 1 for count in email_account_counts.values()
    )
    metrics["duplicate_phone_extra_rows"] = sum(count - 1 for count in phone_counts.values() if count > 1)
    metrics["exact_duplicate_rows"] = sum(count - 1 for count in exact_row_counts.values() if count > 1)
    metrics["name_birthday_duplicate_occurrences"] = sum(
        count - 1 for count in name_birthday_counts.values() if count > 1
    )
    for field_name, values in distinct_categories.items():
        metrics[f"distinct_values:{field_name}"] = len(values)
    return dict(metrics), staged_rows


def _request_json(
    base_url: str,
    service_key: str,
    path: str,
    body: dict[str, Any],
    method: str = "POST",
) -> Any:
    url = base_url.rstrip("/") + path
    request = urllib.request.Request(
        url,
        data=None if method == "GET" else json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "apikey": service_key,
            "Authorization": "Bearer " + service_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise ImportErrorSafe("The staging import request failed; no response data was logged.") from error


def commit_to_staging(
    path: Path,
    checksum: str,
    rows: list[dict[str, Any]],
    base_url: str,
    service_key: str,
    actor_id: str,
) -> dict[str, Any]:
    batch_result = _request_json(
        base_url,
        service_key,
        "/rest/v1/rpc/create_kk_import_batch",
        {
            "p_file_checksum": checksum,
            "p_source_filename": path.name,
            "p_created_by": actor_id,
        },
    )
    batch_id = batch_result if isinstance(batch_result, str) else (
        batch_result[0] if isinstance(batch_result, list) and batch_result else None
    )
    if not batch_id:
        raise ImportErrorSafe("The staging service did not return an import batch ID.")

    status_result = _request_json(
        base_url,
        service_key,
        f"/rest/v1/kk_import_batches?id=eq.{urllib.parse.quote(batch_id)}&select=status",
        {},
        method="GET",
    )
    if not status_result or status_result[0].get("status") != "staged":
        raise ImportErrorSafe("This workbook checksum already has a completed or unavailable batch.")

    for start in range(0, len(rows), 200):
        _request_json(
            base_url,
            service_key,
            "/rest/v1/rpc/stage_kk_import_rows",
            {"p_batch_id": batch_id, "p_rows": rows[start : start + 200]},
        )
    result = _request_json(
        base_url,
        service_key,
        "/rest/v1/rpc/finalize_kk_import_batch",
        {"p_batch_id": batch_id},
    )
    return {"batch_id": batch_id, "summary": result}


def _verify_staging_environment() -> tuple[str, str, str]:
    environment = os.environ.get("KK_IMPORT_ENV", "").casefold()
    base_url = os.environ.get("SUPABASE_URL", "").strip()
    project_ref = os.environ.get("SUPABASE_STAGING_PROJECT_REF", "").strip()
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    actor_id = os.environ.get("KK_IMPORT_ACTOR_ID", "")

    if environment != "staging" or not base_url or not project_ref or not service_key or not actor_id:
        raise ImportErrorSafe(
            "Commit requires KK_IMPORT_ENV=staging, a matching staging project reference, "
            "a service key, and an authorized KK_IMPORT_ACTOR_ID."
        )
    parsed_url = urllib.parse.urlparse(base_url)
    host = parsed_url.hostname or ""
    actual_project_ref = host.split(".", maxsplit=1)[0]
    if not host.endswith(".supabase.co") or actual_project_ref != project_ref:
        raise ImportErrorSafe("The configured Supabase URL does not match the declared staging project.")
    if not re.fullmatch(r"[0-9a-fA-F-]{36}", actor_id):
        raise ImportErrorSafe("KK_IMPORT_ACTOR_ID must be an administrator UUID.")
    return base_url, service_key, actor_id


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path, help="Path to the read-only XLSX source")
    parser.add_argument("--commit", action="store_true", help="Stage and import to an explicitly configured staging project")
    args = parser.parse_args(argv)

    workbook_path = args.workbook.expanduser().resolve()
    if not workbook_path.is_file():
        raise ImportErrorSafe("The workbook path does not exist.")
    checksum = hashlib.sha256(workbook_path.read_bytes()).hexdigest()
    _, response_rows = read_response_rows(workbook_path)
    metrics, staged_rows = analyse_rows(response_rows)

    result: dict[str, Any] = {
        "mode": "staging_commit" if args.commit else "dry_run",
        "source_rows": len(response_rows),
        "file_checksum": checksum,
        "quality_counts": metrics,
        "raw_values_printed": False,
    }
    if args.commit:
        base_url, service_key, actor_id = _verify_staging_environment()
        result["staging_result"] = commit_to_staging(
            workbook_path,
            checksum,
            staged_rows,
            base_url,
            service_key,
            actor_id,
        )
    print(json.dumps(result, ensure_ascii=True, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ImportErrorSafe as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)
