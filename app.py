import os
import base64
import binascii
from urllib.parse import urlparse
from typing import List, Optional, Tuple

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import re
import time

from google.cloud import vision
from google.api_core.exceptions import GoogleAPICallError, RetryError

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

VISION_CLIENT: Optional[vision.ImageAnnotatorClient] = None

AI_LABEL_KEYWORDS = {
    'ai generated', 'ai-generated', 'artificial', 'synthetic', 'digital art', 'digital painting',
    'illustration', 'cartoon', 'anime', 'render', 'rendering', 'cg', 'cgi', '3d model',
    'concept art', 'fantasy art', 'drawing', 'stylized', 'generative', 'midjourney', 'stable diffusion',
    'diffusion model', 'neural network', 'deepfake', 'computer graphics'
}

HUMAN_PHOTO_KEYWORDS = {
    'photograph', 'photography', 'photojournalism', 'documentary', 'snapshot', 'news photo',
    'press photography', 'real life', 'real-world', 'candid photo', 'street photography'
}

AI_HEAVY_DOMAINS = {
    'artstation.com', 'www.artstation.com', 'deviantart.com', 'www.deviantart.com', 'midjourney.com',
    'midjourneyai.com', 'stablediffusionweb.com', 'leonardo.ai', 'lexica.art', 'openart.ai',
    'dream.ai', 'fotor.com', 'runwayml.com', 'playgroundai.com', 'craiyon.com', 'pollinations.ai',
    'fotor.ai', 'picsart.com'
}

LIKELIHOOD_NAMES = {
    vision.Likelihood.UNKNOWN: 'Unknown',
    vision.Likelihood.VERY_UNLIKELY: 'Very unlikely',
    vision.Likelihood.UNLIKELY: 'Unlikely',
    vision.Likelihood.POSSIBLE: 'Possible',
    vision.Likelihood.LIKELY: 'Likely',
    vision.Likelihood.VERY_LIKELY: 'Very likely',
}


def get_vision_client() -> vision.ImageAnnotatorClient:
    global VISION_CLIENT
    if VISION_CLIENT is None:
        VISION_CLIENT = vision.ImageAnnotatorClient()
    return VISION_CLIENT


def normalise_domain(raw_url: Optional[str]) -> str:
    if not raw_url:
        return ''
    try:
        parsed = urlparse(raw_url)
        return (parsed.netloc or '').lower()
    except Exception:
        return ''


def get_likelihood_name(value: Optional[int]) -> str:
    if value is None:
        return 'Unknown'
    try:
        likelihood = vision.Likelihood(value)
    except ValueError:
        return 'Unknown'
    return LIKELIHOOD_NAMES.get(likelihood, 'Unknown')


def gather_safe_search_warnings(safe_search: Optional[vision.SafeSearchAnnotation]) -> List[str]:
    if not safe_search:
        return []

    warnings: List[str] = []
    for attribute in ('adult', 'medical', 'violence', 'racy', 'spoof'):
        value = getattr(safe_search, attribute, None)
        if value is not None and value >= vision.Likelihood.POSSIBLE:
            warnings.append(
                f'SafeSearch flagged potential {attribute} content ({get_likelihood_name(value)} likelihood).'
            )
    return warnings[:6]


