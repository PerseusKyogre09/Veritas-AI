import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def clean_text(text):
    """Clean extracted text by removing extra whitespace and formatting"""
    # Replace multiple whitespace characters with single space
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text

def extract_main_content(soup):
    """Extract main content from BeautifulSoup object"""
    # Remove script, style, and other non-content elements
    for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form']):
        element.decompose()
    
    # Try to find main content containers in order of preference
    content_selectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '.article',
        '.post',
        '.entry',
        '#content',
        '#main'
    ]
    
    main_content = None
    for selector in content_selectors:
        main_content = soup.select_one(selector)
        if main_content and len(main_content.get_text().strip()) > 100:
            break
    
    # Fallback to body if no main content found
    if not main_content:
        main_content = soup.find('body')
    
    if not main_content:
        return ""
    
    # Extract text and clean it
    text = main_content.get_text()
    return clean_text(text)

@app.route('/scrape', methods=['POST'])
def scrape_url():
    """Scrape content from a given URL using Beautiful Soup"""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Validate URL format
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'URL must start with http:// or https://'}), 400
        
        # Set headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # Make request with timeout
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract main content
        content = extract_main_content(soup)
        
        if not content or len(content.strip()) < 50:
            return jsonify({'error': 'No readable content found on the page'}), 400
        
        # Limit content length to prevent overly long responses
        if len(content) > 10000:
            content = content[:10000] + "..."
        
        return jsonify({
            'content': content,
            'title': soup.title.string if soup.title else 'No title found',
            'url': url
        })
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out. The website may be slow or unresponsive.'}), 408
    
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Failed to connect to the website. Please check the URL and your internet connection.'}), 503
    
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({'error': 'Page not found (404). Please check the URL.'}), 404
        elif e.response.status_code == 403:
            return jsonify({'error': 'Access forbidden (403). The website may be blocking automated requests.'}), 403
        else:
            return jsonify({'error': f'HTTP error {e.response.status_code} occurred.'}), e.response.status_code
    
    except Exception as e:
        print(f"Scraping error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred while processing the URL.'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Veritas AI scraping service is running'})

@app.route('/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        'service': 'Veritas AI Scraping Service',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'scrape': '/scrape (POST)'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("Starting Veritas AI scraping service...")
    print(f"Service will be available on port {port}")
    print("Health check: /health")
    print("Scraping endpoint: POST /scrape")
    
    app.run(host='0.0.0.0', port=port, debug=debug)