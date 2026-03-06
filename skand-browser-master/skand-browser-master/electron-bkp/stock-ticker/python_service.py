import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from flask import Flask, jsonify, request, make_response
import yfinance as yf
import pandas as pd
import numpy as np

app = Flask(__name__)

# Basic CORS for local usage
@app.after_request
def add_cors(resp):
    resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return resp

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/history/<symbol>', methods=['GET'])
def history(symbol: str):
    # Range: 6 months by default
    period = request.args.get('period', '6mo')
    interval = request.args.get('interval', '1d')
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        if hist is None or hist.empty:
            return jsonify([])
        # Ensure index is datetime
        hist = hist.dropna()
        rows = []
        for idx, row in hist.iterrows():
            date_str = idx.strftime('%Y-%m-%d') if hasattr(idx, 'strftime') else str(idx)
            close_val = float(row['Close']) if 'Close' in row else None
            if close_val is not None:
                rows.append({ 'date': date_str, 'close': close_val })
        return jsonify(rows)
    except Exception as e:
        return make_response(jsonify({ 'error': str(e) }), 500)


@app.route('/overview/<symbol>', methods=['GET'])
def overview(symbol: str):
    """Return basic overview: price, PERatio (trailing), 52W high/low, last updated date."""
    try:
        t = yf.Ticker(symbol)
        info = t.fast_info if hasattr(t, 'fast_info') else {}
        price = None
        try:
            price = float(info.get('last_price')) if info else None
        except Exception:
            pass
        if price is None:
            # fallback to recent close
            hist = t.history(period='1mo', interval='1d')
            if hist is not None and not hist.empty:
                price = float(hist['Close'].iloc[-1])
                updated = hist.index[-1]
            else:
                updated = None
        else:
            # try to infer updated date from history
            hist = t.history(period='1mo', interval='1d')
            updated = hist.index[-1] if hist is not None and not hist.empty else None
        info_dict = getattr(t, 'info', {}) or {}
        pe = info_dict.get('trailingPE') or info_dict.get('forwardPE')
        high_52w = info_dict.get('fiftyTwoWeekHigh')
        low_52w = info_dict.get('fiftyTwoWeekLow')
        result = {
            'price': price,
            'PERatio': pe,
            '52WeekHigh': high_52w,
            '52WeekLow': low_52w,
            'updated': updated.strftime('%Y-%m-%d') if updated is not None and hasattr(updated, 'strftime') else None
        }
        return jsonify(result)
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)


@app.route('/indicators/<symbol>', methods=['GET'])
def indicators(symbol: str):
    """Compute latest indicator values from historical data.
    Query params:
      ind: comma-separated list among RSI,SMA20,EMA20,MACD,BBANDS20
      period: history period, default 6mo
      interval: data interval, default 1d
    """
    want = request.args.get('ind', '')
    period = request.args.get('period', '6mo')
    interval = request.args.get('interval', '1d')
    inds = set([s.strip().upper() for s in want.split(',') if s.strip()])
    try:
        t = yf.Ticker(symbol)
        df = t.history(period=period, interval=interval)
        if df is None or df.empty:
            return jsonify({})
        df = df.dropna().copy()
        out: Dict[str, Any] = {}

        close = df['Close']
        if 'SMA20' in inds:
            out['SMA20'] = float(close.rolling(20).mean().iloc[-1]) if len(close) >= 20 else None
        if 'EMA20' in inds:
            out['EMA20'] = float(close.ewm(span=20, adjust=False).mean().iloc[-1]) if len(close) >= 20 else None
        if 'RSI' in inds:
            # RSI 14
            delta = close.diff()
            up = delta.clip(lower=0)
            down = -1 * delta.clip(upper=0)
            roll_up = up.rolling(14).mean()
            roll_down = down.rolling(14).mean()
            rs = roll_up / (roll_down.replace(0, np.nan))
            rsi_series = 100.0 - (100.0 / (1.0 + rs))
            out['RSI'] = float(rsi_series.iloc[-1]) if len(rsi_series) >= 14 else None
        if 'MACD' in inds:
            ema12 = close.ewm(span=12, adjust=False).mean()
            ema26 = close.ewm(span=26, adjust=False).mean()
            macd = ema12 - ema26
            signal = macd.ewm(span=9, adjust=False).mean()
            out['MACD'] = float(macd.iloc[-1]) if len(macd) > 0 else None
            out['MACD_SIGNAL'] = float(signal.iloc[-1]) if len(signal) > 0 else None
        if 'BBANDS20' in inds:
            m = close.rolling(20).mean()
            sd = close.rolling(20).std(ddof=0)
            upper = m + 2 * sd
            lower = m - 2 * sd
            out['BBANDS_UPPER20'] = float(upper.iloc[-1]) if len(upper) >= 20 else None
            out['BBANDS_LOWER20'] = float(lower.iloc[-1]) if len(lower) >= 20 else None
        return jsonify(out)
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)


@app.route('/universe/<market>', methods=['GET'])
def universe(market: str):
    """Return a curated universe of major stocks grouped by sector for a market.
    Market examples: 'US', 'IN'.
    Response shape:
      { 'Technology': ['AAPL','MSFT',...], 'Financials': [...], ... }
    """
    m = (market or '').upper()
    # Minimal curated lists; you can expand these as needed.
    us = {
        'Technology': ['AAPL','MSFT','NVDA','GOOGL','AMZN','META','AVGO','ADBE','ORCL'],
        'Financials': ['JPM','BAC','WFC','GS','MS','C','AXP','BLK'],
        'Healthcare': ['UNH','JNJ','PFE','ABT','LLY','MRK','TMO'],
        'Consumer Discretionary': ['HD','MCD','NKE','SBUX','TM','LOW'],
        'Consumer Staples': ['PG','KO','PEP','COST','WMT'],
        'Energy': ['XOM','CVX','COP','SLB'],
        'Industrials': ['CAT','HON','GE','UPS','BA','MMM'],
        'Communication Services': ['VZ','T','CMCSA','NFLX'],
        'Materials': ['LIN','APD','ECL'],
        'Utilities': ['NEE','DUK','SO']
    }
    in_ = {
        'Technology': ['TCS.NS','INFY.NS','WIPRO.NS','HCLTECH.NS','TECHM.NS'],
        'Financials': ['HDFCBANK.NS','ICICIBANK.NS','SBIN.NS','KOTAKBANK.NS','AXISBANK.NS'],
        'Energy': ['RELIANCE.NS','ONGC.NS','BPCL.NS','IOC.NS'],
        'Consumer Staples': ['HINDUNILVR.NS','ITC.NS','NESTLEIND.NS'],
        'Industrials': ['LTD.NS','LT.NS','TATAMOTORS.NS','M&M.NS'],
        'Healthcare': ['SUNPHARMA.NS','DRREDDY.NS','CIPLA.NS'],
        'Materials': ['TATASTEEL.NS','HINDALCO.NS','JSWSTEEL.NS'],
        'Utilities': ['POWERGRID.NS','NTPC.NS']
    }
    if m == 'US':
        return jsonify(us)
    if m == 'IN' or m == 'INDIA':
        return jsonify(in_)
    # Default: return US as fallback
    return jsonify(us)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5005'))
    app.run(host='127.0.0.1', port=port)
