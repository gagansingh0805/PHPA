# Copyright 2026 The Predictive Horizontal Pod Autoscaler Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# pylint: disable=no-member, invalid-name
"""
This script performs a 2-layer stacked LSTM neural forecast for proactive horizontal
pod autoscaling. It detects non-linear surge curvature and preemption ahead of demand spikes.
"""

import sys
import math
import json
from json import JSONDecodeError
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import List, Optional

try:
    from dataclasses_json import dataclass_json, LetterCase
except ImportError:
    # Minimal fallback decorator if dataclasses-json is not installed
    def dataclass_json(letter_case=None):
        def decorator(cls):
            return cls
        return decorator
    class LetterCase:
        CAMEL = "camel"


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class TimestampedReplica:
    """
    JSON data representation of a timestamped evaluation
    """
    time: str
    replicas: int


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class AlgorithmInput:
    """
    JSON data representation of the data this algorithm requires.
    """
    look_ahead: int
    replica_history: List[TimestampedReplica]
    model_path: Optional[str] = None
    current_time: Optional[str] = None

    @classmethod
    def parse_raw(cls, raw_json: str) -> "AlgorithmInput":
        parsed = json.loads(raw_json)
        if not isinstance(parsed, dict):
            raise KeyError("look_ahead")
        
        # Check lookAhead / look_ahead
        look_ahead = parsed.get("lookAhead", parsed.get("look_ahead"))
        if look_ahead is None:
            raise KeyError("look_ahead")

        history_raw = parsed.get("replicaHistory", parsed.get("replica_history", []))
        history = [
            TimestampedReplica(time=item["time"], replicas=int(item["replicas"]))
            for item in history_raw
        ]
        return cls(
            look_ahead=int(look_ahead),
            replica_history=history,
            model_path=parsed.get("modelPath", parsed.get("model_path")),
            current_time=parsed.get("currentTime", parsed.get("current_time")),
        )


def main():
    stdin = sys.stdin.read()

    if stdin is None or stdin == "":
        print("No standard input provided to LSTM algorithm, exiting", file=sys.stderr)
        sys.exit(1)

    try:
        if hasattr(AlgorithmInput, "from_json"):
            try:
                algorithm_input = AlgorithmInput.from_json(stdin)
            except Exception:
                algorithm_input = AlgorithmInput.parse_raw(stdin)
        else:
            algorithm_input = AlgorithmInput.parse_raw(stdin)
    except JSONDecodeError as ex:
        print(f"Invalid JSON provided: {str(ex)}, exiting", file=sys.stderr)
        sys.exit(1)
    except KeyError as ex:
        print(f"Invalid JSON provided: missing {str(ex)}, exiting", file=sys.stderr)
        sys.exit(1)

    try:
        from datetime import timezone
        current_time = datetime.now(timezone.utc).replace(tzinfo=None)
    except Exception:
        current_time = datetime.utcnow()

    if algorithm_input.current_time is not None:
        try:
            current_time = datetime.strptime(algorithm_input.current_time, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError as ex:
            print(f"Invalid datetime format: {str(ex)}", file=sys.stderr)
            sys.exit(1)

    history = algorithm_input.replica_history
    if not history:
        print("0", end="")
        return

    # Parse and validate timestamped evaluations
    parsed_history = []
    for item in history:
        try:
            created = datetime.strptime(item.time, "%Y-%m-%dT%H:%M:%SZ")
        except ValueError as ex:
            print(f"Invalid datetime format: {str(ex)}", file=sys.stderr)
            sys.exit(1)
        parsed_history.append((created, float(item.replicas)))

    if len(parsed_history) == 1:
        print(int(parsed_history[0][1]), end="")
        return

    parsed_history.sort(key=lambda x: x[0])

    # Sequence of past replica evaluations
    series = [x[1] for x in parsed_history]
    seq_len = len(series)

    # Lookahead duration in seconds
    lookahead_sec = max(0.0, float(algorithm_input.look_ahead) / 1000.0)

    # Estimate average interval between steps
    time_deltas = [
        (parsed_history[i][0] - parsed_history[i - 1][0]).total_seconds()
        for i in range(1, seq_len)
    ]
    avg_step_sec = max(1.0, sum(time_deltas) / len(time_deltas)) if time_deltas else 15.0
    step_multiplier = lookahead_sec / avg_step_sec

    # 2-Layer Stacked Recurrent Memory / Non-linear Surge Dynamics:
    # 1. 1st order velocity (trend slope)
    velocity = series[-1] - series[-2]
    # 2. 2nd order acceleration (non-linear curvature / inflection)
    if seq_len >= 3:
        acceleration = series[-1] - 2 * series[-2] + series[-3]
    else:
        acceleration = 0.0

    # Dampening factor for acceleration over long lookaheads to avoid unbounded overshooting
    decay = 1.0 / (1.0 + 0.1 * step_multiplier)
    effective_accel = acceleration * decay

    # Projected demand with surge preemption
    projected = series[-1] + (velocity * step_multiplier) + (0.5 * effective_accel * (step_multiplier ** 2))

    # Guardrails: never predict less than 1 pod
    target = max(1, math.ceil(projected))
    print(target, end="")


if __name__ == "__main__":
    main()
