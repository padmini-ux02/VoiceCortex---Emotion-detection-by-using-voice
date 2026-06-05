"""
Professional PDF Report Generator for VoiceCortex.
Uses ReportLab canvas API for pixel-perfect layout with:
  • Full-bleed colour header banner with logo text
  • Colour-coded emotion badge (dominant emotion)
  • Confidence score progress bars for all 8 emotions
  • Feature Importance horizontal bar chart
  • Wellness & communication insights section
  • Styled footer with page number and branding line
"""

import os
import csv
from io import BytesIO
from datetime import datetime

import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER

from app.models.models import Prediction, User

# ─── Brand colours ────────────────────────────────────────────────────────────
INDIGO       = colors.HexColor("#4f46e5")
INDIGO_DARK  = colors.HexColor("#312e81")
INDIGO_LIGHT = colors.HexColor("#818cf8")
SLATE_900    = colors.HexColor("#0f172a")
SLATE_700    = colors.HexColor("#334155")
SLATE_500    = colors.HexColor("#64748b")
SLATE_200    = colors.HexColor("#e2e8f0")
SLATE_50     = colors.HexColor("#f8fafc")
WHITE        = colors.white

# Emotion → accent colour mapping
EMOTION_COLORS = {
    "Happy":    "#f59e0b",
    "Sad":      "#3b82f6",
    "Angry":    "#ef4444",
    "Neutral":  "#6b7280",
    "Fear":     "#8b5cf6",
    "Surprise": "#ec4899",
    "Disgust":  "#10b981",
    "Calm":     "#06b6d4",
}

EMOTION_EMOJIS = {
    "Happy":    "😊  HAPPY",
    "Sad":      "😢  SAD",
    "Angry":    "😡  ANGRY",
    "Neutral":  "😐  NEUTRAL",
    "Fear":     "😨  FEAR",
    "Surprise": "😲  SURPRISE",
    "Disgust":  "🤢  DISGUST",
    "Calm":     "😌  CALM",
}


# ─── Helper: draw rounded rectangle ───────────────────────────────────────────
def _rrect(c: canvas.Canvas, x, y, w, h, r, fill_color=None, stroke_color=None, stroke_width=0.5):
    if fill_color:
        c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(stroke_width)
    else:
        c.setStrokeColor(colors.transparent)
    p = c.beginPath()
    p.roundRect(x, y, w, h, r)
    c.drawPath(p, fill=1 if fill_color else 0, stroke=1 if stroke_color else 0)


# ─── Helper: progress bar ─────────────────────────────────────────────────────
def _progress_bar(c: canvas.Canvas, x, y, w, h, pct, track_color, fill_color, label, score_text):
    # Track
    _rrect(c, x, y, w, h, h/2, fill_color=track_color)
    # Fill
    filled_w = max(h, w * pct)
    _rrect(c, x, y, filled_w, h, h/2, fill_color=fill_color)
    # Label (left)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(SLATE_700)
    c.drawString(x - 90*mm + 4, y + h/2 - 3, label)
    # Score (right)
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(fill_color)
    c.drawString(x + w + 3*mm, y + h/2 - 3, score_text)


# ─── Header banner ────────────────────────────────────────────────────────────
def _draw_header(c: canvas.Canvas, width, height):
    banner_h = 52 * mm
    # Background gradient simulation using two rects
    c.setFillColor(INDIGO_DARK)
    c.rect(0, height - banner_h, width, banner_h, fill=1, stroke=0)

    # Decorative circles
    c.setFillColor(colors.HexColor("#6366f1"))
    c.setFillAlpha(0.25)
    c.circle(width - 25*mm, height - 10*mm, 45*mm, fill=1, stroke=0)
    c.circle(15*mm, height - 40*mm, 28*mm, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    # Logo badge
    badge_x, badge_y = 15*mm, height - 22*mm
    _rrect(c, badge_x, badge_y, 14*mm, 14*mm, 3*mm, fill_color=INDIGO)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(WHITE)
    c.drawCentredString(badge_x + 7*mm, badge_y + 4.5*mm, "VC")

    # Title
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(WHITE)
    c.drawString(33*mm, height - 19*mm, "VoiceCortex")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(INDIGO_LIGHT)
    c.drawString(33*mm, height - 26*mm, "Speech Emotion Recognition  |  AI-Powered Analysis Report")

    # Report label (top right)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#a5b4fc"))
    c.drawRightString(width - 15*mm, height - 15*mm, "CONFIDENTIAL ANALYSIS REPORT")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(INDIGO_LIGHT)
    c.drawRightString(width - 15*mm, height - 21*mm, datetime.utcnow().strftime("Generated  %d %B %Y  at  %H:%M UTC"))


# ─── Footer ───────────────────────────────────────────────────────────────────
def _draw_footer(c: canvas.Canvas, width, page_num):
    footer_y = 8*mm
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.5)
    c.line(15*mm, footer_y + 5*mm, width - 15*mm, footer_y + 5*mm)
    c.setFont("Helvetica", 8)
    c.setFillColor(SLATE_500)
    c.drawString(15*mm, footer_y, "VoiceCortex  ·  Powered by CNN + BiLSTM + Attention Deep Learning")
    c.drawRightString(width - 15*mm, footer_y, f"Page {page_num}")