def evaluate_ai_signals(
    labels, web_detection, object_annotations,
) -> tuple[int, List[str], List[str], List[str]]:
    ai_score = 25
    ai_indicators: List[str] = []
    support_signals: List[str] = []
    suspicious_domains: List[str] = []

    for label in (labels or [])[:10]:
        description = (label.description or '').strip()
        if not description:
            continue
        lowered = description.lower()
        score_percent = int(round(float(label.score or 0) * 100))

        if any(keyword in lowered for keyword in AI_LABEL_KEYWORDS):
            delta = min(40, int(round(float(label.score or 0) * 100 * 0.6)))
            ai_score += delta
            ai_indicators.append(
                f'Vision label "{description}" ({score_percent}% confidence) is commonly tied to synthetic or illustrated imagery.'
            )
        elif any(keyword in lowered for keyword in HUMAN_PHOTO_KEYWORDS):
            delta = int(round(float(label.score or 0) * 100 * 0.4))
            ai_score -= delta
            support_signals.append(
                f'Label "{description}" ({score_percent}% confidence) aligns with documentary or real-world photography.'
            )

    if web_detection:
        for guess in (web_detection.best_guess_labels or [])[:3]:
            label_text = (guess.label or '').strip()
            if not label_text:
                continue
            lowered = label_text.lower()
            if any(keyword in lowered for keyword in AI_LABEL_KEYWORDS):
                ai_score += 20
                ai_indicators.append(
                    f'Vision best-guess "{label_text}" suggests illustration or generative art.'
                )
            elif any(keyword in lowered for keyword in HUMAN_PHOTO_KEYWORDS):
                ai_score -= 10
                support_signals.append(
                    f'Best-guess "{label_text}" is consistent with authentic photography.'
                )

        for page in (web_detection.pages_with_matching_images or [])[:5]:
            domain = normalise_domain(page.url)
            if not domain:
                continue
            if any(domain.endswith(ai_domain) or ai_domain in domain for ai_domain in AI_HEAVY_DOMAINS):
                suspicious_domains.append(domain)

        if suspicious_domains:
            unique_domains = sorted(set(suspicious_domains))[:3]
            ai_score += 15
            ai_indicators.append(
                'Vision located visually similar images on AI-forward galleries: ' + ', '.join(unique_domains) + '.'
            )

    if object_annotations:
        person_signals = [
            obj for obj in object_annotations
            if getattr(obj, 'name', '').lower().startswith('person') and getattr(obj, 'score', 0) >= 0.65
        ]
        if len(person_signals) >= 2:
            ai_score -= min(15, len(person_signals) * 4)
            support_signals.append('Detected multiple high-confidence human figures with consistent structure.')

    ai_score = max(0, min(100, ai_score))
    return ai_score, ai_indicators[:6], support_signals[:6], suspicious_domains[:6]


def score_to_verdict(score: int) -> str:
    if score >= 75:
        return 'Likely AI-generated'
    if score >= 45:
        return 'Possibly AI-assisted'
    return 'Likely human-captured'


def score_to_confidence(score: int) -> int:
    distance = abs(score - 50)
    base = 60 if 35 <= score <= 65 else 65
    confidence = base + int(round(distance * 0.5))
    return max(45, min(92, confidence))


def build_rationale(verdict: str, ai_signals: List[str], support_signals: List[str]) -> str:
    if verdict == 'Likely AI-generated':
        return ai_signals[0] if ai_signals else 'Vision identified multiple cues linked to synthetic generation.'
    if verdict == 'Possibly AI-assisted':
        if ai_signals:
            return ai_signals[0]
        if support_signals:
            return support_signals[0]
        return 'Vision surfaced mixed cues without a dominant signal.'
    # Likely human-captured
    if support_signals:
        return support_signals[0]
    if ai_signals:
        return 'Vision noted mild AI cues but overall signals align with natural capture.'
    return 'Vision analysis did not surface strong indicators either way.'


def build_suggestions(web_detection, warnings: List[str]) -> List[str]:
    suggestions: List[str] = []

    if web_detection and web_detection.pages_with_matching_images:
        first_domain = ''
        for page in web_detection.pages_with_matching_images:
            first_domain = normalise_domain(page.url)
            if first_domain:
                break
        if first_domain:
            suggestions.append(
                f'Review visually similar pages surfaced by Vision (e.g., {first_domain}) to trace provenance.'
            )

    if web_detection and web_detection.best_guess_labels:
        suggestions.append('Cross-check the web best-guess labels in a reverse image search for corroborating sources.')

    if warnings:
        suggestions.append('Handle the image carefully until flagged sensitive content is independently verified.')

    suggestions.append('Archive the original file and compare its metadata with trusted photojournalism outlets when possible.')

    if not suggestions:
        suggestions.append('Run a reverse image search to establish provenance before resharing.')

    return suggestions[:6]
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


