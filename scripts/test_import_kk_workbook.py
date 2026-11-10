import datetime as dt
import unittest
from unittest.mock import patch

from import_kk_workbook import _age_at, _parse_date, _request_json, analyse_rows, map_response_row


class KkWorkbookImportTests(unittest.TestCase):
    def test_strict_dates_keep_ambiguous_two_digit_years_unparsed(self):
        self.assertEqual(_parse_date("2024-02-29"), dt.date(2024, 2, 29))
        self.assertIsNone(_parse_date("9-04-01"))
        self.assertIsNone(_parse_date("8/15/0008"))

    def test_age_is_calculated_at_submission_date(self):
        birthday = dt.date(2008, 6, 15)
        self.assertEqual(_age_at(birthday, dt.datetime(2024, 6, 14)), 15)
        self.assertEqual(_age_at(birthday, dt.datetime(2024, 6, 15)), 16)

    def test_mapping_preserves_both_emails_without_selecting_one(self):
        raw = {
            "Timestamp": "2024-01-01T10:00:00",
            "Email Address": "captured@example.com",
            "EMAIL ACCOUNT": "entered@example.com",
            "FIRST NAME": "  Ada ",
            "MIDDLE NAME": "",
            "LAST NAME": "Youth",
            "SEX/GENDER IDENTITY": "FEMALE",
            "AGE": "16",
            "BIRTHDAY": "2008-01-01",
            "BIRTHPLACE": "Valenzuela",
            "CONTACT NUMBER": "09123456789",
            "CIVIL STATUS": "SINGLE",
            "STREET/SITIO ADDRESS": "Bagong Nayon",
            "COMPLETE ADDRESS": "Bagong Nayon",
            "ARE YOU REGISTERED VOTER in Barangay Bagbaguin or Resident Only?": "Resident Only",
            "Did you vote last SK Election?": "No",
            "How many times did you vote for SK Elections?": "1",
            "ARE YOU REGISTERED NATIONAL VOTER?": "NO",
            "IF YES, WHAT IS YOUR PRECINT NUMBER?": "",
            "YOUTH CLASSIFICATION": "In School Youth",
            "Work Status": "Unemployed",
            "Educational Background": "Highschool Level",
        }
        mapped = map_response_row(raw, 2)
        self.assertEqual(mapped["first_name"], "Ada")
        self.assertEqual(mapped["email_address"], "captured@example.com")
        self.assertEqual(mapped["email_account"], "entered@example.com")
        self.assertIsNone(mapped["email"])
        self.assertEqual(mapped["youth_classifications"], [])

    def test_quality_report_does_not_expose_values(self):
        metrics, rows = analyse_rows([
            (2, {"Email Address": "private@example.com", "EMAIL ACCOUNT": "", "AGE": "16"}),
        ])
        self.assertEqual(metrics["rows"], 1)
        self.assertEqual(len(rows), 1)
        self.assertNotIn("private@example.com", repr(metrics))
        self.assertIn("email_mapping_unresolved", rows[0]["review_reasons"])

    def test_staging_requests_use_the_configured_bearer_key(self):
        captured = {}

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                return b'{"ok": true}'

        def fake_urlopen(request, timeout):
            captured["authorization"] = request.get_header("Authorization")
            captured["timeout"] = timeout
            return FakeResponse()

        with patch("urllib.request.urlopen", side_effect=fake_urlopen):
            result = _request_json(
                "https://staging-project.supabase.co",
                "staging-service-key",
                "/rest/v1/rpc/test",
                {},
            )

        self.assertEqual(captured["authorization"], "Bearer staging-service-key")
        self.assertEqual(captured["timeout"], 30)
        self.assertEqual(result, {"ok": True})


if __name__ == "__main__":
    unittest.main()
