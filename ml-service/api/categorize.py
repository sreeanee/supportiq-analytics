"""
Ticket Categorization Module

Uses keyword matching and pattern recognition for ticket categorization.
Can be extended to use GPT-4 or a fine-tuned classifier.
"""

import re
from typing import Dict, List, Tuple
import os
from openai import OpenAI

# Category definitions with keywords and patterns
CATEGORIES = {
    'bug_report': {
        'keywords': ['bug', 'error', 'crash', 'broken', 'not working', 'doesnt work',
                     'fail', 'issue', 'problem', 'glitch', '500', '404', 'exception'],
        'patterns': [
            r'(?:getting|seeing|receiving)\s+(?:an?\s+)?error',
            r'(?:app|page|site|dashboard)\s+(?:crashed|crashes|crashing)',
            r'(?:doesn\'t|does not|won\'t|will not)\s+(?:work|load|open)',
            r'broken\s+(?:link|button|feature)',
        ],
        'weight': 1.0
    },
    'feature_request': {
        'keywords': ['feature', 'request', 'wish', 'would be nice', 'suggestion',
                     'add', 'implement', 'support for', 'integration', 'could you'],
        'patterns': [
            r'(?:can|could)\s+you\s+(?:add|implement|create)',
            r'(?:would|it\'d)\s+be\s+(?:nice|great|helpful)',
            r'feature\s+request',
            r'(?:please|pls)\s+(?:add|implement)',
        ],
        'weight': 1.0
    },
    'how_to_question': {
        'keywords': ['how to', 'how do', 'how can', 'what is', 'where is',
                     'help me', 'guide', 'tutorial', 'documentation', 'explain'],
        'patterns': [
            r'how\s+(?:do|can|to)\s+(?:i|we)',
            r'(?:what|where)\s+is\s+(?:the|a)',
            r'(?:can|could)\s+you\s+(?:explain|show|help)',
            r'(?:looking|searching)\s+for\s+(?:help|guide|docs)',
        ],
        'weight': 1.0
    },
    'billing_issue': {
        'keywords': ['billing', 'payment', 'invoice', 'charge', 'subscription',
                     'refund', 'credit card', 'pricing', 'upgrade', 'downgrade',
                     'cancel', 'renewal', 'plan', 'trial'],
        'patterns': [
            r'(?:charged|billed)\s+(?:twice|incorrectly|wrong)',
            r'(?:cancel|change)\s+(?:my|the)\s+subscription',
            r'(?:payment|card)\s+(?:failed|declined|rejected)',
            r'(?:request|want)\s+(?:a\s+)?refund',
        ],
        'weight': 1.2  # Higher weight for billing (often urgent)
    },
    'complaint': {
        'keywords': ['disappointed', 'frustrated', 'angry', 'unacceptable',
                     'terrible', 'worst', 'horrible', 'ridiculous', 'furious'],
        'patterns': [
            r'(?:very|extremely|really)\s+(?:disappointed|frustrated|angry)',
            r'(?:this|it)\s+is\s+(?:unacceptable|ridiculous|terrible)',
            r'(?:worst|terrible)\s+(?:service|experience|support)',
            r'(?:never|not)\s+(?:using|coming back)',
        ],
        'weight': 1.1
    },
    'other': {
        'keywords': [],
        'patterns': [],
        'weight': 0.5
    }
}


def _calculate_keyword_score(text: str, keywords: List[str]) -> float:
    """Calculate score based on keyword matches."""
    lower_text = text.lower()
    matches = sum(1 for kw in keywords if kw in lower_text)
    return min(matches * 0.2, 1.0)  # Cap at 1.0


def _calculate_pattern_score(text: str, patterns: List[str]) -> float:
    """Calculate score based on regex pattern matches."""
    lower_text = text.lower()
    matches = sum(1 for p in patterns if re.search(p, lower_text))
    return min(matches * 0.3, 1.0)  # Cap at 1.0


def categorize_ticket(subject: str, description: str) -> Dict:
    """
    Categorize a support ticket based on subject and description.

    Args:
        subject: Ticket subject line
        description: Full ticket description

    Returns:
        Dictionary with category, confidence, and reasoning
    """
    # Combine text (subject weighted higher)
    combined_text = f"{subject} {subject} {description}"

    scores: Dict[str, float] = {}

    for category, config in CATEGORIES.items():
        keyword_score = _calculate_keyword_score(combined_text, config['keywords'])
        pattern_score = _calculate_pattern_score(combined_text, config['patterns'])

        # Combine scores with weight
        total_score = (keyword_score * 0.4 + pattern_score * 0.6) * config['weight']
        scores[category] = total_score

    # Get best category
    best_category = max(scores, key=scores.get)
    best_score = scores[best_category]

    # If no good match, default to 'other'
    if best_score < 0.1:
        best_category = 'other'
        best_score = 0.5

    # Calculate confidence
    confidence = min(0.5 + best_score * 0.5, 0.95)

    # Generate reasoning
    reasoning = _generate_reasoning(combined_text, best_category)

    return {
        'category': best_category,
        'confidence': round(confidence, 3),
        'reasoning': reasoning
    }


def _generate_reasoning(text: str, category: str) -> str:
    """Generate explanation for categorization."""
    reasons = {
        'bug_report': 'Detected technical issue keywords and error-related patterns',
        'feature_request': 'Contains request language and feature-related terms',
        'how_to_question': 'Question format detected with help-seeking language',
        'billing_issue': 'Contains payment, subscription, or billing-related terms',
        'complaint': 'Detected negative sentiment and complaint language',
        'other': 'No clear category match, requires manual review'
    }
    return reasons.get(category, 'Categorized based on content analysis')


def categorize_with_openai(subject: str, description: str) -> Dict:
    """
    Categorize using OpenAI GPT-4 (optional, requires API key).
    """
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return categorize_ticket(subject, description)

    client = OpenAI(api_key=api_key)

    prompt = f"""Analyze this customer support ticket and categorize it.

Subject: {subject}
Description: {description}

Categories:
- bug_report: Software defects or errors
- feature_request: New functionality requests
- how_to_question: Usage questions
- billing_issue: Payment or subscription issues
- complaint: Negative feedback about service
- other: Doesn't fit above categories

Return JSON only: {{"category": "category_name", "confidence": 0.0-1.0, "reasoning": "brief explanation"}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at categorizing customer support tickets. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=200
        )

        import json
        result = json.loads(response.choices[0].message.content)
        return {
            'category': result.get('category', 'other'),
            'confidence': result.get('confidence', 0.8),
            'reasoning': result.get('reasoning', 'Categorized by AI')
        }
    except Exception as e:
        print(f"OpenAI error: {e}")
        return categorize_ticket(subject, description)


# Test function
if __name__ == "__main__":
    test_cases = [
        ("Payment failed - card declined", "I tried to upgrade my plan but payment keeps failing"),
        ("Feature request: Dark mode", "Would be great if you could add a dark mode option"),
        ("Dashboard not loading", "Getting error 500 when accessing the dashboard, it crashed"),
        ("How to export data?", "Can you explain how to export my data to CSV?"),
        ("Terrible service", "This is absolutely unacceptable! I'm very frustrated with your service"),
    ]

    for subject, description in test_cases:
        result = categorize_ticket(subject, description)
        print(f"\nSubject: {subject}")
        print(f"Result: {result}")
