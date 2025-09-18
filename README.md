# LegalEase - AI-Powered Legal Document Simplifier

LegalEase is a web application that uses Google Cloud's Gemini API to simplify complex legal documents into clear, accessible guidance. The application helps users understand legal jargon, identify potential risks, and get answers to specific questions about their documents.

## Features

- **Document Simplification**: Convert complex legal jargon into clear, everyday language
- **Document Summary**: Get concise summaries of key points and obligations
- **Risk Identification**: Highlight potentially unfavorable terms and hidden risks
- **Interactive Q&A**: Ask specific questions about the document and get clear answers
- **Support for Multiple Formats**: Upload documents in PDF, DOCX, or TXT format
- **Privacy-Focused**: Documents are processed securely and not stored permanently

## Prerequisites

- Python 3.7 or higher
- Google Cloud Gemini API key

## Installation

1. Clone this repository or download the source code

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Set up your Gemini API key:
   - Create a `.env` file in the project root directory
   - Add your API key to the file: `GEMINI_API_KEY=your_api_key_here`

## Usage

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to `http://127.0.0.1:5000`

3. Upload a legal document (PDF, DOCX, or TXT format)

4. View the simplified version, summary, risk analysis, or ask specific questions about the document

## Project Structure

```
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (API key)
├── static/                # Static assets
│   └── css/               # CSS stylesheets
│       └── style.css      # Main stylesheet
├── templates/             # HTML templates
│   ├── index.html         # Homepage
│   ├── document.html      # Document analysis page
│   ├── privacy.html       # Privacy policy
│   └── terms.html         # Terms of service
└── uploads/               # Temporary storage for uploaded documents
```

## Important Notes

- This application is for informational purposes only and does not provide legal advice
- Always consult with a qualified attorney for legal matters
- Uploaded documents are temporarily stored during your session and automatically deleted afterward

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Powered by Google Cloud's Gemini API
- Built with Flask web framework