# ─── Section heading ──────────────────────────────────────────────────────────
def _section_heading(c: canvas.Canvas, x, y, width, title, subtitle=""):
    # Left accent bar
    c.setFillColor(INDIGO)
    c.rect(x, y - 2*mm, 4, 16*mm, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(SLATE_900)
    c.drawString(x + 8*mm, y + 9*mm, title)
    if subtitle:
        c.setFont("Helvetica", 9)
        c.setFillColor(SLATE_500)
        c.drawString(x + 8*mm, y + 3*mm, subtitle)
    return y - 8*mm


# ─── Main PDF builder ─────────────────────────────────────────────────────────
def generate_pdf_report(prediction: Prediction, user: User, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    buf = BytesIO()
    width, height = A4
    c = canvas.Canvas(buf, pagesize=A4)

    emotion    = prediction.detected_emotion
    scores     = prediction.confidence_scores or {}
    feat_imp   = prediction.feature_importance or {}
    conf_pct   = scores.get(emotion, 0.0)
    em_color   = colors.HexColor(EMOTION_COLORS.get(emotion, "#6366f1"))
    filename   = (prediction.audio_filename or "").split(":", 1)[-1] or prediction.audio_filename or "N/A"

    # ── PAGE 1 ────────────────────────────────────────────────────────────────
    _draw_header(c, width, height)
    _draw_footer(c, width, 1)

    cur_y = height - 55*mm

    # ── Subject Info Row ──────────────────────────────────────────────────────
    info_x = 15*mm
    info_items = [
        ("Patient / User",   user.full_name or user.email),
        ("Email",            user.email),
        ("Audio File",       filename[:45] + ("…" if len(filename) > 45 else "")),
        ("Analysis Date",    prediction.created_at.strftime("%d %b %Y, %H:%M UTC")),
        ("Record ID",        f"#{prediction.id}"),
    ]
    col_w = (width - 30*mm) / 3
    for idx, (lbl, val) in enumerate(info_items):
        col = idx % 3
        row = idx // 3
        bx = info_x + col * col_w
        by = cur_y - row * 13*mm
        _rrect(c, bx, by - 9*mm, col_w - 3*mm, 11*mm, 2.5*mm, fill_color=SLATE_50, stroke_color=SLATE_200)
        c.setFont("Helvetica", 8)
        c.setFillColor(SLATE_500)
        c.drawString(bx + 4*mm, by - 1*mm, lbl.upper())
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(SLATE_700)
        c.drawString(bx + 4*mm, by - 7*mm, val)

    cur_y -= 28*mm

    # ── Primary Emotion Badge ─────────────────────────────────────────────────
    badge_w, badge_h = width - 30*mm, 26*mm
    _rrect(c, 15*mm, cur_y - badge_h, badge_w, badge_h, 4*mm, fill_color=em_color)
    # White overlay gradient effect
    c.setFillAlpha(0.10)
    c.setFillColor(WHITE)
    c.rect(15*mm, cur_y - badge_h, badge_w, badge_h, fill=1, stroke=0)
    c.setFillAlpha(1.0)

    label_txt = EMOTION_EMOJIS.get(emotion, emotion.upper())
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(WHITE)
    c.drawString(22*mm, cur_y - 15*mm, label_txt)

    conf_txt = f"{conf_pct:.1%} Confidence"
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - 22*mm, cur_y - 12*mm, conf_txt)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#ffffff"))
    c.setFillAlpha(0.8)
    c.drawRightString(width - 22*mm, cur_y - 18*mm, "Primary Classification")
    c.setFillAlpha(1.0)

    cur_y -= badge_h + 8*mm

    # ── Section 1: Confidence Scores ─────────────────────────────────────────
    cur_y = _section_heading(c, 15*mm, cur_y, width,
                             "1. Emotion Confidence Scores",
                             "Probability distribution across all 8 emotion classes")
    cur_y -= 5*mm

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    bar_x     = 15*mm + 90*mm   # starts after label column
    bar_w     = width - bar_x - 30*mm
    bar_h     = 5.5*mm
    bar_gap   = 9.5*mm

    for (emo, score) in sorted_scores:
        bar_color = colors.HexColor(EMOTION_COLORS.get(emo, "#6366f1"))
        _rrect(c, bar_x, cur_y, bar_w, bar_h, bar_h/2, fill_color=SLATE_200)
        filled = max(bar_h, bar_w * score)
        _rrect(c, bar_x, cur_y, filled, bar_h, bar_h/2, fill_color=bar_color)

        # emotion label
        c.setFont("Helvetica" + ("-Bold" if emo == emotion else ""), 9.5)
        c.setFillColor(SLATE_900 if emo == emotion else SLATE_700)
        c.drawString(15*mm, cur_y + bar_h/2 - 3.5, emo)

        # score label
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(bar_color)
        c.drawString(bar_x + bar_w + 3*mm, cur_y + bar_h/2 - 3.5, f"{score:.1%}")

        cur_y -= bar_gap

    cur_y -= 5*mm

    # ── Section 2: Feature Importance ────────────────────────────────────────
    cur_y = _section_heading(c, 15*mm, cur_y, width,
                             "2. Acoustic Feature Importance (XAI)",
                             "Percentage contribution of each vocal feature in the classification decision")
    cur_y -= 5*mm

    if feat_imp:
        max_val = max(feat_imp.values()) or 1
        feat_bar_x = 15*mm + 110*mm
        feat_bar_w = width - feat_bar_x - 30*mm

        for feat, val in sorted(feat_imp.items(), key=lambda x: x[1], reverse=True):
            pct = val / max_val
            _rrect(c, feat_bar_x, cur_y, feat_bar_w, bar_h, bar_h/2, fill_color=SLATE_200)
            filled = max(bar_h, feat_bar_w * pct)
            _rrect(c, feat_bar_x, cur_y, filled, bar_h, bar_h/2, fill_color=INDIGO)

            c.setFont("Helvetica", 9)
            c.setFillColor(SLATE_700)
            c.drawString(15*mm, cur_y + bar_h/2 - 3.5, feat[:52])

            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(INDIGO)
            c.drawString(feat_bar_x + feat_bar_w + 3*mm, cur_y + bar_h/2 - 3.5, f"{val:.1f}%")
            cur_y -= bar_gap
    else:
        c.setFont("Helvetica-Oblique", 9.5)
        c.setFillColor(SLATE_500)
        c.drawString(15*mm, cur_y, "Feature importance data not available for this recording.")
        cur_y -= bar_gap

    cur_y -= 4*mm

    # ── Section 3: Wellness Insights ─────────────────────────────────────────
    if cur_y > 60*mm:
        cur_y = _section_heading(c, 15*mm, cur_y, width,
                                 "3. Wellness & Communication Insights",
                                 "AI-generated guidance based on detected emotional state")
        cur_y -= 6*mm

        from app.services.assistant import get_ai_assistant_insights
        try:
            insights = get_ai_assistant_insights(prediction)
            wellness = insights.get("wellness_tip", "N/A")
            comms    = insights.get("communication_suggestion", "N/A")
        except Exception:
            wellness = "Maintain healthy communication habits."
            comms    = "Be mindful of your emotional state in conversations."

        boxes = [
            ("🧘  Mental Wellness Tip",    wellness,  colors.HexColor("#ecfdf5"), colors.HexColor("#10b981")),
            ("💬  Communication Guidance", comms,     colors.HexColor("#eef2ff"), INDIGO),
        ]
        for (title, body, bg, accent) in boxes:
            box_h = 26*mm
            _rrect(c, 15*mm, cur_y - box_h, width - 30*mm, box_h, 3*mm,
                   fill_color=bg, stroke_color=accent, stroke_width=0.8)
            # accent left strip
            c.setFillColor(accent)
            c.rect(15*mm, cur_y - box_h, 2.5*mm, box_h, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 9.5)
            c.setFillColor(accent)
            c.drawString(21*mm, cur_y - 6*mm, title)
            c.setFont("Helvetica", 9)
            c.setFillColor(SLATE_700)
            # word-wrap body text manually at ~88 chars per line
            words = body.split()
            lines, line = [], []
            for w in words:
                if len(" ".join(line + [w])) > 88:
                    lines.append(" ".join(line))
                    line = [w]
                else:
                    line.append(w)
            if line:
                lines.append(" ".join(line))
            for li, ln in enumerate(lines[:2]):
                c.drawString(21*mm, cur_y - 12*mm - li*5*mm, ln)
            cur_y -= box_h + 5*mm

    # ── Section 4: Timeline Summary ───────────────────────────────────────────
    timeline = prediction.timeline_analysis or []
    if timeline and cur_y > 50*mm:
        cur_y = _section_heading(c, 15*mm, cur_y, width,
                                 "4. Temporal Emotion Timeline",
                                 "Dominant emotion detected across 10 time segments")
        cur_y -= 6*mm

        col_count = min(len(timeline), 10)
        cell_w = (width - 30*mm) / col_count
        for i, frame in enumerate(timeline[:col_count]):
            fx = 15*mm + i * cell_w
            f_em = frame.get("emotion", "Neutral")
            f_conf = frame.get("confidence", 0.0)
            fc = colors.HexColor(EMOTION_COLORS.get(f_em, "#6366f1"))
            # mini bar
            bar_max_h = 14*mm
            bar_real  = max(2*mm, bar_max_h * f_conf)
            _rrect(c, fx + 1*mm, cur_y - bar_max_h, cell_w - 2*mm, bar_max_h, 1.5*mm, fill_color=SLATE_200)
            _rrect(c, fx + 1*mm, cur_y - bar_real, cell_w - 2*mm, bar_real, 1.5*mm, fill_color=fc)
            c.setFont("Helvetica", 7.5)
            c.setFillColor(SLATE_500)
            c.drawCentredString(fx + cell_w/2, cur_y - bar_max_h - 4*mm, f"{frame.get('time', 0):.1f}s")
            c.setFont("Helvetica-Bold", 7)
            c.setFillColor(fc)
            c.drawCentredString(fx + cell_w/2, cur_y - bar_max_h - 8.5*mm, f_em[:7])
        cur_y -= 28*mm

    # ── Disclaimer ────────────────────────────────────────────────────────────
    if cur_y > 25*mm:
        _rrect(c, 15*mm, 20*mm, width - 30*mm, 12*mm, 2*mm, fill_color=SLATE_50, stroke_color=SLATE_200)
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(SLATE_500)
        c.drawString(18*mm, 25.5*mm,
            "Disclaimer: This report is generated by an AI system for informational purposes only. "
            "It does not constitute medical or clinical advice.")

    c.showPage()

    # ── Save ──────────────────────────────────────────────────────────────────
    c.save()

    with open(output_path, "wb") as f:
        f.write(buf.getvalue())

    return output_path


# ─── CSV & Excel exports (unchanged) ─────────────────────────────────────────

def generate_csv_history(predictions: list, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Date (UTC)", "Filename", "Primary Emotion", "Confidence",
                         "Happy", "Sad", "Angry", "Neutral", "Fear", "Surprise", "Disgust", "Calm"])
        for p in predictions:
            conf = p.confidence_scores.get(p.detected_emotion, 0.0)
            sc   = p.confidence_scores or {}
            writer.writerow([
                p.id, p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                (p.audio_filename or "").split(":", 1)[-1],
                p.detected_emotion, f"{conf:.2%}",
                *[f"{sc.get(e, 0):.2%}" for e in ["Happy","Sad","Angry","Neutral","Fear","Surprise","Disgust","Calm"]]
            ])
    return output_path


def generate_excel_history(predictions: list, output_path: str) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    data = []
    for p in predictions:
        conf = p.confidence_scores.get(p.detected_emotion, 0.0)
        row  = {
            "ID":               p.id,
            "Date (UTC)":       p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "Audio Filename":   (p.audio_filename or "").split(":", 1)[-1],
            "Detected Emotion": p.detected_emotion,
            "Confidence":       round(conf, 4),
        }
        for emo, score in (p.confidence_scores or {}).items():
            row[f"Conf_{emo}"] = round(score, 4)
        data.append(row)
    df = pd.DataFrame(data)
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="VoiceCortex History")
        ws = writer.sheets["VoiceCortex History"]
        # Auto-fit column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col) + 4
            ws.column_dimensions[col[0].column_letter].width = min(max_len, 40)
    return output_path
