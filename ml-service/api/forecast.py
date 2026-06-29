"""
Ticket Volume Forecasting Module

Uses simple moving average with seasonality for forecasting.
Can be extended to use Facebook Prophet for more accurate predictions.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List
import pandas as pd

def generate_forecast(historical_data: List[Dict], days_ahead: int = 7) -> List[Dict]:
    """
    Generate ticket volume forecast based on historical data.

    Args:
        historical_data: List of dicts with 'date' and 'count' keys
        days_ahead: Number of days to forecast

    Returns:
        List of forecast dictionaries with date, predicted, lower, upper bounds
    """
    if not historical_data:
        # Return mock forecast if no data
        return _generate_mock_forecast(days_ahead)

    try:
        # Convert to pandas DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Calculate basic statistics
        avg_count = df['count'].mean()
        std_count = df['count'].std()

        # Calculate day-of-week patterns (seasonality)
        df['day_of_week'] = df['date'].dt.dayofweek
        dow_means = df.groupby('day_of_week')['count'].mean()

        # Generate forecast
        forecasts = []
        last_date = df['date'].max()

        for i in range(1, days_ahead + 1):
            forecast_date = last_date + timedelta(days=i)
            day_of_week = forecast_date.weekday()

            # Get day-of-week factor
            if day_of_week in dow_means.index:
                dow_factor = dow_means[day_of_week] / avg_count
            else:
                dow_factor = 0.7 if day_of_week >= 5 else 1.0  # Weekend adjustment

            # Calculate prediction with seasonality
            predicted = avg_count * dow_factor

            # Add some trend (using last few days)
            if len(df) >= 7:
                recent_trend = (df['count'].tail(3).mean() - df['count'].tail(7).mean()) / 4
                predicted += recent_trend * i * 0.5

            # Calculate confidence interval
            uncertainty = std_count * (1 + 0.1 * i)  # Uncertainty grows with time
            lower = max(0, predicted - uncertainty)
            upper = predicted + uncertainty

            forecasts.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predicted': round(predicted),
                'lower': round(lower),
                'upper': round(upper)
            })

        return forecasts

    except Exception as e:
        print(f"Forecast error: {e}")
        return _generate_mock_forecast(days_ahead)


def _generate_mock_forecast(days_ahead: int) -> List[Dict]:
    """Generate mock forecast data for demo purposes."""
    forecasts = []
    base_value = 50

    for i in range(days_ahead):
        forecast_date = datetime.now() + timedelta(days=i + 1)
        day_of_week = forecast_date.weekday()

        # Weekend adjustment
        if day_of_week >= 5:
            factor = 0.6
        else:
            factor = 1.0 + (day_of_week * 0.05)  # Slight increase through week

        predicted = base_value * factor + np.random.uniform(-5, 5)
        variance = predicted * 0.2

        forecasts.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'predicted': round(predicted),
            'lower': round(predicted - variance),
            'upper': round(predicted + variance)
        })

    return forecasts


def forecast_with_prophet(historical_data: List[Dict], days_ahead: int = 7) -> List[Dict]:
    """
    Generate forecast using Facebook Prophet (optional, more accurate).
    """
    try:
        from prophet import Prophet

        # Prepare data for Prophet
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.rename(columns={'date': 'ds', 'count': 'y'})

        # Initialize and fit model
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05
        )
        model.fit(df)

        # Make future dataframe
        future = model.make_future_dataframe(periods=days_ahead)

        # Predict
        forecast = model.predict(future)

        # Extract results
        results = []
        for _, row in forecast.tail(days_ahead).iterrows():
            results.append({
                'date': row['ds'].strftime('%Y-%m-%d'),
                'predicted': round(row['yhat']),
                'lower': round(row['yhat_lower']),
                'upper': round(row['yhat_upper'])
            })

        return results

    except ImportError:
        print("Prophet not available, using simple forecast")
        return generate_forecast(historical_data, days_ahead)
    except Exception as e:
        print(f"Prophet error: {e}")
        return generate_forecast(historical_data, days_ahead)


# Test function
if __name__ == "__main__":
    # Generate test historical data
    test_data = []
    base_date = datetime.now() - timedelta(days=30)

    for i in range(30):
        date = base_date + timedelta(days=i)
        # Simulate weekly pattern
        base_count = 50
        dow_factor = 0.6 if date.weekday() >= 5 else 1.0 + (date.weekday() * 0.05)
        count = int(base_count * dow_factor + np.random.uniform(-10, 10))

        test_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })

    # Generate forecast
    forecast = generate_forecast(test_data, 7)
    print("\nForecast for next 7 days:")
    for f in forecast:
        print(f"  {f['date']}: {f['predicted']} ({f['lower']}-{f['upper']})")
