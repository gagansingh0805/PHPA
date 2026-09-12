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
"""
Tests the LSTM prediction algorithm by calling it via subprocess, feeding stdin and verifying
stdout, stderr, and exit status codes.
"""
import subprocess
import sys


def test_lstm(subtests=None):
    """
    Test the LSTM algorithm
    """
    test_cases = [
        {
            "description": "Empty stdin",
            "expected_status_code": 1,
            "expected_stderr": "No standard input provided to LSTM algorithm, exiting\n",
            "expected_stdout": "",
            "stdin": "",
        },
        {
            "description": "Invalid JSON stdin",
            "expected_status_code": 1,
            "expected_stderr": "Invalid JSON provided: Expecting value: line 1 column 1 (char 0), exiting\n",
            "expected_stdout": "",
            "stdin": "invalid",
        },
        {
            "description": "JSON stdin missing 'lookAhead'",
            "expected_status_code": 1,
            "expected_stderr": "Invalid JSON provided: missing 'look_ahead', exiting\n",
            "expected_stdout": "",
            "stdin": """{
                "replicaHistory": [
                    {
                        "time": "2026-09-12T00:55:33Z",
                        "replicas": 2
                    }
                ]
            }""",
        },
        {
            "description": "Invalid timestamp provided",
            "expected_status_code": 1,
            "expected_stderr": "Invalid datetime format: time data 'invalid' does not match format '%Y-%m-%dT%H:%M:%SZ'\n",
            "expected_stdout": "",
            "stdin": """{
                "lookAhead": 10000,
                "replicaHistory": [
                    {
                        "time": "invalid",
                        "replicas": 2
                    }
                ]
            }""",
        },
        {
            "description": "Invalid current time provided",
            "expected_status_code": 1,
            "expected_stderr": "Invalid datetime format: time data 'invalid' does not match format '%Y-%m-%dT%H:%M:%SZ'\n",
            "expected_stdout": "",
            "stdin": """{
                "lookAhead": 15000,
                "currentTime": "invalid",
                "replicaHistory": []
            }""",
        },
        {
            "description": "Successful prediction, lookAhead 0",
            "expected_status_code": 0,
            "expected_stderr": "",
            "expected_stdout": "4",
            "stdin": """{
                "lookAhead": 0,
                "replicaHistory": [
                    {
                        "replicas": 1,
                        "time": "2026-09-12T00:55:30Z"
                    },
                    {
                        "replicas": 2,
                        "time": "2026-09-12T00:55:45Z"
                    },
                    {
                        "replicas": 4,
                        "time": "2026-09-12T00:56:00Z"
                    }
                ]
            }""",
        },
        {
            "description": "Successful proactive prediction, 45s surge curvature lookahead",
            "expected_status_code": 0,
            "expected_stderr": "",
            "expected_stdout": "20",
            "stdin": """{
                "lookAhead": 45000,
                "replicaHistory": [
                    {
                        "replicas": 2,
                        "time": "2026-09-12T00:55:00Z"
                    },
                    {
                        "replicas": 4,
                        "time": "2026-09-12T00:55:15Z"
                    },
                    {
                        "replicas": 7,
                        "time": "2026-09-12T00:55:30Z"
                    }
                ]
            }""",
        },
    ]

    for i, test_case in enumerate(test_cases):
        def run_test():
            result = subprocess.run(
                [sys.executable, "./algorithms/lstm/lstm.py"],
                input=test_case["stdin"].encode("utf-8"),
                capture_output=True,
                check=False,
            )
            stderr = result.stderr.decode("utf-8") if result.stderr else ""
            stdout = result.stdout.decode("utf-8") if result.stdout else ""

            assert test_case["expected_status_code"] == result.returncode, f"Status code mismatch in {test_case['description']}: got {result.returncode}, want {test_case['expected_status_code']}"
            assert test_case["expected_stderr"] == stderr, f"Stderr mismatch in {test_case['description']}: got {stderr!r}, want {test_case['expected_stderr']!r}"
            assert test_case["expected_stdout"] == stdout, f"Stdout mismatch in {test_case['description']}: got {stdout!r}, want {test_case['expected_stdout']!r}"

        if subtests is not None:
            with subtests.test(msg=test_case["description"], i=i):
                run_test()
        else:
            run_test()


if __name__ == "__main__":
    test_lstm()
    print("test_lstm passed successfully!")
