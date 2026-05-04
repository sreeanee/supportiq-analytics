"""
Sentiment Analysis Module

Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for rule-based
sentiment analysis, with custom adjustments for customer support context.
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict

# Initialize VADER analyzer
analyzer = SentimentIntensityAnalyzer()

# Custom keyword weights for support context
SUPPORT_KEYWORDS = {
    # Negative signals
    'urgent': -0.2,
    'critical': -0.3,
    'broken': -0.3,
    'frustrated': -0.4,
    'angry': -0.4,
    'unacceptable': -0.4,
    'terrible': -0.4,
    'worst': -0.4,
    'disappointed': -0.3,
    'failing': -0.3,
    'crashed': -0.3,
    'bug': -0.2,
    'error': -0.2,
    'issue': -0.1,
    'problem': -0.1,
    'not working': -0.3,
    'doesnt work': -0.3,
    "doesn't work": -0.3,

    # Positive signals
    'love': 0.3,
    'thank': 0.2,
    'thanks': 0.2,
    'great': 0.2,
    'amazing': 0.3,
    'excellent': 0.3,
    'awesome': 0.3,
    'helpful': 0.2,
    'appreciate': 0.2,
    'perfect': 0.3,
    'wonderful': 0.3,
    'fantastic': 0.3,
}


def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment of text using VADER with support-specific adjustments.

    Args:
        text: The text to analyze

    Returns:
        Dictionary with score (-1 to 1), label, and confidence
    """
    # Get base VADER scores
    scores = analyzer.polarity_scores(text)

    # Calculate custom adjustment based on support keywords
    lower_text = text.lower()
    adjustment = 0.0

    for keyword, weight in SUPPORT_KEYWORDS.items():
        if keyword in lower_text:
            adjustment += weight

    # Combine VADER compound score with adjustment
    # Limit adjustment impact to ±0.4
    adjustment = max(-0.4, min(0.4, adjustment))
    final_score = scores['compound'] + adjustment

    # Clamp to valid range
    final_score = max(-1.0, min(1.0, final_score))

    # Determine label
    if final_score >= 0.3:
        label = 'positive'
    elif final_score <= -0.3:
        label = 'negative'
    else:
        label = 'neutral'

    # Calculate confidence based on intensity
    intensity = abs(final_score)
    confidence = 0.6 + (intensity * 0.35)  # Range: 0.6 to 0.95

    return {
        'score': round(final_score, 3),
        'label': label,
        'confidence': round(confidence, 3)
    }


# Test function
if __name__ == "__main__":
    test_cases = [
        "This is terrible! Nothing works and I'm very frustrated!",
        "Great product! Love the new features, thank you!",
        "How do I reset my password?",
        "The dashboard has been broken for 2 days. This is urgent!",
        "Thanks for the quick response, you're amazing!"
    ]

    for text in test_cases:
        result = analyze_sentiment(text)
        print(f"\nText: {text}")
        print(f"Result: {result}")
