import os
import secrets
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.utils import secure_filename
import PyPDF2
import docx
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Get Gemini API key from environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    text = ""
    with open(file_path, 'rb') as file:
        try:
            # For newer versions of PyPDF2
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += page.extract_text()
        except AttributeError:
            # For older versions of PyPDF2
            pdf_reader = PyPDF2.PdfFileReader(file)
            for page_num in range(pdf_reader.numPages):
                page = pdf_reader.getPage(page_num)
                text += page.extractText()
    return text

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    text = [paragraph.text for paragraph in doc.paragraphs]
    return '\n'.join(text)

def extract_text_from_file(file_path):
    file_extension = file_path.rsplit('.', 1)[1].lower()
    if file_extension == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension == 'docx':
        return extract_text_from_docx(file_path)
    elif file_extension == 'txt':
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    return ""

def simplify_text_with_gemini(text, prompt_type="simplify"):
    # Different prompts for different functionalities
    prompts = {
        "simplify": f"Simplify the following legal document into clear, accessible language that an average person can understand. Highlight important terms and obligations: {text}",
        "summarize": f"Provide a concise summary of this legal document, highlighting the key points and obligations: {text}",
        "explain_risks": f"Identify and explain potential risks or unfavorable terms in this legal document that a person should be aware of: {text}"
    }
    
    # Get the appropriate prompt
    prompt = prompts.get(prompt_type, prompts["simplify"])
    
    try:
        # Configure the model with current model name
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                top_k=40,
                top_p=0.95,
                max_output_tokens=8192,
            )
        )
        
        # Return the response text
        return response.text
    except Exception as e:
        print(f"Error with Gemini API: {str(e)}")
        return f"Error: Unable to process the document with AI. {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(request.url)
    
    file = request.files['file']
    
    if file.filename == '':
        flash('No selected file')
        return redirect(request.url)
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Extract text from the uploaded file
        document_text = extract_text_from_file(file_path)
        
        # Store the text in session for later use
        session['document_text'] = document_text
        session['file_path'] = file_path
        
        return redirect(url_for('document_view'))
    
    flash('File type not allowed. Please upload PDF, DOCX, or TXT files.')
    return redirect(url_for('index'))

@app.route('/document')
def document_view():
    if 'document_text' not in session:
        flash('Please upload a document first')
        return redirect(url_for('index'))
    
    return render_template('document.html')

@app.route('/api/simplify', methods=['POST'])
def api_simplify():
    if 'document_text' not in session:
        return jsonify({'error': 'No document uploaded'}), 400
    
    document_text = session['document_text']
    prompt_type = request.json.get('prompt_type', 'simplify')
    
    simplified_text = simplify_text_with_gemini(document_text, prompt_type)
    
    return jsonify({'result': simplified_text})

@app.route('/api/ask', methods=['POST'])
def api_ask_question():
    if 'document_text' not in session:
        return jsonify({'error': 'No document uploaded'}), 400
    
    document_text = session['document_text']
    question = request.json.get('question', '')
    
    if not question:
        return jsonify({'error': 'No question provided'}), 400
    
    # Create a prompt for the question
    prompt = f"Based on this legal document: {document_text}\n\nQuestion: {question}\n\nPlease provide a clear, accurate answer:"
    
    try:
        # Configure the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                top_k=40,
                top_p=0.95,
                max_output_tokens=4096,
            )
        )
        
        # Return the response text
        return jsonify({'answer': response.text})
    except Exception as e:
        print(f"Error with Gemini API: {str(e)}")
        return jsonify({'error': f'Failed to get answer from AI: {str(e)}'}), 500

@app.route('/privacy')
def privacy_policy():
    return render_template('privacy.html')

@app.route('/terms')
def terms_of_service():
    return render_template('terms.html')

if __name__ == '__main__':
    app.run(debug=True)