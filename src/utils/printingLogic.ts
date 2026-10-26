interface PrintingRequestInput {
  applicantName: string;
  requestedDate: string;
  copiesNeeded: number | '';
  purpose: string;
  address: string;
  contactNumber: string;
  pdf?: { name: string; type: string; size: number };
  today: string;
}

export function validatePrintingRequest(input: PrintingRequestInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = input.applicantName.trim();
  const address = input.address.trim();
  const purpose = input.purpose.trim();
  const phoneNumber = input.contactNumber.replace(/[\s-]/g, '');

  if (name.length < 3 || name.length > 120) errors.applicantName = 'Enter your full name (3 to 120 characters).';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.requestedDate)) {
    errors.requestedDate = 'Choose the requested date.';
  } else if (input.requestedDate < input.today) {
    errors.requestedDate = 'Choose today or a future date.';
  }
  if (!Number.isInteger(Number(input.copiesNeeded)) || Number(input.copiesNeeded) < 1 || Number(input.copiesNeeded) > 999999) {
    errors.copiesNeeded = 'Enter a whole number of copies from 1 to 999,999.';
  }
  if (purpose.length < 1 || purpose.length > 2000) errors.details = 'Enter the purpose of printing (up to 2,000 characters).';
  if (address.length < 5 || address.length > 300) errors.address = 'Enter your complete Barangay Bagbaguin address (up to 300 characters).';
  if (!/^(09\d{9}|\+639\d{9})$/.test(phoneNumber)) {
    errors.contactNumber = 'Enter a valid 11-digit Philippine mobile number.';
  }
  if (!input.pdf) {
    errors.files = 'Attach one PDF file.';
  } else if (
    input.pdf.type !== 'application/pdf'
    || !input.pdf.name.toLowerCase().endsWith('.pdf')
  ) {
    errors.files = 'Choose a PDF file only.';
  } else if (input.pdf.size === 0 || input.pdf.size > 10 * 1024 * 1024) {
    errors.files = 'The PDF must be larger than 0 bytes and 10 MB or smaller.';
  }

  return errors;
}