@app.route('/vision/analyze', methods=['POST'])
def analyze_image_with_vision():
    """Analyze an image with Google Cloud Vision to surface AI authenticity cues."""
    try:
        client = get_vision_client()
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"Failed to initialise Vision client: {exc}")
        return jsonify({'error': 'Failed to initialise Vision client.'}), 500

    image_bytes: Optional[bytes] = None
    image_url: Optional[str] = None

    if 'image' in request.files:
        uploaded = request.files['image']
        image_bytes = uploaded.read()
    else:
        payload = request.get_json(silent=True) or {}
        base64_payload = payload.get('imageBase64') or payload.get('image_base64')
        image_url = payload.get('imageUrl') or payload.get('image_url')

        if base64_payload:
            try:
                image_bytes = base64.b64decode(base64_payload, validate=True)
            except (binascii.Error, ValueError):
                return jsonify({'error': 'Invalid base64 image payload supplied.'}), 400

    if image_bytes:
        if len(image_bytes) > 8 * 1024 * 1024:
            return jsonify({'error': 'The image exceeds the 8MB limit supported by Vision analysis.'}), 400
        image = vision.Image(content=image_bytes)
    elif image_url:
        image = vision.Image()
        image.source.image_uri = image_url
    else:
        return jsonify({'error': 'No image payload was provided for Vision analysis.'}), 400

    features = [
        vision.Feature(type_=vision.Feature.Type.LABEL_DETECTION, max_results=10),
        vision.Feature(type_=vision.Feature.Type.SAFE_SEARCH_DETECTION),
        vision.Feature(type_=vision.Feature.Type.WEB_DETECTION, max_results=10),
        vision.Feature(type_=vision.Feature.Type.OBJECT_LOCALIZATION, max_results=10),
        vision.Feature(type_=vision.Feature.Type.IMAGE_PROPERTIES),
        vision.Feature(type_=vision.Feature.Type.LOGO_DETECTION, max_results=5),
        vision.Feature(type_=vision.Feature.Type.TEXT_DETECTION, max_results=5),
    ]

    try:
        vision_response = client.annotate_image({'image': image, 'features': features})
    except (GoogleAPICallError, RetryError) as api_error:
        print(f"Vision API call failed: {api_error}")
        return jsonify({'error': 'Vision API request failed.', 'details': str(api_error)}), 502
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"Unexpected Vision API error: {exc}")
        return jsonify({'error': 'Unexpected error while calling Vision API.'}), 500

    if vision_response.error.message:
        print(f"Vision API returned an error: {vision_response.error.message}")
        return jsonify({'error': 'Vision API returned an error.', 'details': vision_response.error.message}), 502

    ai_score, ai_signals, support_signals, suspicious_domains = evaluate_ai_signals(
        vision_response.label_annotations,
        vision_response.web_detection,
        vision_response.localized_object_annotations,
    )

    safe_search_warnings = gather_safe_search_warnings(vision_response.safe_search_annotation)
    suggestions = build_suggestions(vision_response.web_detection, safe_search_warnings)

    verdict = score_to_verdict(ai_score)
    confidence = score_to_confidence(ai_score)
    rationale = build_rationale(verdict, ai_signals, support_signals)

    combined_indicators: List[str] = []
    combined_indicators.extend(ai_signals[:4])
    combined_indicators.extend(f'Supporting cue: {signal}' for signal in support_signals[:2])
    combined_indicators = combined_indicators[:6]

    best_guess_labels = [
        (guess.label or '').strip()
        for guess in (vision_response.web_detection.best_guess_labels or [])[:3]
        if (guess.label or '').strip()
    ] if vision_response.web_detection else []

    label_hints = [
        {
            'description': (label.description or '').strip(),
            'score': round(float(label.score or 0), 3),
        }
        for label in (vision_response.label_annotations or [])[:5]
        if (label.description or '').strip()
    ]

    response_payload = {
        'aiScore': ai_score,
        'verdict': verdict,
        'confidence': confidence,
        'rationale': rationale,
        'indicators': combined_indicators,
        'warnings': safe_search_warnings,
        'suggestedActions': suggestions,
        'bestGuessLabels': best_guess_labels,
        'labelHints': label_hints,
        'suspiciousDomains': sorted(set(suspicious_domains))[:5],
    }

    return jsonify(response_payload)

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