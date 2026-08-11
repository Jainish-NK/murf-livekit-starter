"""
Outbound calling module for SehatSaathi (Health Access track).
"""

from .outbound_database import (
    init_outbound_database,
    is_opted_out,
    record_opt_out,
    log_outbound_call,
    update_call_outcome,
    get_call_record,
    get_all_opt_outs,
)

__all__ = [
    "init_outbound_database",
    "is_opted_out",
    "record_opt_out",
    "log_outbound_call",
    "update_call_outcome",
    "get_call_record",
    "get_all_opt_outs",
]
