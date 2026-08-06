"""
Centralised logging configuration for the Resume AI Analyzer backend.

Every module should import the logger from here:

    from logger import get_logger
    logger = get_logger(__name__)

Log output goes to:
  - stdout (console) — INFO and above
  - backend.log (file, same directory) — DEBUG and above, rotated at 5 MB
"""
import logging
import logging.handlers
import os
import sys

LOG_FILE = os.path.join(os.path.dirname(__file__), "backend.log")
LOG_LEVEL_CONSOLE = logging.INFO
LOG_LEVEL_FILE = logging.DEBUG

_FMT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FMT = "%Y-%m-%d %H:%M:%S"


def _build_root_logger() -> logging.Logger:
    root = logging.getLogger("resume_ai")
    root.setLevel(logging.DEBUG)          # capture everything; handlers filter

    if root.handlers:                     # avoid duplicate handlers on reload
        return root

    # ── Console handler ──────────────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(LOG_LEVEL_CONSOLE)
    console_handler.setFormatter(logging.Formatter(_FMT, _DATE_FMT))
    root.addHandler(console_handler)

    # ── Rotating file handler ────────────────────────────────────────────────
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_FILE,
            maxBytes=5 * 1024 * 1024,   # 5 MB
            backupCount=3,
            encoding="utf-8",
        )
        file_handler.setLevel(LOG_LEVEL_FILE)
        file_handler.setFormatter(logging.Formatter(_FMT, _DATE_FMT))
        root.addHandler(file_handler)
    except OSError as exc:
        root.warning(f"Could not open log file {LOG_FILE}: {exc}. File logging disabled.")

    return root


_root_logger = _build_root_logger()


def get_logger(name: str) -> logging.Logger:
    """Return a child logger under the 'resume_ai' namespace."""
    return _root_logger.getChild(name)
